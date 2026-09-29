#!/usr/bin/env node
/**
 * Push editing-host environment variables to SitecoreAI Deploy with the
 * Sitecore CLI (`dotnet sitecore cloud environment variable upsert`).
 *
 * Reads editing-hosts.ps-shared.json (or --config <file>) and, for every host
 * that has an environmentId, upserts each variable. Requires a CLI login that
 * can see the NEW organization:
 *
 *   cd authoring
 *   dotnet sitecore cloud login            # device flow, pick the new org
 *
 * Usage
 *   node set-editing-host-vars.mjs [--config editing-hosts.ps-shared.json] [--only host1,host2] [--dry-run]
 *
 * Value forms in the config
 *   "literal"        used as is
 *   "@dotenv"        read the same key from the host's "dotenv" file (e.g. the starter's .env.local)
 *   "$ENV:NAME"      read NAME from the shell environment, or from tools/content-transfer/.env.local
 *
 * Remember: Deploy applies variable changes on the next build/deploy of that editing host.
 */
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));

// Same git-ignored env file the transfer tool uses, so $ENV: references resolve without exporting anything.
for (const [key, value] of Object.entries(readDotEnv(path.join(HERE, '.env.local'), true))) {
  if (!(key in process.env)) process.env[key] = value;
}

const args = parseArgs(process.argv.slice(2));
const configFile = path.resolve(HERE, args.config || 'editing-hosts.ps-shared.json');
const config = JSON.parse(fs.readFileSync(configFile, 'utf8'));
const authoringDir = path.resolve(HERE, config.authoringDir || '../../authoring');
const only = args.only ? String(args.only).split(',').map((s) => s.trim()) : null;
const dryRun = Boolean(args['dry-run']);

let failures = 0;
let applied = 0;

for (const [hostName, host] of Object.entries(config.hosts || {})) {
  if (only && !only.includes(hostName)) continue;
  if (host.enabled === false && !only) {
    console.log(`-- ${hostName}: disabled, skipped`);
    continue;
  }
  if (!host.environmentId) {
    console.log(`-- ${hostName}: no environmentId yet, skipped (fill it in from 'dotnet sitecore cloud environment list --project-id <id>')`);
    continue;
  }
  const dotenv = host.dotenv ? readDotEnv(path.resolve(HERE, host.dotenv)) : {};
  console.log(`== ${hostName} (environment ${host.environmentId}${host.target ? `, target ${host.target}` : ''})`);

  for (const [name, spec] of Object.entries(host.vars || {})) {
    const value = resolveValue(spec, name, dotenv);
    if (value === undefined || value === '') {
      console.log(`   skip ${name}: no value resolved`);
      continue;
    }
    const secret = (host.secrets || []).includes(name);
    const cli = ['sitecore', 'cloud', 'environment', 'variable', 'upsert',
      '--environment-id', host.environmentId,
      '--name', name,
      '--value', value,
      '--config', authoringDir];
    if (host.target) cli.push('--target', host.target);
    if (secret) cli.push('--secret');

    const shown = secret ? `${name}=<secret ${value.length} chars>` : `${name}=${value}`;
    if (dryRun) {
      console.log(`   dry-run: ${shown}`);
      continue;
    }
    const result = spawnSync('dotnet', cli, { cwd: authoringDir, encoding: 'utf8', shell: false });
    if (result.status === 0) {
      applied += 1;
      console.log(`   ok   ${shown}`);
    } else {
      failures += 1;
      console.error(`   FAIL ${shown}\n${(result.stdout || '') + (result.stderr || '')}`);
    }
  }
}

console.log(`\n${applied} variable(s) upserted, ${failures} failure(s).${dryRun ? ' (dry run)' : ''}`);
if (!dryRun && applied) console.log('Redeploy the affected editing hosts for the new values to take effect.');
if (failures) process.exit(1);

function resolveValue(spec, name, dotenv) {
  if (typeof spec !== 'string') return spec == null ? undefined : String(spec);
  if (spec === '@dotenv') return dotenv[name];
  if (spec.startsWith('$ENV:')) return process.env[spec.slice(5)];
  return spec;
}

function readDotEnv(file, quiet = false) {
  const out = {};
  if (!fs.existsSync(file)) {
    if (!quiet) console.warn(`   warning: dotenv file not found: ${file}`);
    return out;
  }
  for (const raw of fs.readFileSync(file, 'utf8').split(/\r?\n/)) {
    const line = raw.trim();
    if (!line || line.startsWith('#')) continue;
    const eq = line.indexOf('=');
    if (eq < 0) continue;
    let value = line.slice(eq + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) value = value.slice(1, -1);
    out[line.slice(0, eq).trim()] = value;
  }
  return out;
}

function parseArgs(argv) {
  const out = { _: [] };
  for (let i = 0; i < argv.length; i += 1) {
    const a = argv[i];
    if (a.startsWith('--')) {
      const next = argv[i + 1];
      if (next !== undefined && !next.startsWith('--')) { out[a.slice(2)] = next; i += 1; } else out[a.slice(2)] = true;
    } else out._.push(a);
  }
  return out;
}
