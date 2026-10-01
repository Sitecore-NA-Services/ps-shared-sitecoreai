/**
 * Server-side retrieval against embedded SitecoreAI Search, used by the chat API
 * routes (Agent Chat tools, RAG grounding) and the search page's answer route.
 *
 * Uses `SearchService` from the Content SDK, the same client the browser hooks
 * (`useSearch`, `useSuggest`) sit on, so the server and the page query the same
 * source with the same field names (see
 * `src/components/sitecore-search/search-config.ts`).
 *
 * Authentication is the Edge context id: `SITECORE_EDGE_CONTEXT_ID` on the
 * server. No API key is involved.
 */

import { SearchService, type FacetField, type SearchDocument } from '@sitecore-content-sdk/search';
import {
  SEARCH_FIELDS,
  SEARCH_INDEX_ID,
  languageFacetFilter,
  toSearchLocale,
} from '@/components/sitecore-search/search-config';

const CONTEXT_ID = process.env.SITECORE_EDGE_CONTEXT_ID || process.env.NEXT_PUBLIC_SITECORE_EDGE_CONTEXT_ID || '';

let service: SearchService | null = null;

/** Lazily built so a missing context id fails per request, not at import time. */
function getService(): SearchService | null {
  if (!CONTEXT_ID || !SEARCH_INDEX_ID) return null;
  if (!service) service = new SearchService({ contextId: CONTEXT_ID });
  return service;
}

export type SearchDoc = {
  id: string;
  title: string;
  description?: string;
  url?: string;
  /** Cosine similarity (0-1) vs the query, added by rerankByRelevance(). Absent until reranked. */
  relevanceScore?: number;
};

/** Per-attempt time limit and attempt count for server-side searches. */
const SEARCH_TIMEOUT_MS = 6000;
const SEARCH_ATTEMPTS = 2;

/** Facet filters supported by the source's filterable fields. */
export type SearchFacets = {
  /** Filters on the content type field (e.g. "Project Update", "Case Study"). */
  contentType?: string;
  /** Filters on the author field. */
  author?: string;
  /** Filters on the tags field (topics). Matches articles tagged with ANY of the given values. */
  tags?: string[];
};

const str = (v: unknown): string | undefined => {
  if (v == null) return undefined;
  if (Array.isArray(v)) return v.length ? String(v[0]) : undefined;
  if (typeof v === 'object') return undefined;
  return String(v);
};

/** Normalises an indexed document into the small shape the chat prompts use. */
export function toSearchDoc(doc: SearchDocument): SearchDoc {
  return {
    id: str(doc[SEARCH_FIELDS.id]) || str(doc.id) || str(doc[SEARCH_FIELDS.url]) || '',
    title: str(doc[SEARCH_FIELDS.title]) || str(doc.name) || 'Untitled',
    description: str(doc[SEARCH_FIELDS.description]),
    url: str(doc[SEARCH_FIELDS.url]) || str(doc.url),
  };
}

/** Builds the `facet.fields[]` entries for whichever filters were provided. */
function buildFacetFields(facets?: SearchFacets, locale?: string): FacetField[] {
  const fields: FacetField[] = [];
  // Keep results in the visitor's language: the source holds en and es-MX articles.
  const language = languageFacetFilter(locale);
  if (language) fields.push(language);
  if (facets?.contentType) fields.push({ name: SEARCH_FIELDS.type, filters: [{ operator: 'eq', value: facets.contentType }] });
  if (facets?.author) fields.push({ name: SEARCH_FIELDS.author, filters: [{ operator: 'eq', value: facets.author }] });
  if (facets?.tags?.length) fields.push({ name: SEARCH_FIELDS.tags, filters: [{ operator: 'eq', value: facets.tags }] });
  return fields;
}

/**
 * Query the source and return a small set of article documents.
 * Optional `facets` narrow results by content type, author, and/or topic tags,
 * in addition to the free-text keyphrase. `locale` is the visitor's resolved
 * Sitecore content language (e.g. "es-MX").
 */
