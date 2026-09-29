# Search Setup (Article Starter, embedded SitecoreAI Search)

Search in this starter runs on the **embedded SitecoreAI Search** that ships with the
platform (Content > Search Sources), through the Content SDK's search API:

- browser: `useSearch`, `useInfiniteSearch`, `useSuggest` from `@sitecore-content-sdk/nextjs/search`
- server: `SearchService` from `@sitecore-content-sdk/search`

There is no separate search account, customer key, API key or widget id. Requests are
authenticated with the site's Edge context id, and a **source** (an index plus its
crawl/field/ranking configuration) is addressed by its GUID.

> Before 2026-09 this starter used Sitecore Search (the CEC domain, `@sitecore-search/react`,
> `rfkid` widgets). That build is tagged `old-org-cec-search` in git and still runs at
> https://article-starter.vercel.app. Do not redeploy that project from this branch.

This starter includes:

- Header typeahead: `src/components/sitecore-search/PreviewSearchBox.tsx` (`useSuggest`).
- Results page: `src/components/sitecore-search/SearchResults.tsx` (`useSearch` with facets,
  sort and pagination), a Sitecore rendering placed on the `/search` page.
- Question panel: `src/components/sitecore-search/SearchQuestions.tsx`, which asks
  `/api/search-answer` for a grounded answer when the query reads as a question.
- Server retrieval: `src/lib/sitecore-search-query.ts` (`SearchService`), shared by the answer
  route and the Agent Chat / RAG Chat routes.
- The generic `SearchExperience` rendering from the official starter kit in
  `src/components/search-experience/`, kept verbatim so it stays diffable against upstream.
- Shared configuration: `src/components/sitecore-search/search-config.ts`.

## 1) Create the source

1. In SitecoreAI, open **Content > Search Sources** and click **Create Source**. The allowance
   is counted per organization ("View source usage"); if the button is disabled, another
   environment has to release a source first.
2. Choose **Site Source** for this starter. Enter the public URL of the rendering host (for the
   new-org build, `https://article-starter-sai.vercel.app`), confirm, pick a re-index schedule.
3. Indexing rules: the starter serves `/sitemap.xml` (driven by `NEXT_PUBLIC_SITEMAP_HOST`, which
   must be the same URL). Keep the discovered sitemap; add `/Articles` as a start URL if article
   detail pages are missing from it.
4. Locales: pick every language the site publishes (`en`, `es-MX`).
5. URL pattern filters: **Disallow** `/api`, `/_next`, `/search`, `/Search`, `/Agent-Chat`,
   `/RAG-Chat` and anything with `sc_mode=edit`. Rules are case-sensitive and the sitemap uses the
   Sitecore item names, so match the casing you see in `/sitemap.xml`.
6. Fields: use **Test Extraction** on one article URL, then keep at least `title`, `description`,
   `image`, `type`, `author`, `tags`, `date`. Mark `title`, `description` and `tags` **Searchable**,
   `type`, `author` and `tags` **Filterable**, `title` and `date` **Sortable**. Field names are
   yours to choose; if they differ from those defaults, set `NEXT_PUBLIC_SEARCH_FIELD_MAP`
   (see step 3).
7. Advanced settings: turn on semantic reranking and fuzzy search, then **Save**. Wait for the
   first crawl to finish (the source shows *Succeeded* under Last Index).
8. Copy the source GUID from the source's details page (it is the GUID in the page URL).

The source created for the new-org build on 2026-09-29 is **solterra-articles**,
`ea66061d-df98-4f10-9fe0-032e76e6713a`, with fields `title`, `description` (the whole `main` text),
`author`, `type` and `tags`, single language, no `image` or `date`. Its Vercel project therefore
sets `NEXT_PUBLIC_SEARCH_FIELD_MAP={"image":"","date":""}` so no date sort is offered.

Alternatives: a **Content Source** on the Article template indexes published items with their
real fields and needs no crawl; a **Push Source** takes documents from the Ingestion Service API.
Both plug into the same code, only the field names differ.

