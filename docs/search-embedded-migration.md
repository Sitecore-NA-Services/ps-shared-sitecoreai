# Moving the article starter to embedded SitecoreAI Search

**Branch:** `sitecoreai-embedded` (created 2026-09-29 from `main`, which is tagged `old-org-cec-search`).
**Rule:** the Vercel project `article-starter` (https://article-starter.vercel.app) is the demo build of
the old org plus Sitecore Search (CEC). It is never redeployed from this branch. The embedded-search
build ships to a **new** Vercel project.

## What changes

| Today (CEC, `main`) | Embedded SitecoreAI Search (this branch) |
| --- | --- |
| Search domain in the Customer Engagement Console, one shared index, widgets addressed by `rfkid` | **Search sources** inside SitecoreAI (Content > Search Sources). Each source is its own index, addressed by a source GUID (`searchIndexId`) |
| `@sitecore-search/react` + `@sitecore-search/ui` in the browser, `WidgetsProvider` with customer key + API key | `useSearch`, `useInfiniteSearch`, `useSuggest` from `@sitecore-content-sdk/nextjs/search` inside the existing `SitecoreProvider`; auth is the Edge context ID, no extra keys |
| Server retrieval by `POST discover.sitecorecloud.io/discover/v2/{domain}` in `src/lib/sitecore-search-query.ts` | `SearchService` from `@sitecore-content-sdk/search` (`search()` with keyphrase, facets, sort, locale; `suggest()`) |
| Facets configured per widget in CEC | Fields flagged Filterable on the source; requested with `facet: { all: true }` or `facet.fields` |
| Q&A groups (`questions_answers` entity, curated answers) | **No equivalent.** Curated Q&A has to be stored as items (or a push source) and generation stays in Azure OpenAI |
| Advanced web crawler with XPath/meta extractors, locale extractor | **Site source**: sitemap-driven crawl, per-field CSS/meta extraction, locales chosen per source, URL allow/deny rules |
| Events API, personalization, rules, synonyms | Rules (boost/bury/pin), semantic reranking, fuzzy search on the source. No visitor events yet |

Requirements found on 2026-09-29:

- Content SDK **2.4.0** is required for the `/search` subpath (`useSearch` and friends). The article
  starter is on 2.3.0; the upgrade also pulls `@sitecore-content-sdk/react` 2.4.0 and
  `@sitecore-content-sdk/search` 0.5.0. Peer range is Next 16.2+, React 19.2+, which we already meet.
- Search sources are enabled on the new tenant (`ps-shared-dev`, org CVR AMS).
- The org's search allowance is 4 source configs org-wide. It was full on 2026-09-29; the `testing`
  push source in KEB-Testing was deleted (with approval) to free one slot for ps-shared-dev.
- The Search Configuration Manager Marketplace app must be installed on the environment for authors to
  map fields in Page builder. Developers can also write the JSON straight into the datasource item.

## Source strategy

Crawl (site source) is still the right default for articles, for the same reasons as before: it picks
up rendered page text, Open Graph metadata and the sitemap without modelling every field. Two things
have to exist before the crawler can run:

1. A public URL for the new-org build (the new Vercel project) that serves `/sitemap.xml` for the
   site. `NEXT_PUBLIC_SITEMAP_HOST` must point at that URL.
2. A free source config in the org.

Alternatives, kept for later: a **content source** on the Article template gives structured fields
(title, summary, author, tags, dates) without a crawl and is the natural home for curated Q&A pairs if
we model them as items; a **push source** via the Ingestion Service API is the fallback for anything
external.

## Component plan

Copy the upstream `search-experience` component (product-listing starter, upstream `main`) as the
baseline, then rebuild the five surfaces the article starter has today:

| Surface | Today | After |
| --- | --- | --- |
| Header typeahead (`PreviewSearchBox`) | `usePreviewSearch` | `useSuggest` (query suggestions + preview results) |
| `/search` results (`SearchResults`) | `useSearchResults` with facets, sort, pagination | `useSearch` with `facet`, `sort`, `page`; datasource JSON gives `searchIndex` + `fieldsMapping` |
| `/search` Q&A + AI answer (`SearchQuestions`, `api/search-answer`) | `useQuestions` + Azure fallback | Azure answer grounded on `SearchService.search()` top-k; curated pairs only if we add a Q&A content source |
| Agent Chat tools (`api/chat/agent`) | Discover REST | `SearchService` in `src/lib/sitecore-search-query.ts` (same function names, new transport) |
| RAG Chat (`api/chat/rag`) | Discover REST + rerank | same as above; `rerank.ts` unchanged |

Sitecore items needed in the new org (once per site): `Search Experience` datasource template with a
`Search` field of type Plugin sourced to the Search Configuration Manager app, `Search Experience
Parameters` rendering parameters, a `SearchExperience` JSON rendering, and the rendering added to the
site's Available Renderings. Our repo already carries these for the SYNC site under
`authoring/items/.../click-click-launch`, so the article site can reuse them.

Environment variables that go away: every `NEXT_PUBLIC_SEARCH_*` and `SITECORE_SEARCH_*` value. The
component needs only the context ID and the source GUID from the datasource item. Azure OpenAI values
stay.

## Progress (2026-09-29)

- Done on this branch: Content SDK 2.4.0, `@sitecore-search/*` removed, `search-experience` component
  vendored from upstream, `PreviewSearchBox` on `useSuggest`, `SearchResults` on `useSearch` with facets
  and sort, `SearchQuestions` as an AI-only panel, `sitecore-search-query.ts` on `SearchService`,
  env example and `SITECORE_SEARCH_SETUP.md` rewritten. Typecheck and lint pass.
- Vercel project `article-starter-sai` (`prj_3eWSyjHllOqjReigIO0RwilqBX3q`) created with the new org's
  live context id, editing secret, site name and Azure values. Always target it by `VERCEL_PROJECT_ID`;
  the starter dir stays linked to the demo project.
- Incident: a non-interactive `vercel link` silently kept the demo link, so one production deploy and
  env writes hit `article-starter`. Rolled back to the previous deployment and env values restored the
  same hour. The demo is verified working.
- Next: first deploy of the branch, create the site source against the new URL, set
  `NEXT_PUBLIC_SEARCH_INDEX_ID`, install the Search Configuration Manager app for authors.

## Order of work

1. Free or obtain a source config (decision needed, see blocker above).
2. On this branch: bump Content SDK to 2.4.0, add the `search-experience` component, port the five
   surfaces, delete the `@sitecore-search/*` dependency.
3. Create the new Vercel project (proposed name `article-starter-sai`) from this branch with the new
   org's context IDs, editing secret, `NEXT_PUBLIC_DEFAULT_SITE_NAME=solterra` and the Azure values.
   Leave the old project untouched.
4. Create the site source against the new URL, choose locales `en` and `es-MX`, mark title,
   description, tags, author, type as searchable/filterable, save, wait for the first crawl.
5. Put the source GUID into the `global-search` datasource JSON, publish, verify `/search` and the
   typeahead, then the chat routes.
6. Editing host `kit-nextjs-article-starter` in the new org gets the same variable cleanup.
