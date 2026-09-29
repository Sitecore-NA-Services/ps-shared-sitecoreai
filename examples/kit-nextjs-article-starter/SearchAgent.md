# Search & Chat Agent Guide (Article Starter)

> **Update (2026-09-29):** retrieval now runs on embedded SitecoreAI Search (Content > Search
> Sources) through the Content SDK: `useSearch`/`useSuggest` in the browser and `SearchService` in
> `src/lib/sitecore-search-query.ts`. Where this guide says "Sitecore Search", "Discover REST API",
> `rfkid` or `questions_answers`, read the current setup in `SITECORE_SEARCH_SETUP.md`. Curated Q&A
> groups have no embedded equivalent yet, so `querySitecoreQuestions()` returns nothing and every
> answer is generated from retrieved articles.

> **This is `kit-nextjs-article-starter`-only.** Sitecore Search, Azure OpenAI,
> and everything else in this doc live entirely in this starter — no other
> starter in this repo depends on `@sitecore-search/*` or `AZURE_OPENAI_*`.
> Per the repo's multi-starter model (see the root `AGENTS.md`), nothing here
> is shared code; if another starter wants this, it gets copied and adapted,
> not imported.

This starter builds four visitor-facing experiences on top of one Sitecore
Search index: a header typeahead, a `/search` results page (with an inline
Q&A/answer panel), and two full chat pages (**Agent Chat** and **RAG Chat**).
All four read the same index; the two chat pages and the `/search` answer
panel additionally call Azure OpenAI to generate or ground a written answer.

This doc covers the query/agent/chat layer built on that index. For crawling
and indexing article content into Search in the first place (source, crawler,
entity mapping), see `SITECORE_SEARCH_SETUP.md`.

## Architecture

Four systems, each doing exactly one job:

| System | Role here | Talked to via |
|---|---|---|
| **SitecoreAI** (XM Cloud) | The CMS + rendering host. Owns the article content, the Q&A curation UI, and the pages these renderings are placed on. | `@sitecore-content-sdk/nextjs` (renderings, `useSitecore`, locale/layout data) |
| **Sitecore Search** | The retrieval backend: one hosted domain/index holding the `content` entity (articles) and the `questions_answers` entity (curated Q&A). No generation happens here. | `@sitecore-search/react` from the browser (widgets); a plain `fetch` to the Discover REST API (`sitecore-search-query.ts`) from the server |
| **Azure AI Foundry** (Azure OpenAI) | The generation backend: one chat-completion deployment (answers) and one embedding deployment (reranking). No retrieval happens here — it only ever sees what it's handed. | `@ai-sdk/azure` (`src/lib/azure-openai.ts`) |
| **Vercel AI SDK** | The glue between the two backends and the UI: streams model output, runs the agent's tool-calling loop, and drives chat state in React. | the `ai` package (`streamText`, `tool`, `embedMany`) server-side; `@ai-sdk/react` (`useChat`) client-side |

Roughly: a visitor action hits a Next.js API route → the route calls
**Sitecore Search** for retrieval (articles and/or curated Q&A) → the results
are handed to **Azure AI Foundry** through the **Vercel AI SDK**, which
streams the generated answer back to a **SitecoreAI** rendering in the
browser. The three "no LLM" rows in the table below skip the Azure/Vercel AI
half entirely and talk to Sitecore Search directly from the browser.

### The five surfaces

