'use client';

/**
 * Header preview search (typeahead) on embedded SitecoreAI Search.
 *
 * Shows the top matching articles as the visitor types, matching the original
 * site's Sitecore Search (CEC) preview widget: no query completions, whole words
 * only, CEC's stop words ignored. Submitting (Enter) or "View all results" goes to
 * the full /search page. The source's Autocomplete setting is deliberately left
 * off for that reason: prefix completions would make this typeahead behave
 * differently from the original site's.
 *
 * If no search source is configured, a plain input is rendered that still routes
 * to /search on submit, so the header keeps working without search.
 */

import { useMemo, useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { Search } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useSitecore } from '@sitecore-content-sdk/nextjs';
import type { SearchDocument } from '@sitecore-content-sdk/search';
import { Input } from '@/components/ui/input';
import { dictionaryKeys } from '@/variables/dictionary';
import { routing } from '@/i18n/routing';
import {
  SEARCH_FIELDS,
  SEARCH_INDEX_ID,
  isSearchConfigured,
  languageFacetFilter,
  toSearchKeyphrase,
  toSearchLocale,
} from './search-config';
import { useCachedSearch } from './useCachedSearch';

const inputClass = 'rounded-full pl-9';
const MIN_CHARS = 2;

/**
 * Opens the results page in the page's language. Locale prefixes are "as-needed"
 * (src/i18n/routing.ts): English has none, Spanish is /es-MX/search.
 */
function goToSearch(router: ReturnType<typeof useRouter>, query: string, language?: string) {
  const q = query.trim();
  const prefix = language && language !== routing.defaultLocale ? `/${language}` : '';
  router.push(q ? `${prefix}/search?q=${encodeURIComponent(q)}` : `${prefix}/search`);
}

/**
 * Typeahead status lines. They have no Sitecore dictionary entries, so the two
 * languages the site publishes are kept here; anything else falls back to English.
 */
const PREVIEW_TEXT = {
  en: { searching: 'Searching…', noResults: 'No matching articles found.', viewAll: 'View all results →' },
  es: {
    searching: 'Buscando…',
    noResults: 'No se encontraron artículos.',
    viewAll: 'Ver todos los resultados →',
  },
};
const previewTextFor = (language?: string) =>
  language?.toLowerCase().startsWith('es') ? PREVIEW_TEXT.es : PREVIEW_TEXT.en;

const text = (doc: SearchDocument, field: string): string | undefined => {
  const v = doc[field];
  if (v == null || typeof v === 'object') return undefined;
  return String(v);
};

/**
 * Typeahead: the top matching articles for what the visitor has typed, the same
 * as the original site's CEC preview-search widget (no query completions, whole
 * words only, the same stop words ignored). Repeated keystrokes for the same
 * text are served from the shared search cache.
 */
const PreviewSearch = ({ maxPreview = 6 }: { maxPreview?: number }) => {
  const router = useRouter();
  const t = useTranslations();
  const { page } = useSitecore();
  const [value, setValue] = useState('');

  const active = value.trim().length >= MIN_CHARS;
  const labels = previewTextFor(page.locale);
  // Only articles in the page's language (the source holds en and es-MX).
  const facet = useMemo(() => {
    const language = languageFacetFilter(page.locale);
    return language ? { fields: [language] } : undefined;
  }, [page.locale]);

  const { results, isLoading, isError } = useCachedSearch({
    searchIndexId: SEARCH_INDEX_ID,
    query: toSearchKeyphrase(value, page.locale),
    pageSize: maxPreview,
    facet,
    locale: toSearchLocale(page.locale),
    enabled: active,
  });

  const onSubmit = (event: FormEvent) => {
    event.preventDefault();
    goToSearch(router, value, page.locale);
  };

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
          {isLoading ? (
            <div className="text-muted-foreground px-4 py-3 text-sm">{labels.searching}</div>
          ) : results.length > 0 && !isError ? (
            <ul className="max-h-96 overflow-auto">
              {results.map((doc, index) => {
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
              <li>
                <button
                  type="button"
                  className="hover:bg-accent hover:text-accent-foreground block w-full px-4 py-3 text-left text-sm font-medium"
                  onClick={() => goToSearch(router, value, page.locale)}
                >
                  {labels.viewAll}
                </button>
              </li>
            </ul>
          ) : (
            <div className="text-muted-foreground px-4 py-3 text-sm">{labels.noResults}</div>
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
  const { page } = useSitecore();
  const [value, setValue] = useState('');
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        goToSearch(router, value, page.locale);
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
  return <PreviewSearch />;
}
