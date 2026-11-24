import { McpServer } from 'tmcp';
import { ValibotJsonSchemaAdapter } from '@tmcp/adapter-valibot';
import { HttpTransport } from '@tmcp/transport-http';
import * as v from 'valibot';
import {
  STORYBOOK_MCP_INSTRUCTIONS,
  addGetDocumentationTool,
  addGetStoryDocumentationTool,
  addListAllDocumentationTool,
  type StorybookContext,
} from '@storybook/mcp';
import { LANDING_PAGES } from '../src/stories/landing-pages/pages';
import type { LandingPageManifest } from '../src/stories/landing-pages/manifest';
import { createPublishPlan } from '../src/stories/landing-pages/publish-plan';
import {
  SECTION_CONTAINERS,
  SITECORE_COMPONENTS,
  SOLTERRA_SITE,
  type ComponentKey,
} from '../src/stories/landing-pages/registry';
import { SOLTERRA_MEDIA } from '../src/stories/_support/solterra-media';
import { SOLTERRA_PAGES } from '../src/stories/_support/solterra-pages';

const SOLTERRA_INSTRUCTIONS = `
This server documents the Solterra (kit-nextjs-article-starter) Storybook and turns its landing page designs into Sitecore publish plans.

Workflow to publish a designed landing page to Sitecore:
1. landing-pages-list to see the designed pages, landing-page-get with an id to get its manifest and publish plan.
2. Run plan.steps in order with the Sitecore MCP tools (sitecore-marketer: create_page, add_component_on_page, create_content_item, set_component_datasource, get_components_on_page). Follow plan.instructions.
3. Report the page path, preview URL and any manual steps to the user. Never publish.

Workflow to design a NEW landing page from the existing components:
1. solterra-components-list, then solterra-component-get for each component you plan to use (fields, child items, limits). docs-show with the component's docsId shows rendered examples.
2. Write a manifest with the same shape as landing-page-get returns. Use Sitecore field names, media keys from solterra-component-get, and page keys for internal links.
3. landing-page-plan with the manifest. Fix every validation error, then run the plan as above.

${STORYBOOK_MCP_INSTRUCTIONS}`.trim();

const json = (data: unknown) => ({ content: [{ type: 'text' as const, text: JSON.stringify(data, null, 2) }] });
const error = (message: string) => ({
  content: [{ type: 'text' as const, text: message }],
  isError: true,
});

const storyUrl = (origin: string | undefined, storyId: string) =>
  origin ? `${origin}/?path=/story/${storyId}` : `?path=/story/${storyId}`;

const componentDocsId = (key: ComponentKey) =>
  SITECORE_COMPONENTS[key].storyTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-');

const FIELD_VALUE_FORMAT = {
  text: 'string (Rich Text fields take HTML)',
  image: '{ "media": "<media key>", "alt"?: "..." }',
  internalLink: '{ "text": "...", "page": "<page key>", "anchor"?: "..." }',
  externalLink: '{ "text": "...", "url": "https://...", "target"?: "_blank" }',
};

export type SolterraMcpOptions = {
  /** Returns the raw JSON of `manifests/components.json` or `manifests/docs.json`. */
  readManifest: (path: string) => Promise<string>;
};

export type SolterraMcpHandler = (request: Request) => Promise<Response>;

