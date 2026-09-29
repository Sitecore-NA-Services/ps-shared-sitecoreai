#!/usr/bin/env node
/**
 * SitecoreAI environment-to-environment content transfer.
 *
 * Drives the two APIs Sitecore ships for moving items between SitecoreAI
 * environments (the Package Designer replacement):
 *
 *   1. Content Transfer API  (source CM)  -> streams item/media chunks out
 *      and into the destination, which assembles them into `.raif` files.
 *   2. Item Transfer API     (destination) -> loads a `.raif` file into the
 *      destination `master` database.
 *
 * Each side authenticates with its own automation client, so this works
 * across organizations (old ps-shared org -> new ps-shared org).
 *
 * Node 20+ (global fetch, AbortSignal.timeout). No npm dependencies.
 *
 * Commands
 *   node transfer.mjs discover                 list what exists under the standard project roots on the
 *                                              source and whether the same path already exists on the destination
 *   node transfer.mjs plan     [--manifest f]  print the transfer groups/trees a run would send
 *   node transfer.mjs run      [--manifest f] [--only g1,g2] [--skip g1] [--dry-run] [--keep-blobs]
 *   node transfer.mjs status                   destination blobs + item-transfer jobs
 *   node transfer.mjs load --blob <name.raif>  (re)load an existing destination blob
 *
 * Configuration: environment variables, or tools/content-transfer/.env.local (see .env.example)
 *   SRC_CM_HOST  SRC_CLIENT_ID  SRC_CLIENT_SECRET
 *   DST_CM_HOST  DST_CLIENT_ID  DST_CLIENT_SECRET
 *   SITECORE_AUTHORITY (default https://auth.sitecorecloud.io)
 *   SITECORE_AUDIENCE  (default https://api.sitecorecloud.io)
 */
import fs from 'node:fs';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const RUNS_DIR = path.join(HERE, 'runs');
const CT_BASE = '/sitecore/api/content/transfer/v1';
const IT_BASE = '/sitecore/shell/api/v3/ItemsTransfer';
const GQL_PATH = '/sitecore/api/authoring/graphql/v1/';

loadDotEnv(path.join(HERE, '.env.local'));

const args = parseArgs(process.argv.slice(2));
const command = args._[0];
const CONCURRENCY = Number(args.concurrency ?? 4);
const POLL_MS = Number(args['poll-ms'] ?? 5000);
const POLL_TIMEOUT_MIN = Number(args['poll-timeout-min'] ?? 180);

const AUTHORITY = (process.env.SITECORE_AUTHORITY || 'https://auth.sitecorecloud.io').replace(/\/$/, '');
const AUDIENCE = process.env.SITECORE_AUDIENCE || 'https://api.sitecorecloud.io';

function help() {
  console.log(fs.readFileSync(fileURLToPath(import.meta.url), 'utf8').split('*/')[0].replace(/^\/\*\*?/, ''));
}

// ---------------------------------------------------------------------------
// Environments
// ---------------------------------------------------------------------------
class SitecoreEnv {
  constructor(label, prefix) {
    this.label = label;
    this.host = normalizeHost(requireEnv(`${prefix}_CM_HOST`));
    this.clientId = requireEnv(`${prefix}_CLIENT_ID`);
    this.clientSecret = requireEnv(`${prefix}_CLIENT_SECRET`);
    this.tokenValue = null;
    this.tokenExpiresAt = 0;
  }

