'use client';

/**
 * `useSearch` with a response cache.
 *
 * The Content SDK's `useSearch` sends a request for every state change. The
 * Sitecore Search (CEC) SDK the original site used caches responses, so turning a
 * facet off and on again, or going back a page, was instant and sent nothing.
 * This hook keeps that behaviour: identical requests within CACHE_TTL_MS are
 * answered from memory, and the previous results stay on screen while a new
 * request is in flight (no flash of an empty list).
 *
 * Request and response shapes are the Content SDK's own `SearchService`, so the
 * hook can be swapped back for `useSearch` if the SDK gains a cache.
 */

import { useEffect, useMemo, useRef, useState } from 'react';
import { useSitecore } from '@sitecore-content-sdk/nextjs';
import { SearchService, type FacetField, type SearchDocument } from '@sitecore-content-sdk/search';

type SortField = { name: string; order: 'asc' | 'desc' };

export type CachedSearchOptions = {
  searchIndexId: string;
  /** Keyphrase; empty browses the whole source. */
  query: string;
  page?: number;
  pageSize?: number;
  sort?: SortField[];
  facet?: { fields: FacetField[] };
  locale?: string;
  enabled?: boolean;
};

type SearchPayload = {
  results: SearchDocument[];
  total: number;
  facets: Array<{ name: string; value: Array<{ text: string | number; count: number }> }>;
};

export type CachedSearchState = SearchPayload & {
  totalPages: number;
  isLoading: boolean;
  isError: boolean;
  /** True while showing the previous request's results during a new request. */
  isPreviousData: boolean;
};

const CACHE_TTL_MS = 5 * 60 * 1000;
const CACHE_MAX = 100;
const cache = new Map<string, { at: number; data: SearchPayload }>();

function readCache(key: string): SearchPayload | undefined {
  const hit = cache.get(key);
  if (!hit) return undefined;
  if (Date.now() - hit.at > CACHE_TTL_MS) {
    cache.delete(key);
    return undefined;
  }
  return hit.data;
}

function writeCache(key: string, data: SearchPayload) {
  if (cache.size >= CACHE_MAX) cache.delete(cache.keys().next().value as string);
  cache.set(key, { at: Date.now(), data });
}

const EMPTY: SearchPayload = { results: [], total: 0, facets: [] };

export function useCachedSearch(options: CachedSearchOptions): CachedSearchState {
  const { searchIndexId, query, page = 1, pageSize = 10, sort, facet, locale, enabled = true } = options;
  const { api } = useSitecore();
  const contextId = api?.edge?.clientContextId;
  const edgeUrl = api?.edge?.edgeUrl;

  const service = useMemo(
    () => (contextId ? new SearchService({ contextId, edgeUrl }) : null),
    [contextId, edgeUrl]
  );

  // One stable key per distinct request; also the cache key.
  const key = JSON.stringify({ searchIndexId, query, page, pageSize, sort, facet, locale });

  const [state, setState] = useState<{ key: string | null; data: SearchPayload; isError: boolean }>(
    () => {
      const cached = readCache(key);
      return { key: cached ? key : null, data: cached ?? EMPTY, isError: false };
    }
  );
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (!enabled || !service || !searchIndexId) return;
    // A cached request is answered during render (below); nothing to send.
    if (readCache(key)) return;
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    service
      .search(
        {
          searchIndexId,
          keyphrase: query,
          limit: pageSize,
          offset: (page - 1) * pageSize,
          ...(sort?.length ? { sort } : {}),
          ...(facet ? { facet } : {}),
          ...(locale !== undefined ? { locale } : {}),
        },
        { signal: controller.signal }
      )
      .then(({ results, total, facets }) => {
        if (controller.signal.aborted) return;
        const data: SearchPayload = {
          results: results as SearchDocument[],
          total,
          facets: (facets ?? []) as SearchPayload['facets'],
        };
        writeCache(key, data);
        setState({ key, data, isError: false });
      })
      .catch(() => {
        if (controller.signal.aborted) return;
        setState({ key, data: EMPTY, isError: true });
      });
    return () => controller.abort();
    // `key` encodes every request input; the individual values are listed via it.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, enabled, service]);

  // Serve cache hits straight from memory, as the CEC SDK did on facet toggles.
  const cached = enabled ? readCache(key) : undefined;
  if (cached) {
    return {
      ...cached,
      totalPages: Math.ceil(cached.total / pageSize),
      isLoading: false,
      isError: false,
      isPreviousData: false,
    };
  }
  const current = state.key === key;
  return {
    ...state.data,
    totalPages: Math.ceil(state.data.total / pageSize),
    isLoading: enabled && !current,
    isError: current && state.isError,
    isPreviousData: enabled && !current && state.key !== null,
  };
}