| Surface | File(s) | Backend | Model decides to search? |
|---|---|---|---|
| Header typeahead | `src/components/sitecore-search/PreviewSearchBox.tsx` | Search JS SDK (`usePreviewSearch`) | n/a — no LLM |
| `/search` results list | `src/components/sitecore-search/SearchResults.tsx` | Search JS SDK (`useSearchResults`) | n/a — no LLM |
| `/search` Q&A + AI answer panel | `src/components/sitecore-search/SearchQuestions.tsx` + `src/app/api/search-answer/route.ts` | Search JS SDK (`useQuestions`) for curated Q&A, then Azure OpenAI as a fallback | No — always retrieves, single model call, cached |
| **Agent Chat** page (`AgentChat` rendering) | `src/components/agent-chat/AgentChat.tsx` + `src/app/api/chat/agent/route.ts` | Azure OpenAI with tools | **Yes** — model calls `askKnowledgeBase`/`listArticleFacets`/`searchArticles` on its own judgment |
| **RAG Chat** page (`RagChat` rendering) | `src/components/rag-chat/RagChat.tsx` + `src/app/api/chat/rag/route.ts` | Azure OpenAI, retrieval forced every turn | No — every message retrieves top-k + curated Q&A before the model answers |

`AgentChat` and `RagChat` are Sitecore renderings (registered in
`.sitecore/component-map.ts`), not Next.js file routes — place them on
Sitecore items (this starter ships them at `/Agent-Chat` and `/RAG-Chat`) the
same way you'd place any other component.

### Shared server-side plumbing

- `src/lib/sitecore-search-query.ts` — the only place that calls the Sitecore
  Search runtime API (`POST /discover/v2/{domainId}`) from the server. Three
  functions:
  - `querySitecoreSearch()` — content search, with optional `contentType` /
    `author` / `tags` facet filters.
  - `listSearchFacetValues()` — lists valid facet values (with counts) so a
    caller can discover what to filter by.
  - `querySitecoreQuestions()` — queries the `questions_answers` Q&A widget
    (exact answer + related questions). English-only; see below.
- `src/lib/azure-openai.ts` — the Azure OpenAI provider (`chatModel` for
  generation, `embeddingModel` for reranking), plus a middleware that
  normalizes reasoning-model params (`gpt-5.x`/`o`-series reject
  `temperature`/`max_tokens`, wanting `max_completion_tokens` instead).
- `src/lib/rerank.ts` — Sitecore Search returns relevance-ordered results but
  no numeric score. `rerankByRelevance()` embeds the query + every candidate
  doc in one batched call and scores by cosine similarity;
  `filterByRelevance()` drops anything below `RAG_RELEVANCE_THRESHOLD`
  (default `0.45`, empirically the gap between matched and unmatched pairs for
  this corpus — see the comment in the file if you need to retune it for a
  different corpus).
- `src/lib/search-locale.ts` — maps a Sitecore content language (`es-MX`) to
  the Search API's `{ language, country }` pair. Shared by the client widgets
  and the server routes so both resolve the visitor's locale the same way.

### Locale behavior

- The visitor's Sitecore content language drives both what language the model
  responds in and what language it searches in (an English query won't match
  Spanish-indexed articles or vice versa) — see the `languageNote` string in
  each chat route.
- Q&A (`askKnowledgeBase` / the Q&A widget) only ever returns results for
  `en`; other locales fall back to `searchArticles`/RAG's plain retrieval.

## Setup

### Getting article content into your Solterra instance

None of this works until the index has something to find, and the index only
sees **published** content the crawler can reach — so content has to exist in
your XM Cloud instance before `SITECORE_SEARCH_SETUP.md`'s crawl step will
find anything.

- **Creating the site seeds a handful of sample articles for you.** Sites in
  this repo must be created through the XM Cloud **Sites** dashboard (there is
  no create-site API and a serialized site tree must never be pushed in) using
  the "Solterra & Co." site template. That scaffolding runs a Sitecore
  PowerShell script (`authoring/items/items/templates/items/ccl.powershell/Click Click Launch/Functions/Site 1 Site Setup.yml`)
  which, among other things, creates `Home/Articles/Article 1`, `Article 2`,
  `Article 3`, `QA Article 1`, and `QA Article 2` using the Article Page
  template. That's enough to verify the whole pipeline end-to-end, but five
  articles is too thin a corpus to meaningfully exercise facets, relevance
  scoring, or the Q&A generator.
