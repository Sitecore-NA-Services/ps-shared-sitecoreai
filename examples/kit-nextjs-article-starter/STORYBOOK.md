# Storybook for Solterra landing pages

Storybook renders the production Solterra components (`src/components`) with mock Sitecore data so
landing pages can be designed outside Sitecore, then published into the `solterra` site through MCP.

```
Storybook (Vercel)                         Sitecore Agentic Studio
  static Storybook  ──────────────┐            │
  /mcp  (Storybook docs tools  ◄──┴─────────── │ 1. landing-page-get -> manifest + publish plan
         + Solterra tools)                     │ 2. sitecore-marketer MCP: create_page,
                                               │    add_component_on_page, create_content_item ...
                                               ▼
                                      solterra site (Landing Page)
```

## Layout

| Path | What it is |
| --- | --- |
| `.storybook/` | Storybook config (`@storybook/nextjs-vite`, docs + MCP addons, component manifest), preview styles/fonts, `public/solterra/` preview images |
| `.storybook/mocks/component-map.ts` | Empty component map aliased over `.sitecore/component-map` in Storybook only (the real map pulls in server-only code) |
| `src/stories/_support/` | Mock Sitecore page + providers, Solterra media catalog (media item IDs) and page catalog (page IDs) |
| `src/stories/components/` | One story file per Sitecore rendering, args written with Sitecore field names |
| `src/stories/landing-pages/` | Manifest types, registry of Sitecore IDs, adapters to component props, `LandingPage` renderer, publish plan, page manifests in `pages/` |
| `src/stories/docs/` | MDX docs (also served to agents via `docs-show`) |
| `storybook-mcp/` | MCP server: Storybook docs toolset (`@storybook/mcp`) plus Solterra tools, Node adapter, Vercel entry |
| `scripts/build-storybook-vercel.mjs` | Validates manifests and writes the Vercel Build Output (static Storybook + `/mcp` function) |

Stories live in `src/stories`, outside `src/components`, so the Sitecore CLI component map and import map
never include them.

## Commands

```bash
npm run storybook               # dev server on http://localhost:6006 (Storybook's own MCP at /mcp)
npm run build-storybook         # static build in storybook-static/
npm run build-storybook:vercel  # build + validate manifests + package for Vercel
npm run storybook:serve         # package and serve on http://localhost:6007 with the full /mcp server
```

`build-storybook:vercel` writes to `storybook-vercel-output/` locally and to `.vercel/output` only when
`VERCEL=1`, so it never touches the `vercel link` of this directory (the article-starter Next.js project).

## Vercel project

Create a new Vercel project from this repository (do not reuse `article-starter` or `article-starter-sai`):

| Setting | Value |
| --- | --- |
| Root Directory | `examples/kit-nextjs-article-starter` |
| Framework Preset | **Other** (not Next.js) |
| Build Command | `npm run build-storybook:vercel` |
| Output Directory | leave default (the build writes `.vercel/output`, Build Output API) |
| Install Command | default (`npm install`) |
| Node.js Version | 24.x |
| Environment variables | none |

Keep project settings in the dashboard. A `vercel.json` in this directory would also apply to the Next.js
Vercel projects that use the same root directory.

After deploy:

- Storybook: `https://<project>.vercel.app/`
- MCP server: `https://<project>.vercel.app/mcp` (Streamable HTTP, no auth, CORS open)

If Vercel Deployment Protection is on, Agentic Studio cannot reach `/mcp`; use the production domain with
protection off, or a protection bypass token.

## MCP tools

| Tool | Purpose |
| --- | --- |
| `docs-list`, `docs-show`, `docs-show-story` | Storybook docs toolset (component docs, story snippets, MDX pages) |
| `solterra-components-list` / `solterra-component-get` | Components a page can use, with rendering ID, datasource template, Sitecore fields, child items, variants |
| `landing-pages-list` / `landing-page-get` | Designed pages; `landing-page-get` returns the manifest, preview URL and the Sitecore publish plan |
| `landing-page-plan` | Validate an agent-written manifest and return its publish plan |
| `solterra-site-get` | Site, Landing Page template, container renderings, parent pages |

The publish plan is an ordered list of `sitecore-marketer` MCP calls (`create_page`,
`add_component_on_page`, `create_content_item`, `set_component_datasource`, `get_components_on_page`)
with every rendering, template and media ID filled in. Values like `{{page.id}}` come from earlier steps.
See the **Solterra/Publishing to Sitecore** docs page for the full workflow and known limits.

## Connecting Sitecore Agentic Studio

1. Add a remote MCP server pointing at `https://<project>.vercel.app/mcp` (HTTP / Streamable HTTP).
2. Give the agent both this server and the Sitecore marketer MCP for the environment that hosts `solterra`.
3. Suggested prompt: *"List the Solterra landing pages in Storybook, then create Community Solar in Sitecore
   by following its publish plan. Do not publish."*

## Adding a landing page

1. Copy a manifest in `src/stories/landing-pages/pages/`, give it a new `id` and `page.name`.
2. Add it to `pages/index.ts` and add a story to `LandingPages.stories.tsx` whose export name is the
   PascalCase of the `id` (`community-solar` -> `CommunitySolar`), so the MCP preview URL matches.
3. `npm run build-storybook:vercel` fails on invalid manifests (unknown fields, wrong value types,
   duplicate datasource names).

## Adding a component

The component must already exist as a Sitecore rendering used by Solterra. Add its IDs and fields to
`landing-pages/registry.ts` (read them with the Sitecore MCP `get_component` and an existing datasource
via `get_content_item_by_path`), an adapter in `adapters.ts` that mirrors the rendering's GraphQL
`ComponentQuery` aliases, the export in `SitecoreComponent.tsx`, and a story in `src/stories/components/`.
New images go in `.storybook/public/solterra/` and `_support/solterra-media.ts` with their media item ID.
