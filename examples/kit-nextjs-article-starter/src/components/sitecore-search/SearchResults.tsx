'use client';

/**
 * Full search-results experience on embedded SitecoreAI Search, packaged as a
 * Sitecore rendering (`Default` export) so it can be placed on a Sitecore page
 * and inherit the site layout + design system.
 *
 * Best-practice notes (this file is a teaching reference):
 *  - Data comes from the Content SDK query hook `useSearch`. Keyphrase, paging,
 *    sorting and facet selection are ordinary React state here; the hook turns
 *    them into one request against the source and returns results, total and
 *    facet counts. Authentication is the Edge context id the app already has.
 *  - Which source to query comes from the datasource item: the Search
 *    Configuration Manager app writes `{ searchIndex, fieldsMapping }` JSON into
 *    the item's `search` field. When the rendering has no datasource the
 *    `NEXT_PUBLIC_SEARCH_INDEX_ID` fallback is used.
 *  - The UI uses the site design system (shadcn primitives in `@/components/ui`
 *    and brand tokens) and a `colorScheme` rendering parameter, mirroring the
 *    pattern used by the Hero rendering.
 *  - The keyphrase comes from the `?q=` query string; facets are the fields the
 *    source marks Filterable (content type / author / topics by default).
 */

import { Suspense, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { cva } from 'class-variance-authority';
import { useTranslations } from 'next-intl';
import { useSitecore } from '@sitecore-content-sdk/nextjs';
import { useSearch } from '@sitecore-content-sdk/nextjs/search';
import type { FacetField, SearchDocument } from '@sitecore-content-sdk/search';
import { cn } from '@/lib/utils';
import { dictionaryKeys } from '@/variables/dictionary';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { ComponentProps } from '@/lib/component-props';
import { useLocalizeHref } from '@/lib/localize-href';
import { useSearchField } from '@/components/search-experience/search-components/useSearchField';
import { SearchQuestionsPanel } from './SearchQuestions';
import {
  SEARCH_FACET_FIELDS,
  SEARCH_FIELDS,
  SEARCH_INDEX_ID,
  SEARCH_SORT_CHOICES,
  isSearchConfigured,
  toSearchLocale,
  type SearchSortChoice,
} from './search-config';

type SearchResultsProps = ComponentProps & {
  fields?: {
    /** JSON written by the Search Configuration Manager app: `{ searchIndex, fieldsMapping }`. */
    search?: { value?: string };
  };
};

type Translator = ReturnType<typeof useTranslations>;

/** Dictionary keys for the fixed sort choices. */
const SORT_KEYS: Record<SearchSortChoice['name'], string> = {
  relevance: dictionaryKeys.SEARCH_SORT_RELEVANCE,
  title_asc: dictionaryKeys.SEARCH_SORT_TITLE_AZ,
  title_desc: dictionaryKeys.SEARCH_SORT_TITLE_ZA,
  date_desc: dictionaryKeys.SEARCH_SORT_NEWEST,
  date_asc: dictionaryKeys.SEARCH_SORT_OLDEST,
};

/** Dictionary keys for the facet fields this experience exposes. */
const facetLabelOf = (name: string, t: Translator) => {
  if (name === SEARCH_FIELDS.type) return t(dictionaryKeys.SEARCH_FACET_CONTENT_TYPE);
  if (name === SEARCH_FIELDS.tags) return t(dictionaryKeys.SEARCH_FACET_TOPICS);
  if (name === SEARCH_FIELDS.author) return t(dictionaryKeys.SEARCH_FACET_AUTHOR);
  return name.replace(/[_-]/g, ' ');
};

const text = (doc: SearchDocument, field: string): string | undefined => {
  const v = doc[field];
  if (v == null) return undefined;
  if (Array.isArray(v)) return v.length ? String(v[0]) : undefined;
  if (typeof v === 'object') return undefined;
  return String(v);
};

type SelectedFacets = Record<string, string[]>;

const ResultsSkeleton = () => (
  <div className="grid gap-4">
    {Array.from({ length: 6 }).map((_, i) => (
      <div key={i} className="rounded-xl border border-zinc-200 bg-white p-5">
        <div className="h-5 w-2/3 animate-pulse rounded bg-zinc-200" />
        <div className="mt-3 h-4 w-full animate-pulse rounded bg-zinc-100" />
        <div className="mt-2 h-4 w-4/5 animate-pulse rounded bg-zinc-100" />
      </div>
    ))}
  </div>
);

const SearchResultsList = ({
  searchIndexId,
  keyphrase,
  pageSize = 10,
  enabled,
}: {
  searchIndexId: string;
  keyphrase: string;
  pageSize?: number;
  enabled: boolean;
}) => {
  const t = useTranslations();
  const { page: sitecorePage } = useSitecore();

  // Paging, sorting and filters belong to one keyphrase. The parent remounts this
  // component (via `key`) when the keyphrase changes, so a new search starts clean.
  const [pageNumber, setPageNumber] = useState(1);
  const [sortName, setSortName] = useState<SearchSortChoice['name']>('relevance');
  const [selected, setSelected] = useState<SelectedFacets>({});

  const sortChoice = SEARCH_SORT_CHOICES.find((c) => c.name === sortName) ?? SEARCH_SORT_CHOICES[0];

  // Ask for counts on every facet field and apply the visitor's selections as `eq` filters.
  // The whole `facet` option is memoised: `useSearch` keeps the request options in a
  // dependency list, so a fresh object literal on every render would re-issue the
  // request after each response and loop until React gives up (error #185).
  const facet = useMemo<{ fields: FacetField[] }>(
    () => ({
      fields: SEARCH_FACET_FIELDS.map((name) => {
        const values = selected[name];
        return values?.length ? { name, filters: [{ operator: 'eq', value: values }] } : { name };
      }),
    }),
    [selected]
  );
  const locale = toSearchLocale(sitecorePage.locale);

  const { results, total, totalPages, facets = [], isLoading, isError, isPreviousData } =
    useSearch<SearchDocument>({
      searchIndexId,
      query: keyphrase,
      page: pageNumber,
      pageSize,
      sort: sortChoice.fields.length ? sortChoice.fields : undefined,
      facet,
      locale,
      enabled,
      keepPreviousData: true,
    });

  const hasSelectedFacets = Object.values(selected).some((v) => v.length > 0);
  const loading = isLoading || isPreviousData;

  const toggleFacet = (field: string, value: string, checked: boolean) => {
    setPageNumber(1);
    setSelected((prev) => {
      const current = new Set(prev[field] ?? []);
      if (checked) current.add(value);
      else current.delete(value);
      return { ...prev, [field]: Array.from(current) };
    });
  };

  return (
    <div className="grid grid-cols-1 gap-8 md:grid-cols-[260px_1fr]">
      {/* ----------------------------- Facets ----------------------------- */}
      <aside className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-zinc-900">{t(dictionaryKeys.SEARCH_FILTERS_LABEL)}</h2>
          {hasSelectedFacets && (
            <Button
              type="button"
              variant="link"
              size="sm"
              className="h-auto p-0 text-xs font-medium text-zinc-500 hover:text-accent"
              onClick={() => {
                setSelected({});
                setPageNumber(1);
              }}
            >
              {t(dictionaryKeys.SEARCH_FILTERS_CLEAR)}
            </Button>
          )}
        </div>

        {facets.length === 0 ? (
          <p className="text-sm text-zinc-500">{t(dictionaryKeys.SEARCH_FILTERS_NONE)}</p>
        ) : (
          facets.map((facet) => (
            <div key={facet.name} className="space-y-3 border-b border-zinc-200 pb-5">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
                {facetLabelOf(facet.name, t)}
              </h3>
              <ul className="space-y-2.5">
                {facet.value.map((value) => {
                  const valueText = String(value.text);
                  const checked = (selected[facet.name] ?? []).includes(valueText);
                  const inputId = `facet-${facet.name}-${valueText}`;
                  return (
                    <li key={valueText} className="flex items-center gap-2.5">
                      <Checkbox
                        id={inputId}
                        checked={checked}
                        onCheckedChange={(next) => toggleFacet(facet.name, valueText, next === true)}
                      />
                      <label
                        htmlFor={inputId}
                        className="flex flex-1 cursor-pointer items-center justify-between gap-2 text-sm text-zinc-700"
                      >
                        <span className="truncate">{valueText}</span>
                        <span className="text-xs text-zinc-400">{value.count}</span>
                      </label>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))
        )}
      </aside>

      {/* ----------------------------- Results ---------------------------- */}
      <section>
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3 border-b border-zinc-200 pb-4">
          <p className="text-sm text-zinc-600" aria-live="polite">
            {loading && results.length === 0 ? (
              t(dictionaryKeys.SEARCH_LOADING)
            ) : (
              <>
                <span className="font-semibold text-zinc-900">{total}</span>{' '}
                {total === 1 ? t(dictionaryKeys.SEARCH_RESULT) : t(dictionaryKeys.SEARCH_RESULTS)}
                {keyphrase ? (
                  <>
                    {' '}
                    {t(dictionaryKeys.SEARCH_RESULTS_FOR)}{' '}
                    <span className="font-medium text-zinc-900">&quot;{keyphrase}&quot;</span>
                  </>
                ) : null}
              </>
            )}
          </p>

          <div className="flex items-center gap-2">
            <span className="text-sm text-zinc-500">{t(dictionaryKeys.SEARCH_SORT_LABEL)}</span>
            <Select
              value={sortName}
              onValueChange={(name) => {
                setSortName(name as SearchSortChoice['name']);
                setPageNumber(1);
              }}
            >
              <SelectTrigger className="h-9 w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SEARCH_SORT_CHOICES.map((choice) => (
                  <SelectItem key={choice.name} value={choice.name}>
                    {t(SORT_KEYS[choice.name])}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {isError ? (
          <div className="rounded-xl border border-zinc-200 bg-white p-10 text-center">
            <p className="font-semibold text-zinc-900">Search is unavailable right now.</p>
            <p className="mt-1 text-sm text-zinc-500">Please try again in a moment.</p>
          </div>
        ) : loading && results.length === 0 ? (
          <ResultsSkeleton />
        ) : results.length === 0 ? (
          <div className="rounded-xl border border-zinc-200 bg-white p-10 text-center">
            <p className="font-semibold text-zinc-900">{t(dictionaryKeys.SEARCH_EMPTY_TITLE)}</p>
            <p className="mt-1 text-sm text-zinc-500">
              {hasSelectedFacets
                ? t(dictionaryKeys.SEARCH_EMPTY_BODY_WITH_FILTERS)
                : t(dictionaryKeys.SEARCH_EMPTY_BODY)}
            </p>
          </div>
        ) : (
          <ul className={cn('grid gap-4', isPreviousData && 'opacity-60 transition-opacity')}>
            {results.map((doc, index) => {
              const url = text(doc, SEARCH_FIELDS.url);
              const title = text(doc, SEARCH_FIELDS.title) || 'Untitled';
              const description = text(doc, SEARCH_FIELDS.description);
              const type = text(doc, SEARCH_FIELDS.type);
              const author = text(doc, SEARCH_FIELDS.author);
              return (
                <li key={text(doc, SEARCH_FIELDS.id) || url || index}>
                  <a
                    href={url}
                    className="group block rounded-xl border border-zinc-200 bg-white p-5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-zinc-300 hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <h3 className="text-lg font-semibold leading-snug text-zinc-900 transition-colors group-hover:text-accent">
                        {title}
                      </h3>
                      {type && (
                        <span className="shrink-0 rounded-full bg-zinc-100 px-2.5 py-1 text-xs font-medium text-zinc-600">
                          {type}
                        </span>
                      )}
                    </div>
                    {description && (
                      <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-zinc-600">{description}</p>
                    )}
                    {author && <p className="mt-3 text-xs font-medium text-zinc-400">By {author}</p>}
                  </a>
                </li>
              );
            })}
          </ul>
        )}

        {/* --------------------------- Pagination -------------------------- */}
        {!isError && totalPages > 1 && (
          <nav className="mt-8 flex items-center justify-center gap-2" aria-label="Search results pages">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={pageNumber <= 1}
              onClick={() => setPageNumber((p) => Math.max(1, p - 1))}
            >
              Previous
            </Button>
            <span className="px-2 text-sm text-zinc-500">
              Page {pageNumber} of {totalPages}
            </span>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={pageNumber >= totalPages}
              onClick={() => setPageNumber((p) => Math.min(totalPages, p + 1))}
            >
              Next
            </Button>
          </nav>
        )}
      </section>
    </div>
  );
};

/** Section wrapper styling — mirrors the Hero `colorScheme` rendering parameter. */
export const searchResultsVariants = cva('search-results @container w-full py-12', {
  variants: {
    colorScheme: {
      // Default: a clean, readable light surface (white cards on a subtle gray page).
      light: 'bg-zinc-50 text-zinc-900',
      // Brand options remain available to authors via the colorScheme rendering parameter.
      primary: 'bg-primary text-primary-foreground',
      secondary: 'bg-secondary text-secondary-foreground',
      tertiary: 'bg-tertiary text-primary',
      dark: 'bg-dark text-primary',
    },
  },
  defaultVariants: {
    colorScheme: 'light',
  },
});

type ColorScheme = 'primary' | 'secondary' | 'tertiary' | 'dark' | 'light';

/**
 * Sitecore rendering entry. Placed on a Sitecore page (the `/search` page); reads
 * the `colorScheme` rendering parameter, the datasource's search JSON and the
 * `?q=` query string, then renders the results inside a brand-styled section.
 * If no source is configured a styled notice renders so the page still builds.
 */
const SearchResultsContent = ({ params, fields }: SearchResultsProps) => {
  const colorScheme = ((params?.colorScheme as ColorScheme) || 'light') as ColorScheme;
  const q = useSearchParams()?.get('q') ?? '';
  const localizeHref = useLocalizeHref();
  const { page } = useSitecore();
  const { isEditing, isPreview } = page.mode;

  const { searchIndex } = useSearchField(fields?.search?.value);
  const searchIndexId = searchIndex || SEARCH_INDEX_ID;
  const configured = isSearchConfigured(searchIndexId);

  return (
    <section className={cn(searchResultsVariants({ colorScheme }), params?.styles)}>
      <div className="mx-auto w-full max-w-screen-xl px-4 xl:px-8">
        {/* A written answer leads when the query reads as a question; the matching
            articles follow underneath. */}
        <SearchQuestionsPanel keyphrase={q} />

        {configured ? (
          <SearchResultsList
            key={`${searchIndexId}:${q}`}
            searchIndexId={searchIndexId}
            keyphrase={q}
            // Live search is switched off inside Page builder and Preview; the
            // component is configured there, not exercised.
            enabled={!isEditing && !isPreview}
          />
        ) : (
          <div className="rounded-xl border border-zinc-200 bg-white p-8">
            <p className="font-semibold text-zinc-900">Search is not configured yet.</p>
            <p className="mt-1 text-sm text-zinc-500">
              Pick a search source for this component in Page builder (Search Configuration Manager
              tab), or set <code>NEXT_PUBLIC_SEARCH_INDEX_ID</code> to a source GUID and redeploy.
            </p>
          </div>
        )}

        {/* Same teaching panel the Agent Chat and RAG Chat pages carry, so the
            three Search surfaces can be compared side by side. */}
        <div className="mt-6 rounded-xl border border-dashed border-zinc-300 p-4 text-sm text-zinc-500">
          <h2 className="mb-2 font-semibold text-zinc-900">How this demo works</h2>
          <ul className="list-disc space-y-1 pl-5">
            <li>
              Results come from an <strong>embedded SitecoreAI search source</strong>: a crawler that
              indexes this site from its sitemap. The page queries it with the Content SDK&apos;s{' '}
              <code>useSearch</code> hook, authenticated by the site&apos;s Edge context id; there is
              no separate search API key.
            </li>
            <li>
              The answer panel only appears when you <strong>ask a question</strong>. A keyword
              browse such as &quot;solar&quot; just returns the list, which is most searches.
            </li>
            <li>
              An answer is <strong>AI generated and grounded in the article index</strong>: the
              model only sees the articles retrieved for your question, weak matches are filtered
              out first, and if the articles do not actually answer it the panel stays hidden
              rather than guessing.
            </li>
            <li>
              <strong>Continue this conversation</strong> carries the question over to Agent Chat,
              which re-answers it with its own tools against the same source.
            </li>
            <li>
              Facets (content type, author, topics) are the fields the source marks{' '}
              <strong>Filterable</strong>; counts update with every query and selections are sent
              back as filters.
            </li>
            <li>
              Compare with the{' '}
              <Link
                href={localizeHref('/Agent-Chat') ?? '/Agent-Chat'}
                className="font-semibold text-zinc-900 underline underline-offset-2"
              >
                Agent Chat
              </Link>{' '}
              and{' '}
              <Link
                href={localizeHref('/RAG-Chat') ?? '/RAG-Chat'}
                className="font-semibold text-zinc-900 underline underline-offset-2"
              >
                RAG Chat
              </Link>{' '}
              pages, which reach the same source through a conversation instead of a result list.
            </li>
          </ul>
        </div>
      </div>
    </section>
  );
};

export const Default = (props: SearchResultsProps) => (
  <Suspense fallback={null}>
    <SearchResultsContent {...props} />
  </Suspense>
);