## 2) Tell the app which source to use

Two ways, and they can coexist:

- **Datasource item (authors):** install the **Search Configuration Manager** app from the
  Marketplace (Apps > Explore marketplace), give the `SearchResults` rendering a datasource whose
  `search` field is a Plugin field sourced to that app, and pick the source and field mapping on
  the component's *Search Configuration* tab in Page builder. The JSON stored is
  `{ "searchIndex": "<guid>", "fieldsMapping": { "title": "...", ... } }`.
- **Environment variable (everything else):** set `NEXT_PUBLIC_SEARCH_INDEX_ID=<guid>`. The header
  typeahead and the server routes always use this; the results rendering uses it when it has no
  datasource.

## 3) Environment variables

Copy `.env.remote.example` to `.env.local` (or set them on the hosting platform):

| Variable | Purpose |
| --- | --- |
| `SITECORE_EDGE_CONTEXT_ID`, `NEXT_PUBLIC_SITECORE_EDGE_CONTEXT_ID` | already required by the site; also authenticate search |
| `NEXT_PUBLIC_SEARCH_INDEX_ID` | source GUID (see step 2) |
| `NEXT_PUBLIC_SEARCH_FIELD_MAP` | optional JSON renaming indexed fields, e.g. `{"title":"page_title","date":""}` |
| `NEXT_PUBLIC_SEARCH_LOCALE_MAP` | optional JSON mapping Sitecore languages to source locale codes |
| `NEXT_PUBLIC_SITEMAP_HOST` | public URL the crawler and sitemap use |

Without `NEXT_PUBLIC_SEARCH_INDEX_ID` (or a datasource) the header renders a plain input that
routes to `/search`, and `/search` shows a "not configured" notice, so the app still builds.

## 4) Validate end to end

1. `npm run dev` in this folder, open the site, type in the header search: suggestions and
   preview results should appear after two characters.
2. Open `/search?q=solar`: results, facet counts and sorting should respond; select a facet and
   the counts should update.
3. Ask a question (`/search?q=how do solar panels work`): the answer panel streams in above the
   list. It is generated by Azure OpenAI from the top search results and hides itself when the
   articles do not cover the question.
4. Open Agent Chat and RAG Chat: both retrieve through `src/lib/sitecore-search-query.ts`.

## Differences from the CEC integration

- No curated Q&A groups. `querySitecoreQuestions()` returns nothing until a curated knowledge
  base exists again (a Q&A content source is the natural fit).
- No visitor events or personalization from the search layer.
- Sorting is by indexed fields you mark Sortable, not by console-configured sort options.
- Facet filters are plain field values (`eq`), not opaque facet ids.

## Troubleshooting

- `Search index ID is required`: the source GUID is missing (env or datasource).
- Requests return 400 mentioning locale: the source was created with fewer locales than the site
  publishes; add the locale to the source or map it with `NEXT_PUBLIC_SEARCH_LOCALE_MAP`.
- Results but empty cards: field names differ from the defaults; set `NEXT_PUBLIC_SEARCH_FIELD_MAP`.
- Nothing indexed: check the source's Last Index status and that the crawler can reach the site
  (Vercel Deployment Protection must be off for production, or the crawler IPs allow-listed).
- Some documents have no `title` (cards say "Untitled") although the page has one: Next.js streams
  `generateMetadata` and may place `<title>` and the og/article meta in the `<body>`, which the
  crawler ignores. This starter sets `htmlLimitedBots: /.*/` in `next.config.ts` so metadata is
  always blocking; keep that setting and re-crawl.
- Header typeahead shows matches but no query completions: `/v1/search/suggest` returns 400
  "suggestion is not enabled for this configuration". Suggestions are enabled per source by the
  platform and have no switch in the Search Sources UI yet; the component falls back to a plain
  search preview until they are on.
- `/search` shows "There was a problem loading this section": look for React error #185 in the
  console. Every object passed to `useSearch` (`facet`, `sort`) must be memoised, because the hook
  re-requests whenever their identity changes.