- **There is no serialized content module for articles.** `authoring/items/ccl.module.json`
  only serializes templates, renderings, and media for this starter
  (`ccl.article.templates`, `ccl.media.ms`, etc.) — actual article *content*
  items are never checked into `/authoring` and `dotnet sitecore ser push`
  will not create or update them. Real article content has to be authored
  directly against the instance.
- **To add real articles**, author additional pages under `Home/Articles` in
  XM Cloud Pages (or the Content Editor) using the **Article Page** template,
  fill in the fields the Search entity mapping expects (title, summary/description,
  image, author, content type, topics — see `SITECORE_SEARCH_SETUP.md` §3),
  and **publish** them. Unpublished articles are invisible to both the
  rendering host's sitemap and the Search crawler.
- After publishing new articles, re-run (or wait for) the Search crawl —
  see `SITECORE_SEARCH_SETUP.md` §2/§5 — before expecting them to show up in
  any of the five surfaces above. Q&A pairs additionally need a fresh
  **Run Batch Generation** pass (see below) since they're pre-generated, not
  computed per-query.

### Sitecore Search (retrieval)

Beyond the source/crawler/entity setup in `SITECORE_SEARCH_SETUP.md`, the
chat/agent layer needs:

1. **A Search Results widget** (`content` entity) — its `rfkId` goes in
   `NEXT_PUBLIC_SEARCH_RESULTS_RFKID`. Facet attributes it should expose:
   `type`, `author`, `tags` (all three are used by `listArticleFacets` /
   `SearchResults`' filter sidebar).
2. **A Preview Search widget** — `rfkId` → `NEXT_PUBLIC_SEARCH_PREVIEW_RFKID`.
3. **A Q&A group** — CEC → Domain Settings → Feature Configuration →
   Question & Answer Groups. Saving a group auto-creates a
   `questions_answers` widget whose `rfkId` is `rfkid_<groupId>` — put that in
   `NEXT_PUBLIC_SEARCH_QUESTIONS_RFKID`. Then run **Content Collection → 
   Question & Answer Groups → Run Batch Generation** to pre-generate pairs
   from indexed documents; that same browser is where an editor curates or
   hides individual answers. Notes:
   - Q&A is **English-only** today — `querySitecoreQuestions()` and
     `SearchQuestionsPanel` both short-circuit to empty/`null` outside `en`.
   - The Q&A widget ignores a request-level `sources` filter; scoping comes
     entirely from the group config, so there's no per-request source
     narrowing like `SearchResults` has.
4. **Source scoping** (multi-site domains) — `NEXT_PUBLIC_SEARCH_SOURCE_IDS`
   (comma-separated). One Search domain has a single shared index across every
   site that feeds it; this scopes `SearchResults`/`PreviewSearchBox` to this
   site's source(s) only. The Q&A widget can't be scoped this way (see above).

### Azure OpenAI (generation)

Used by Agent Chat, RAG Chat, and the `/search` AI-answer fallback:

- `AZURE_OPENAI_RESOURCE_NAME`, `AZURE_OPENAI_API_KEY` — from Azure Portal →
  your Azure OpenAI resource → Keys and Endpoint.
- `AZURE_OPENAI_DEPLOYMENT` — the **deployment** name (not the model name) of
  a chat-capable model in Azure AI Foundry.
- `AZURE_OPENAI_EMBEDDING_DEPLOYMENT` — deployment name for an embedding
  model (e.g. `text-embedding-3-small`), used only for reranking.
- `AZURE_OPENAI_REASONING_MODEL` — leave unset to auto-detect from the
  deployment name (`gpt-5*`/`o[1-9]*`); set explicitly if you rename a
  reasoning deployment to something that doesn't match that pattern (see the
  comment in `azure-openai.ts` — this is a real footgun, not a hypothetical).
- `RAG_RELEVANCE_THRESHOLD` — optional override of the `0.45` default.