  async token() {
    if (this.tokenValue && Date.now() < this.tokenExpiresAt - 5 * 60_000) return this.tokenValue;
    const body = new URLSearchParams({
      client_id: this.clientId,
      client_secret: this.clientSecret,
      grant_type: 'client_credentials',
      audience: AUDIENCE,
    });
    const res = await fetch(`${AUTHORITY}/oauth/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body,
      signal: AbortSignal.timeout(60_000),
    });
    if (!res.ok) {
      throw new Error(`[${this.label}] token request failed: ${res.status} ${await res.text()}`);
    }
    const json = await res.json();
    this.tokenValue = json.access_token;
    this.tokenExpiresAt = Date.now() + (json.expires_in ?? 900) * 1000;
    return this.tokenValue;
  }

  /**
   * Authenticated request with retry on transient failures.
   * @returns {Promise<Response>}
   */
  async request(pathname, init = {}, { retries = 5, timeoutMs = 300_000 } = {}) {
    const url = `https://${this.host}${pathname}`;
    let attempt = 0;
    for (;;) {
      attempt += 1;
      try {
        const headers = { Accept: 'application/json', ...(init.headers || {}), Authorization: `Bearer ${await this.token()}` };
        const res = await fetch(url, { ...init, headers, signal: AbortSignal.timeout(timeoutMs) });
        if ([429, 502, 503, 504].includes(res.status) && attempt <= retries) {
          await sleep(backoff(attempt, res.headers.get('retry-after')));
          continue;
        }
        return res;
      } catch (err) {
        if (attempt > retries) throw new Error(`[${this.label}] ${init.method || 'GET'} ${pathname} failed after ${attempt} attempts: ${err.message}`);
        await sleep(backoff(attempt));
      }
    }
  }

  async json(pathname, init, expect = [200]) {
    const res = await this.request(pathname, init);
    if (!expect.includes(res.status)) {
      throw new Error(`[${this.label}] ${init?.method || 'GET'} ${pathname} -> ${res.status}: ${truncate(await res.text())}`);
    }
    if (res.status === 204 || res.status === 404) return null;
    const text = await res.text();
    return text ? safeJson(text) : null;
  }

  async gql(query, variables) {
    const data = await this.json(GQL_PATH, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query, variables }),
    });
    if (data?.errors?.length) throw new Error(`[${this.label}] GraphQL: ${data.errors.map((e) => e.message).join('; ')}`);
    return data?.data;
  }
}

function source() { return new SitecoreEnv('source', 'SRC'); }
function destination() { return new SitecoreEnv('destination', 'DST'); }

// ---------------------------------------------------------------------------
// discover
// ---------------------------------------------------------------------------
const DISCOVERY_ROOTS = [
  '/sitecore/content',
  '/sitecore/templates/Project',
  '/sitecore/templates/Branches/Project',
  '/sitecore/templates/Feature',
  '/sitecore/templates/Foundation',
  '/sitecore/layout/Layouts/Project',
  '/sitecore/layout/Renderings/Project',
  '/sitecore/layout/Renderings/Feature',
  '/sitecore/layout/Placeholder Settings/Project',
  '/sitecore/layout/Placeholder Settings/Feature',
  '/sitecore/media library/Project',
  '/sitecore/media library/Feature',
  '/sitecore/system/Settings/Project',
  '/sitecore/system/Settings/Feature/JSS Experience Accelerator',
  '/sitecore/system/Modules/PowerShell/Script Library',
  '/sitecore/system/Modules/PowerShell/Script Library/JSS SXA',
  '/sitecore/system/Languages',
  '/sitecore/system/Settings/Services/Rendering Hosts',
];

const ITEM_QUERY = `
  query ($path: String!) {
    item(where: { path: $path }) {
      itemId
      name
      path
      template { name }
      children(first: 200) {
        nodes { itemId name path hasChildren template { name } }
      }
    }
  }`;