/** MCP server: Storybook docs toolset plus Solterra landing page tools. */
export async function createSolterraMcpHandler({ readManifest }: SolterraMcpOptions): Promise<SolterraMcpHandler> {
  const server = new McpServer(
    {
      name: 'solterra-storybook',
      version: '1.0.0',
      description: 'Solterra component docs and Sitecore landing page publish plans',
    },
    {
      adapter: new ValibotJsonSchemaAdapter(),
      instructions: SOLTERRA_INSTRUCTIONS,
      capabilities: { tools: { listChanged: true } },
    }
  ).withContext<StorybookContext>();

  await addListAllDocumentationTool(server);
  await addGetDocumentationTool(server);
  await addGetStoryDocumentationTool(server);

  const origin = () => {
    const request = server.ctx.custom?.request;
    return request ? new URL(request.url).origin : undefined;
  };

  server.tool(
    {
      name: 'solterra-components-list',
      title: 'List Solterra Sitecore components',
      description:
        'Lists the Sitecore components a Solterra landing page can use, with usage guidance, the Sitecore rendering name and the docs id for docs-show.',
    },
    () =>
      json(
        (Object.keys(SITECORE_COMPONENTS) as ComponentKey[]).map((key) => ({
          key,
          renderingName: SITECORE_COMPONENTS[key].renderingName,
          usage: SITECORE_COMPONENTS[key].usage,
          docsId: componentDocsId(key),
          hasChildItems: 'children' in SITECORE_COMPONENTS[key],
        }))
      )
  );

  server.tool(
    {
      name: 'solterra-component-get',
      title: 'Get a Solterra Sitecore component',
      description:
        'Returns the Sitecore rendering ID, datasource template, fields (Sitecore names and types), child item template and limits, variants and notes for one component, plus the media and page keys a manifest can reference.',
      schema: v.object({
        key: v.pipe(v.string(), v.description('Component key from solterra-components-list, e.g. "Hero"')),
      }),
    },
    ({ key }) => {
      if (!(key in SITECORE_COMPONENTS)) {
        return error(`Unknown component "${key}". Known: ${Object.keys(SITECORE_COMPONENTS).join(', ')}`);
      }
      return json({
        key,
        docsId: componentDocsId(key as ComponentKey),
        ...SITECORE_COMPONENTS[key as ComponentKey],
        fieldValueFormat: FIELD_VALUE_FORMAT,
        mediaKeys: Object.fromEntries(
          Object.entries(SOLTERRA_MEDIA).map(([mediaKey, media]) => [mediaKey, media.alt])
        ),
        pageKeys: Object.fromEntries(
          Object.entries(SOLTERRA_PAGES).map(([pageKey, page]) => [pageKey, page.route])
        ),
      });
    }
  );

  server.tool(
    {
      name: 'landing-pages-list',
      title: 'List designed landing pages',
      description:
        'Lists the Solterra landing pages designed in Storybook, with the page they will be created under, their sections and the preview URL.',
    },
    () =>
      json(
        LANDING_PAGES.map((manifest) => ({
          id: manifest.id,
          title: manifest.title,
          description: manifest.description,
          page: `${SOLTERRA_PAGES[manifest.page.parent].itemPath}/${manifest.page.name}`,
          sections: manifest.sections.map((section) => ({
            container: section.container,
            components: section.components.map((entry) => `${entry.component} "${entry.name}"`),
          })),
          previewUrl: storyUrl(origin(), `solterra-landing-pages--${manifest.id}`),
        }))
      )
  );

  server.tool(
    {
      name: 'landing-page-get',
      title: 'Get a landing page and its Sitecore publish plan',
      description:
        'Returns a designed landing page manifest (Sitecore field names and values) and the ordered Sitecore MCP calls that create it in the Solterra site.',
      schema: v.object({
        id: v.pipe(v.string(), v.description('Landing page id from landing-pages-list, e.g. "community-solar"')),
        language: v.optional(v.pipe(v.string(), v.description('Sitecore language, default "en"'))),
      }),
    },
    ({ id, language }) => {
      const manifest = LANDING_PAGES.find((page) => page.id === id);
      if (!manifest) {
        return error(`Unknown landing page "${id}". Known: ${LANDING_PAGES.map((page) => page.id).join(', ')}`);
      }
      return json({
        previewUrl: storyUrl(origin(), `solterra-landing-pages--${manifest.id}`),
        manifest,
        plan: createPublishPlan(manifest, language ?? 'en'),
      });
    }
  );

  server.tool(
    {
      name: 'landing-page-plan',
      title: 'Validate a landing page manifest and plan it',
      description:
        'Validates a landing page manifest you composed (same shape as landing-page-get returns) and returns the Sitecore publish plan. Fix validation.errors before running the plan.',
      schema: v.object({
        manifest: v.pipe(
          v.record(v.string(), v.unknown()),
          v.description(
            'Landing page manifest: { id, title, description, site: "solterra", page: { name, parent, fields }, sections: [{ container, components: [{ component, name, variant?, fields, children? }] }] }'
          )
        ),
        language: v.optional(v.string()),
      }),
    },
    ({ manifest, language }) => {
      const candidate = manifest as unknown as LandingPageManifest;
      if (!Array.isArray(candidate.sections) || typeof candidate.page !== 'object' || candidate.page === null) {
        return error('manifest needs "page" (object) and "sections" (array). Call landing-page-get for an example.');
      }
      try {
        return json(createPublishPlan(candidate, language ?? 'en'));
      } catch (planError) {
        return error(`Could not plan the manifest: ${(planError as Error).message}`);
      }
    }
  );

  server.tool(
    {
      name: 'solterra-site-get',
      title: 'Get Solterra site structure',
      description:
        'Returns the Solterra site, landing page template, section container renderings and the existing pages a new page can be created under.',
    },
    () => json({ site: SOLTERRA_SITE, containers: SECTION_CONTAINERS, pages: SOLTERRA_PAGES })
  );

  const transport = new HttpTransport(server, { path: null, cors: true });

  return async (request) => {
    const response = await transport.respond(request, {
      request,
      manifestProvider: (_request, path) => readManifest(path),
    });
    return response ?? new Response('Not found', { status: 404 });
  };
}
