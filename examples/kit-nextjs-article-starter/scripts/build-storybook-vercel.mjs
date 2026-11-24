/**
 * Packages the built Storybook (storybook-static) for Vercel using the Build Output API:
 *   static/            -> the Storybook site
 *   functions/mcp.func -> MCP server (Storybook docs toolset + Solterra landing page tools)
 *
 * On Vercel (VERCEL=1) the output goes to .vercel/output. Locally it goes to
 * storybook-vercel-output/ so it can never be picked up by `vercel deploy --prebuilt`
 * from this directory, which is linked to the article-starter Next.js project.
 *
 * Usage:
 *   npm run build-storybook:vercel            build Storybook, validate pages, package
 *   node scripts/build-storybook-vercel.mjs --serve   package and serve on http://localhost:6007
 */
import { build } from 'esbuild';
import { createServer } from 'node:http';
import { cp, readFile, rm, stat, writeFile } from 'node:fs/promises';
import { dirname, extname, join, normalize, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const storybookDir = join(root, 'storybook-static');
const outDir = join(root, process.env.VERCEL ? '.vercel/output' : 'storybook-vercel-output');
const functionDir = join(outDir, 'functions', 'mcp.func');
const serve = process.argv.includes('--serve');

const esmRequireBanner = {
  js: "import { createRequire as __createRequire } from 'node:module'; const require = __createRequire(import.meta.url);",
};

async function exists(path) {
  return stat(path).then(
    () => true,
    () => false
  );
}

async function validateLandingPages() {
  const result = await build({
    stdin: {
      contents: `
        import { LANDING_PAGES } from './src/stories/landing-pages/pages';
        import { validateManifest } from './src/stories/landing-pages/publish-plan';
        export default LANDING_PAGES.map((page) => ({ id: page.id, ...validateManifest(page) }));
      `,
      resolveDir: root,
      loader: 'ts',
    },
    bundle: true,
    platform: 'node',
    format: 'esm',
    write: false,
    logLevel: 'silent',
  });
  const module = await import(
    `data:text/javascript;base64,${Buffer.from(result.outputFiles[0].text).toString('base64')}`
  );
  let failed = false;
  for (const page of module.default) {
    for (const warning of page.warnings) console.warn(`  warn  ${page.id}: ${warning}`);
    for (const error of page.errors) console.error(`  error ${page.id}: ${error}`);
    failed ||= page.errors.length > 0;
  }
  if (failed) {
    throw new Error('Landing page manifests have validation errors.');
  }
  console.log(`Validated ${module.default.length} landing page manifest(s).`);
}

async function packageOutput() {
  if (!(await exists(join(storybookDir, 'index.html')))) {
    throw new Error('storybook-static/ not found. Run `npm run build-storybook` first.');
  }
  if (!(await exists(join(storybookDir, 'manifests', 'components.json')))) {
    throw new Error('storybook-static/manifests/components.json not found (features.componentsManifest).');
  }

  await rm(outDir, { recursive: true, force: true });
  await cp(storybookDir, join(outDir, 'static'), { recursive: true });

  await build({
    entryPoints: [join(root, 'storybook-mcp', 'vercel-function.ts')],
    outfile: join(functionDir, 'index.mjs'),
    bundle: true,
    platform: 'node',
    format: 'esm',
    target: 'node22',
    banner: esmRequireBanner,
    logLevel: 'warning',
  });
  await cp(join(storybookDir, 'manifests'), join(functionDir, 'manifests'), { recursive: true });
  await writeFile(
    join(functionDir, '.vc-config.json'),
    JSON.stringify(
      {
        runtime: 'nodejs22.x',
        handler: 'index.mjs',
        launcherType: 'Nodejs',
        shouldAddHelpers: false,
        supportsResponseStreaming: true,
        maxDuration: 30,
      },
      null,
      2
    )
  );
  await writeFile(join(outDir, 'config.json'), JSON.stringify({ version: 3 }, null, 2));
  console.log(`Packaged Storybook + /mcp function in ${outDir}`);
}

const CONTENT_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript',
  '.mjs': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.webp': 'image/webp',
  '.woff2': 'font/woff2',
  '.ico': 'image/x-icon',
};

async function serveLocally(port = Number(process.env.PORT ?? 6007)) {
  const { default: mcp } = await import(pathToFileURL(join(functionDir, 'index.mjs')).href);
  const staticDir = join(outDir, 'static');
  createServer(async (req, res) => {
    const { pathname } = new URL(req.url ?? '/', 'http://localhost');
    if (pathname === '/mcp') {
      return mcp(req, res);
    }
    const file = normalize(join(staticDir, pathname.endsWith('/') ? `${pathname}index.html` : pathname));
    if (!file.startsWith(staticDir) || !(await exists(file))) {
      res.statusCode = 404;
      return res.end('Not found');
    }
    res.setHeader('Content-Type', CONTENT_TYPES[extname(file)] ?? 'application/octet-stream');
    res.end(await readFile(file));
  }).listen(port, () => console.log(`Storybook: http://localhost:${port}/  MCP: http://localhost:${port}/mcp`));
}

await validateLandingPages();
await packageOutput();
if (serve) {
  await serveLocally();
}
