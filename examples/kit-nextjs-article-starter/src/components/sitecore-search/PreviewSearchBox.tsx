'use client';

/**
 * Header preview-search (typeahead) on embedded SitecoreAI Search.
 *
 * `useSuggest` returns query completions plus a handful of preview documents as
 * the visitor types. Submitting (Enter), picking a suggestion, or "View all
 * results" navigates to the full /search page, which runs the real query.
 *
 * If no search source is configured, a plain input is rendered that still routes
 * to /search on submit, so the header keeps working without search.
 */

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { Search } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useSitecore } from '@sitecore-content-sdk/nextjs';
import { useSuggest } from '@sitecore-content-sdk/nextjs/search';
import type { SearchDocument } from '@sitecore-content-sdk/search';
import { Input } from '@/components/ui/input';
import { dictionaryKeys } from '@/variables/dictionary';
import { SEARCH_FIELDS, SEARCH_INDEX_ID, isSearchConfigured, toSearchLocale } from './search-config';

const inputClass = 'rounded-full pl-9';
const MIN_CHARS = 2;

function goToSearch(router: ReturnType<typeof useRouter>, query: string) {
  const q = query.trim();
  router.push(q ? `/search?q=${encodeURIComponent(q)}` : '/search');
}

const text = (doc: SearchDocument, field: string): string | undefined => {
  const v = doc[field];
  if (v == null || typeof v === 'object') return undefined;
  return String(v);
};

/** Typeahead backed by the source's suggest endpoint. */
const SuggestSearch = ({ maxPreview = 6 }: { maxPreview?: number }) => {
  const router = useRouter();
  const t = useTranslations();
  const { page } = useSitecore();
  const [value, setValue] = useState('');

  const active = value.trim().length >= MIN_CHARS;

  const { querySuggestions, previewResults, isLoading, isError } = useSuggest<SearchDocument>({
    searchIndexId: SEARCH_INDEX_ID,
    query: value.trim(),
    enabled: active,
    keepPreviousData: true,
    locale: toSearchLocale(page.locale),
  });

  const onSubmit = (event: FormEvent) => {
    event.preventDefault();
    goToSearch(router, value);
  };

  const previews = previewResults.slice(0, maxPreview);
  const suggestions = querySuggestions.slice(0, 5);

  return (
    <form onSubmit={onSubmit} className="relative w-full max-w-sm">
      <div className="relative">
        <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
        <Input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          autoComplete="off"
          placeholder={t(dictionaryKeys.PREVIEW_SEARCH_PLACEHOLDER)}
          aria-label={t(dictionaryKeys.PREVIEW_SEARCH_PLACEHOLDER)}
          className={inputClass}
        />
      </div>

      {active && (
        <div className="border-border bg-popover text-popover-foreground absolute top-12 right-0 left-0 z-50 overflow-hidden rounded-xl border shadow-lg">
          {isLoading && previews.length === 0 ? (
            <div className="text-muted-foreground px-4 py-3 text-sm">Searching…</div>
          ) : isError ? (
            <div className="text-muted-foreground px-4 py-3 text-sm">Search is unavailable right now.</div>
          ) : (
            <ul className="max-h-96 overflow-auto">
              {suggestions.map((s) => (
                <li key={`s-${s.text}`}>
                  <button
                    type="button"
                    className="hover:bg-accent hover:text-accent-foreground block w-full px-4 py-2 text-left text-sm"
                    onClick={() => goToSearch(router, s.queryPlusText || s.text)}
                  >
                    <Search className="mr-2 inline h-3 w-3 opacity-60" aria-hidden="true" />
                    {s.queryPlusText || s.text}
                  </button>
                </li>
              ))}
              {previews.map((doc, index) => {
                const url = text(doc, SEARCH_FIELDS.url);
                const title = text(doc, SEARCH_FIELDS.title) || 'Untitled';
                return (
                  <li key={text(doc, SEARCH_FIELDS.id) || url || index}>
                    <a
                      href={url}
                      className="hover:bg-accent hover:text-accent-foreground block px-4 py-3 transition-colors"
                      onClick={(e) => {
                        if (!url) return;
                        e.preventDefault();
                        router.push(url);
                      }}
                    >
                      <p className="text-sm font-medium">{title}</p>
                    </a>
                  </li>
                );
              })}
              {suggestions.length === 0 && previews.length === 0 && (
                <li className="text-muted-foreground px-4 py-3 text-sm">No matching articles found.</li>
              )}
              <li>
                <button
                  type="button"
                  className="hover:bg-accent hover:text-accent-foreground block w-full px-4 py-3 text-left text-sm font-medium"
                  onClick={() => goToSearch(router, value)}
                >
                  View all results →
                </button>
              </li>
            </ul>
          )}
        </div>
      )}
    </form>
  );
};

/** Fallback used when no source is configured: routes to /search on submit. */
function PlainSearchInput() {
  const router = useRouter();
  const t = useTranslations();
  const [value, setValue] = useState('');
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        goToSearch(router, value);
      }}
      className="relative w-full max-w-sm"
    >
      <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
      <Input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={t(dictionaryKeys.PREVIEW_SEARCH_PLACEHOLDER)}
        aria-label={t(dictionaryKeys.PREVIEW_SEARCH_PLACEHOLDER)}
        className={inputClass}
      />
    </form>
  );
}

export function PreviewSearchBox() {
  if (!isSearchConfigured()) return <PlainSearchInput />;
  return <SuggestSearch />;
}