export async function querySitecoreSearch(
  keyphrase: string,
  limit = 5,
  facets?: SearchFacets,
  locale?: string
): Promise<SearchDoc[]> {
  const svc = getService();
  if (!svc) return [];

  const facetFields = buildFacetFields(facets, locale);

  // A failed search reads to the chat model as "no articles cover this", so it
  // answers "not covered" instead of answering. Give each attempt a time limit
  // and retry once before giving up (2026-10-01: one RAG Chat request stalled for
  // 30 s and declined a question its top article answered).
  for (let attempt = 1; attempt <= SEARCH_ATTEMPTS; attempt++) {
    try {
      const { results } = await svc.search(
        {
          searchIndexId: SEARCH_INDEX_ID,
          keyphrase: keyphrase?.trim() || undefined,
          limit,
          offset: 0,
          locale: toSearchLocale(locale),
          ...(facetFields.length ? { facet: { fields: facetFields } } : {}),
        },
        { signal: AbortSignal.timeout(SEARCH_TIMEOUT_MS) }
      );
      return results.map(toSearchDoc);
    } catch (error) {
      console.warn(
        `[sitecore-search] search attempt ${attempt} failed`,
        error instanceof Error ? error.message : error
      );
    }
  }
  return [];
}

export type FacetValues = {
  contentTypes: string[];
  authors: string[];
  tags: string[];
};

/**
 * Lists the available values (with result counts) for the content type, author,
 * and tags facets, so a caller can discover valid filter values for
 * querySitecoreSearch's `facets` argument before filtering by them.
 */
export async function listSearchFacetValues(keyphrase = '', locale?: string): Promise<FacetValues> {
  const empty: FacetValues = { contentTypes: [], authors: [], tags: [] };
  const svc = getService();
  if (!svc) return empty;

  try {
    const language = languageFacetFilter(locale);
    const { facets = [] } = await svc.search({
      searchIndexId: SEARCH_INDEX_ID,
      keyphrase: keyphrase?.trim() || undefined,
      // Only the facet block matters here; 1 is the smallest page the API accepts.
      limit: 1,
      offset: 0,
      locale: toSearchLocale(locale),
      facet: {
        fields: [
          { name: SEARCH_FIELDS.type },
          { name: SEARCH_FIELDS.author },
          { name: SEARCH_FIELDS.tags },
          ...(language ? [language] : []),
        ],
      },
    });
    const valuesOf = (name: string) => facets.find((f) => f.name === name)?.value?.map((v) => String(v.text)) ?? [];
    return {
      contentTypes: valuesOf(SEARCH_FIELDS.type),
      authors: valuesOf(SEARCH_FIELDS.author),
      tags: valuesOf(SEARCH_FIELDS.tags),
    };
  } catch (error) {
    console.warn('[sitecore-search] facet listing failed', error instanceof Error ? error.message : error);
    return empty;
  }
}

/** A curated question/answer pair. */
export type QuestionAnswer = {
  id?: string;
  question: string;
  answer: string;
};

export type QuestionsResult = {
  /** The single best answer to the asked question, when one exists. */
  exact?: QuestionAnswer;
  /** Related pairs. */
  related: QuestionAnswer[];
};

/**
 * Curated questions and answers.
 *
 * Sitecore Search (CEC) generated and curated Q&A pairs in "Question & Answer
 * groups"; embedded SitecoreAI Search has no equivalent capability. This keeps
 * the same contract for the chat tools and the answer route, but returns nothing
 * until a curated knowledge base exists again, for example as Q&A items indexed
 * by a content source and mapped here. Callers already treat an empty result as
 * "no curated answer" and fall back to grounded generation.
 */
export async function querySitecoreQuestions(
  keyphrase: string,
  relatedLimit = 4,
  locale?: string
): Promise<QuestionsResult> {
  void keyphrase;
  void relatedLimit;
  void locale;
  return { related: [] };
}
