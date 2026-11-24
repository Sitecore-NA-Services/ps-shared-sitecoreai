import { readFile } from 'node:fs/promises';
import { basename, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { toNodeHandler } from './node-handler';
import { createSolterraMcpHandler, type SolterraMcpHandler } from './server';

/**
 * Vercel function entry (bundled to .vercel/output/functions/mcp.func/index.mjs by
 * scripts/build-storybook-vercel.mjs). The Storybook manifests are copied next to the
 * bundle so the function does not depend on fetching its own static files.
 */
const manifestsDir = join(dirname(fileURLToPath(import.meta.url)), 'manifests');

let handler: Promise<SolterraMcpHandler> | undefined;

export default toNodeHandler(() => {
  handler ??= createSolterraMcpHandler({
    readManifest: (path) => readFile(join(manifestsDir, basename(path)), 'utf-8'),
  });
  return handler;
});