async function discover() {
  const src = source();
  const dst = destination();
  console.log(`Source:      ${src.host}\nDestination: ${dst.host}\n`);

  for (const root of DISCOVERY_ROOTS) {
    const srcItem = (await src.gql(ITEM_QUERY, { path: root }))?.item;
    if (!srcItem) {
      console.log(`## ${root}\n   (not on source)\n`);
      continue;
    }
    const dstRoot = (await dst.gql(ITEM_QUERY, { path: root }))?.item;
    const dstNames = new Map((dstRoot?.children?.nodes ?? []).map((n) => [n.path.toLowerCase(), n]));
    console.log(`## ${root}  ${dstRoot ? '' : '(ROOT MISSING ON DESTINATION - parent chain will not resolve)'}`);
    if (!srcItem.children?.nodes?.length) console.log('   (no children)');
    for (const child of srcItem.children?.nodes ?? []) {
      const onDst = dstNames.get(child.path.toLowerCase());
      let mark = onDst ? 'exists on destination' : 'new';
      if (onDst && onDst.itemId.toLowerCase() !== child.itemId.toLowerCase()) mark = `ID CONFLICT (src ${child.itemId} / dst ${onDst.itemId})`;
      console.log(`   ${pad(child.name, 44)} ${pad(child.template?.name ?? '', 32)} ${mark}`);
    }
    console.log('');
  }
  console.log('Note: /sitecore/system/Settings/Services/Rendering Hosts is listed for information only.');
  console.log('      Those items are generated from xmcloud.build.json on deploy and must NOT be transferred.');
}

// ---------------------------------------------------------------------------
// manifest / plan
// ---------------------------------------------------------------------------
function loadManifest() {
  const file = path.resolve(HERE, args.manifest || 'manifest.ps-shared.json');
  const manifest = JSON.parse(fs.readFileSync(file, 'utf8'));
  if (!Array.isArray(manifest.groups) || !manifest.groups.length) throw new Error(`${file}: "groups" must be a non-empty array`);
  const database = manifest.database || 'master';
  const defaultMerge = manifest.defaultMergeStrategy || 'OverrideExistingItem';
  const only = args.only ? String(args.only).split(',').map((s) => s.trim()) : null;
  const skip = args.skip ? String(args.skip).split(',').map((s) => s.trim()) : [];
  const groups = manifest.groups
    .filter((g) => (!only || only.includes(g.name)) && !skip.includes(g.name))
    .map((g) => ({
      name: g.name,
      description: g.description || '',
      trees: (g.trees || []).map((t) => ({
        ItemPath: t.path,
        Scope: t.scope || 'ItemAndDescendants',
        MergeStrategy: t.mergeStrategy || g.mergeStrategy || defaultMerge,
      })),
    }));
  for (const g of groups) {
    if (!g.trees.length) throw new Error(`group "${g.name}" has no trees`);
    for (const t of g.trees) {
      if (!t.ItemPath?.startsWith('/sitecore/')) throw new Error(`group "${g.name}": bad path ${t.ItemPath}`);
      if (!['SingleItem', 'ItemAndDescendants'].includes(t.Scope)) throw new Error(`group "${g.name}": bad scope ${t.Scope}`);
      if (!['OverrideExistingItem', 'KeepExistingItem', 'OverrideExistingTree'].includes(t.MergeStrategy)) throw new Error(`group "${g.name}": bad merge strategy ${t.MergeStrategy}`);
    }
  }
  return { file, database, groups };
}

async function plan() {
  const { file, database, groups } = loadManifest();
  console.log(`Manifest: ${file}\nDatabase: ${database}\n`);
  for (const g of groups) {
    console.log(`## ${g.name}${g.description ? `  - ${g.description}` : ''}`);
    for (const t of g.trees) {
      const warn = t.MergeStrategy === 'OverrideExistingTree' ? '   <-- DESTRUCTIVE: deletes the destination subtree first' : '';
      console.log(`   ${pad(t.Scope, 20)} ${pad(t.MergeStrategy, 22)} ${t.ItemPath}${warn}`);
    }
  }
  console.log(`\n${groups.length} transfer(s) would be created, one per group, in this order.`);
}