**Verified configuration:** this starter has actually been exercised against
`AZURE_OPENAI_DEPLOYMENT=gpt-5.6-luna` (a reasoning-class deployment, hence the
`max_completion_tokens` middleware) and `AZURE_OPENAI_EMBEDDING_DEPLOYMENT=text-embedding-3-small`,
on `AZURE_OPENAI_API_VERSION=2024-10-21`. Any chat-capable deployment and any
embedding deployment should work, but the `0.45` relevance threshold and the
0.6–0.75 vs. 0.15–0.4 score clusters it's tuned against (see `rerank.ts`) were
measured with this exact embedding deployment — re-measure if you swap it.

Leave the Azure OpenAI vars blank to leave Agent Chat/RAG Chat/the AI answer
panel unconfigured; the rest of the app (search widgets, Q&A) still works.

### Credentials: what's public vs. server-only

Sitecore Search is designed to be called from the browser with a
domain-scoped key — the `NEXT_PUBLIC_SEARCH_*` vars are meant to be public and
are read directly by the client SDK (`SearchProvider.tsx`). The server-side
helper (`sitecore-search-query.ts`) reuses those same public vars by default,
falling back to dedicated `SITECORE_SEARCH_*` server-only vars only if you set
them (useful if you want the server to query with different scoping/limits
than the browser widgets, or a domain/key the browser shouldn't see).

**`AZURE_OPENAI_API_KEY` is a real secret** and must never be prefixed
`NEXT_PUBLIC_` or referenced from a `'use client'` file — it's only read in
`src/lib/azure-openai.ts`, which every chat route imports server-side.

## Adding a new tool to Agent Chat

`src/app/api/chat/agent/route.ts` defines each tool with a Zod `parameters`
schema and an `execute` function. To add one:

1. Write the retrieval function in `sitecore-search-query.ts` (or a new lib
   file) — keep it server-only and defensive (return an empty/safe value on
   any failure rather than throwing, matching the existing `try { } catch { return empty }`
   pattern).
2. Register a `tool({ description, parameters, execute })` entry. The
   `description` is the only thing the model uses to decide *when* to call
   it, so be explicit about when to prefer it over the existing tools.
3. If the deployment has `structuredOutputs`/strict schemas on (reasoning
   models), every optional Zod field must actually be optional at the schema
   level — see the comment above `baseChatModel` in `azure-openai.ts`.
4. Surface the new tool's call/result in `AgentChat.tsx`'s
   `m.toolInvocations?.map(...)` block so visitors (and you, debugging) can
   see when it fired.

## Troubleshooting

- **Agent/RAG Chat renders but never gets search results**: check
  `SITECORE_SEARCH_DOMAIN_ID` resolves (it falls back to parsing
  `NEXT_PUBLIC_SEARCH_CUSTOMER_KEY`, which only works if that key still has
  the `xxx-<domainId>` shape) and that `SITECORE_SEARCH_API_KEY` /
  `NEXT_PUBLIC_SEARCH_API_KEY` is valid — `querySitecoreSearch()` fails silent
  (returns `[]`) on any missing config or non-2xx response, by design, so a
  misconfiguration looks like "no results" rather than an error.
- **Answers cite outside knowledge instead of saying "not covered"**: check
  the system prompt threshold logic in the relevant route
  (`agent/route.ts`, `rag/route.ts`, `search-answer/route.ts`) — each was
  explicitly hardened to refuse rather than blend in general knowledge below
  the relevance threshold; if a deployment swap changes model behavior here,
  it's a prompt issue, not a retrieval issue.
- **`/search` Q&A answer never appears for question-shaped queries**: confirm
  the Q&A batch generation job has run and the query is actually in English —
  `looksLikeQuestion()` in `SearchQuestions.tsx` also gates whether the
  `/api/search-answer` fallback even fires.
- **Reasoning model returns 400s**: see `AZURE_OPENAI_REASONING_MODEL` above.