// ---------------------------------------------------------------------------
// run
// ---------------------------------------------------------------------------
async function run() {
  const { database, groups } = loadManifest();
  const dryRun = Boolean(args['dry-run']);
  const src = source();
  const dst = destination();
  fs.mkdirSync(RUNS_DIR, { recursive: true });
  const stamp = new Date().toISOString().replace(/[:.]/g, '-');

  console.log(`Source:      ${src.host}\nDestination: ${dst.host}\nDatabase:    ${database}\nGroups:      ${groups.map((g) => g.name).join(', ')}\n`);
  if (!dryRun) {
    // Fail fast on credentials before creating anything.
    await src.token();
    await dst.token();
  }

  const summary = [];
  for (const group of groups) {
    const report = { group: group.name, startedAt: new Date().toISOString(), trees: group.trees, steps: [] };
    const reportFile = path.join(RUNS_DIR, `${stamp}-${group.name}.json`);
    const save = () => fs.writeFileSync(reportFile, JSON.stringify(report, null, 2));
    console.log(`\n==================== ${group.name} ====================`);
    try {
      const raifFiles = await exportGroup(src, dst, database, group, dryRun, report, save);
      const loads = [];
      for (const raif of raifFiles) loads.push(await loadBlob(dst, database, raif, dryRun, report, save));
      report.finishedAt = new Date().toISOString();
      report.result = loads.every((l) => l.ok) ? 'ok' : 'errors';
      summary.push({ group: group.name, result: report.result, raif: raifFiles, report: reportFile });
    } catch (err) {
      report.finishedAt = new Date().toISOString();
      report.result = 'failed';
      report.error = String(err?.stack || err);
      summary.push({ group: group.name, result: 'failed', report: reportFile });
      console.error(`[${group.name}] FAILED: ${err.message}`);
      if (!args['continue-on-error']) {
        save();
        break;
      }
    } finally {
      save();
    }
  }

  console.log('\n==================== summary ====================');
  for (const s of summary) console.log(`${pad(s.result.toUpperCase(), 8)} ${pad(s.group, 28)} ${s.report}`);
  if (summary.some((s) => s.result !== 'ok')) process.exitCode = 1;
}

async function exportGroup(src, dst, database, group, dryRun, report, save) {
  const transferId = randomUUID();
  const body = { TransferId: transferId, Configuration: { DataTrees: group.trees, Database: database } };
  report.transferId = transferId;
  console.log(`[${group.name}] create transfer ${transferId}`);
  console.log(JSON.stringify(body, null, 2));
  if (dryRun) {
    console.log(`[${group.name}] dry-run: not sent`);
    return [];
  }

  await src.json(`${CT_BASE}/transfers`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  }, [202]);
  report.steps.push({ step: 'create', at: new Date().toISOString() });
  save();

  // Wait for the source to finish packaging.
  const deadline = Date.now() + POLL_TIMEOUT_MIN * 60_000;
  let statusJson;
  for (;;) {
    statusJson = await src.json(`${CT_BASE}/transfers/${transferId}/status`);
    const state = statusJson?.State;
    if (state === 'Completed') break;
    if (state === 'Failed' || state === 'NotFound') throw new Error(`source transfer ${transferId} state=${state}: ${truncate(JSON.stringify(statusJson))}`);
    if (Date.now() > deadline) throw new Error(`timed out waiting for source transfer ${transferId} (last state ${state})`);
    process.stdout.write(`[${group.name}] source packaging: ${state ?? '?'}\r`);
    await sleep(POLL_MS);
  }
  const chunkSets = statusJson.ChunkSetsMetadata ?? [];
  const totalItems = chunkSets.reduce((n, c) => n + (c.TotalItemCount ?? 0), 0);
  console.log(`\n[${group.name}] source ready: ${chunkSets.length} chunk set(s), ${totalItems} item(s)`);
  report.steps.push({ step: 'ready', at: new Date().toISOString(), chunkSets });
  save();

  const raifFiles = [];
  for (const cs of chunkSets) {
    const ids = Array.from({ length: cs.ChunkCount }, (_, i) => i);
    let done = 0;
    await mapLimit(ids, CONCURRENCY, async (chunkId) => {
      await copyChunk(src, dst, transferId, cs.ChunkSetId, chunkId);
      done += 1;
      process.stdout.write(`[${group.name}] chunk set ${cs.ChunkSetId}: ${done}/${cs.ChunkCount}\r`);
    });
    const complete = await dst.json(`${CT_BASE}/transfers/${transferId}/chunksets/${cs.ChunkSetId}/complete`, { method: 'POST' }, [200]);
    const name = complete?.ContentTransferFileName;
    if (!name) throw new Error(`complete chunk set ${cs.ChunkSetId}: no ContentTransferFileName in ${truncate(JSON.stringify(complete))}`);
    console.log(`\n[${group.name}] chunk set ${cs.ChunkSetId} -> ${name}`);
    raifFiles.push(name);
    report.steps.push({ step: 'chunkset-complete', at: new Date().toISOString(), chunkSetId: cs.ChunkSetId, raif: name });
    save();
  }

  // Clean up the source. 404 just means it already aged out.
  const del = await src.request(`${CT_BASE}/transfers/${transferId}`, { method: 'DELETE' });
  if (![202, 404].includes(del.status)) console.warn(`[${group.name}] warning: source cleanup returned ${del.status}`);
  report.steps.push({ step: 'source-deleted', at: new Date().toISOString(), status: del.status });
  save();
  return raifFiles;
}

async function copyChunk(src, dst, transferId, chunkSetId, chunkId) {
  const chunkPath = `${CT_BASE}/transfers/${transferId}/chunksets/${chunkSetId}/chunks/${chunkId}`;
  const get = await src.request(chunkPath, { headers: { Accept: '*/*' } }, { timeoutMs: 600_000 });
  if (get.status !== 200) throw new Error(`GET chunk ${chunkSetId}/${chunkId} -> ${get.status}: ${truncate(await get.text())}`);
  const disposition = get.headers.get('content-disposition') || '';
  const match = /IsMedia\s*=\s*"?(true|false)"?/i.exec(disposition) || /IsMedia\s*=\s*"?(true|false)"?/i.exec(get.headers.get('ismedia') || '');
  if (!match) throw new Error(`GET chunk ${chunkSetId}/${chunkId}: cannot read IsMedia from Content-Disposition "${disposition}"`);
  const isMedia = match[1].toLowerCase() === 'true';
  const bytes = Buffer.from(await get.arrayBuffer());

  const put = await dst.request(`${chunkPath}?isMedia=${isMedia}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/octet-stream' },
    body: bytes,
  }, { timeoutMs: 600_000 });
  if (put.status !== 201) throw new Error(`PUT chunk ${chunkSetId}/${chunkId} -> ${put.status}: ${truncate(await put.text())}`);
}

// ---------------------------------------------------------------------------
// load (.raif -> destination database)
// ---------------------------------------------------------------------------
async function load() {
  const blob = args.blob;
  if (!blob) throw new Error('load requires --blob <name.raif>');
  const dst = destination();
  fs.mkdirSync(RUNS_DIR, { recursive: true });
  const report = { group: 'load', blob, steps: [] };
  const reportFile = path.join(RUNS_DIR, `${new Date().toISOString().replace(/[:.]/g, '-')}-load.json`);
  const result = await loadBlob(dst, args.database || 'master', blob, false, report, () => fs.writeFileSync(reportFile, JSON.stringify(report, null, 2)));
  if (!result.ok) process.exitCode = 1;
}

async function loadBlob(dst, database, blobName, dryRun, report, save) {
  const tag = `[load ${blobName}]`;
  if (dryRun) {
    console.log(`${tag} dry-run: would POST ${IT_BASE}/transfers/databases/${database}/sources?blobName=${blobName}`);
    return { ok: true };
  }
  const deadline = Date.now() + POLL_TIMEOUT_MIN * 60_000;

  // 1. wait for the blob to be Uploaded
  for (;;) {
    const info = await dst.json(`${IT_BASE}/sources/blobs/${encodeURIComponent(blobName)}`, undefined, [200, 404]);
    const state = info?.BlobState;
    if (state === 'Uploaded') break;
    if (['Error', 'Discarded'].includes(state)) throw new Error(`${tag} blob state ${state}: ${info?.Error ?? ''}`);
    if (['Consumed', 'Transferred', 'TransferredWithErrors', 'Queued', 'Initializing'].includes(state)) {
      console.log(`${tag} blob already ${state}; skipping consume, checking transfer status`);
      break;
    }
    if (Date.now() > deadline) throw new Error(`${tag} timed out waiting for blob to upload (last ${state})`);
    process.stdout.write(`${tag} blob state: ${state ?? 'not listed yet'}\r`);
    await sleep(POLL_MS);
  }

  // 2. consume it
  let transferId = null;
  const start = await dst.request(`${IT_BASE}/transfers/databases/${database}/sources?blobName=${encodeURIComponent(blobName)}`, { method: 'POST' });
  if (start.status === 202) {
    const location = start.headers.get('location') || '';
    transferId = decodeURIComponent(location.split('?')[0].split('/').filter(Boolean).pop() || '');
    console.log(`\n${tag} consuming -> transfer ${transferId}`);
  } else {
    const text = await start.text();
    console.warn(`\n${tag} consume returned ${start.status}: ${truncate(text)}; looking up existing transfer for this blob`);
  }
  report.steps.push({ step: 'consume', at: new Date().toISOString(), blob: blobName, transferId, status: start.status });
  save();

  // 3. poll
  let details = null;
  for (;;) {
    details = null;
    if (transferId && transferId.startsWith("consumed.")) {
      details = await dst.json(`${IT_BASE}/transfers/${encodeURIComponent(transferId)}`, undefined, [200, 404]);
    }
    if (!details) {
      // The location header ends in the blob name, not the transfer Id, so match on SourceName and take the newest.
      const list = await dst.json(`${IT_BASE}/transfers?page=1&pageSize=50`);
      const matches = (list?.Transfers ?? []).filter((t) => t.SourceName === blobName);
      matches.sort((x, y) => String(y.ConsumedDate).localeCompare(String(x.ConsumedDate)));
      details = matches[0] ?? null;
      if (details?.Id) {
        transferId = details.Id;
        const full = await dst.json(`${IT_BASE}/transfers/${encodeURIComponent(transferId)}`, undefined, [200, 404]);
        if (full) details = full;
      }
    }
    const state = details?.TransferState;
    if (state === 'Finished') break;
    if (state === 'Failed' || state === 'Discarded') {
      console.error(`${tag} transfer ${state}: ${details?.Description ?? ''}`);
      if (state === 'Failed' && !report.retried) {
        report.retried = true;
        console.log(`${tag} retrying once via PUT`);
        await dst.json(`${IT_BASE}/transfers/databases/${database}/sources/${encodeURIComponent(blobName)}`, { method: 'PUT' }, [200, 202]);
        await sleep(POLL_MS);
        continue;
      }
      report.steps.push({ step: 'transfer-failed', at: new Date().toISOString(), details });
      save();
      return { ok: false, details };
    }
    if (Date.now() > deadline) throw new Error(`${tag} timed out waiting for item transfer (last ${state})`);
    process.stdout.write(`${tag} transfer state: ${state ?? 'pending'}  ${details?.TransferredItemsCount ?? '?'}/${details?.TotalItemsCount ?? '?'} items\r`);
    await sleep(POLL_MS);
  }
  console.log(`\n${tag} finished: ${details.TransferredItemsCount ?? '?'}/${details.TotalItemsCount ?? '?'} items written`);
  const errors = details.ValidationErrors ?? [];
  if (errors.length) {
    console.warn(`${tag} ${errors.length} validation error(s):`);
    for (const e of errors.slice(0, 50)) console.warn(`   - ${e}`);
    if (errors.length > 50) console.warn(`   ... ${errors.length - 50} more in the run report`);
  }
  report.steps.push({ step: 'transfer-finished', at: new Date().toISOString(), details });
  save();

  // 4. clean up the blob
  if (!args['keep-blobs']) {
    const del = await dst.request(`${IT_BASE}/sources/blobs/${encodeURIComponent(blobName)}`, { method: 'DELETE' });
    if (![204, 404].includes(del.status)) console.warn(`${tag} warning: blob cleanup returned ${del.status}`);
    report.steps.push({ step: 'blob-deleted', at: new Date().toISOString(), status: del.status });
    save();
  }
  return { ok: errors.length === 0, details };
}

// ---------------------------------------------------------------------------
// status
// ---------------------------------------------------------------------------
async function status() {
  const dst = destination();
  console.log(`Destination: ${dst.host}\n`);
  const blobs = await dst.json(`${IT_BASE}/sources/blobs?page=1&pageSize=50`);
  console.log(`## blobs (${blobs?.TotalCount ?? 0})`);
  for (const b of blobs?.Sources ?? []) console.log(`   ${pad(b.BlobState, 22)} ${b.Name}`);
  const transfers = await dst.json(`${IT_BASE}/transfers?page=1&pageSize=50`);
  console.log(`\n## item transfers (${transfers?.TotalCount ?? 0})`);
  for (const t of transfers?.Transfers ?? []) console.log(`   ${pad(t.TransferState, 12)} ${pad(t.Strategy ?? '', 22)} ${pad(t.ConsumedDate ?? '', 26)} ${t.SourceName}  ${t.Id}`);
}

// ---------------------------------------------------------------------------
// helpers
// ---------------------------------------------------------------------------
function requireEnv(name) {
  const v = process.env[name];
  if (!v) throw new Error(`missing ${name} (set it in the environment or tools/content-transfer/.env.local)`);
  return v;
}

function normalizeHost(h) {
  return h.replace(/^https?:\/\//i, '').replace(/\/.*$/, '');
}

function loadDotEnv(file) {
  if (!fs.existsSync(file)) return;
  for (const raw of fs.readFileSync(file, 'utf8').split(/\r?\n/)) {
    const line = raw.trim();
    if (!line || line.startsWith('#')) continue;
    const eq = line.indexOf('=');
    if (eq < 0) continue;
    const key = line.slice(0, eq).trim();
    let value = line.slice(eq + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) value = value.slice(1, -1);
    if (!(key in process.env)) process.env[key] = value;
  }
}

function parseArgs(argv) {
  const out = { _: [] };
  for (let i = 0; i < argv.length; i += 1) {
    const a = argv[i];
    if (a.startsWith('--')) {
      const key = a.slice(2);
      const next = argv[i + 1];
      if (next !== undefined && !next.startsWith('--')) {
        out[key] = next;
        i += 1;
      } else {
        out[key] = true;
      }
    } else {
      out._.push(a);
    }
  }
  return out;
}

async function mapLimit(items, limit, fn) {
  const queue = [...items];
  const workers = Array.from({ length: Math.min(limit, queue.length) }, async () => {
    while (queue.length) await fn(queue.shift());
  });
  await Promise.all(workers);
}

function backoff(attempt, retryAfter) {
  const ra = Number(retryAfter);
  if (Number.isFinite(ra) && ra > 0) return ra * 1000;
  return Math.min(30_000, 1000 * 2 ** (attempt - 1)) + Math.random() * 500;
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const pad = (s, n) => String(s ?? '').padEnd(n);
const truncate = (s, n = 600) => (s && s.length > n ? `${s.slice(0, n)}...` : s);
function safeJson(text) {
  try { return JSON.parse(text); } catch { return { raw: text }; }
}

// ---------------------------------------------------------------------------
// Entry (kept last so every const above is initialized before dispatch)
// ---------------------------------------------------------------------------
const commands = { discover, plan, run, status, load, help };
if (!command || !commands[command]) {
  help();
  process.exit(command ? 1 : 0);
}
Promise.resolve().then(() => commands[command]()).catch((err) => {
  console.error(`\n[FAIL] ${err?.stack || err}`);
  process.exit(1);
});
