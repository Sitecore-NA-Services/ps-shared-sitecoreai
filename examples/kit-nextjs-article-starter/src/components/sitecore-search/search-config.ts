/**
 * Shared configuration for the embedded SitecoreAI Search integration.
 *
 * Embedded Search (Content > Search Sources in SitecoreAI) replaces the Sitecore
 * Search (CEC) domain this starter used before. There is no customer key, API key
 * or widget id any more: the Content SDK authenticates with the Edge context id
 * that the app already has, and a *source* is addressed by its GUID.
 *
 * Two things are configured here:
 *
 *  1. Which source to query. The `SearchResults` rendering prefers the GUID in
 *     its datasource item (the JSON the Search Configuration Manager app writes
 *     into the `search` field). Everything that has no datasource, such as the
 *     header typeahead and the server-side chat routes, falls back to
 *     `NEXT_PUBLIC_SEARCH_INDEX_ID`.
 *
 *  2. Which fields of an indexed document mean what. Field names are decided
 *     when the source is created (a site source extracts them from the crawled
 *     HTML), so they are not hard-coded: override any of them with a JSON blob in
 *     `NEXT_PUBLIC_SEARCH_FIELD_MAP`, for example
 *     `{"title":"page_title","tags":"topics"}`.
 */

/** Source GUID used when a rendering has no datasource of its own. */
export const SEARCH_INDEX_ID =
  process.env.SITECORE_SEARCH_INDEX_ID || process.env.NEXT_PUBLIC_SEARCH_INDEX_ID || '';

export type SearchFieldMap = {
  /** Stable document id. Site and content sources return `sc_item_id`. */
  id: string;
  /** Absolute URL of the page. Site sources key documents by `sc_url`. */
  url: string;
  title: string;
  description: string;
  image: string;
  /** Content type facet, e.g. "Article", "Case Study". */
  type: string;
  author: string;
  /** Topic tags facet (array field). */
  tags: string;
  /** Publish date used for newest/oldest sorting. Empty disables date sorting. */
  date: string;
};

const DEFAULT_FIELDS: SearchFieldMap = {
  id: 'sc_item_id',
  url: 'sc_url',
  title: 'title',
  description: 'description',
  image: 'image',
  type: 'type',
  author: 'author',
  tags: 'tags',
  date: 'date',
};

function readFieldMap(): SearchFieldMap {
  const raw = process.env.NEXT_PUBLIC_SEARCH_FIELD_MAP;
  if (!raw) return DEFAULT_FIELDS;
  try {
    return { ...DEFAULT_FIELDS, ...(JSON.parse(raw) as Partial<SearchFieldMap>) };
  } catch {
    console.warn('NEXT_PUBLIC_SEARCH_FIELD_MAP is not valid JSON; using the default field names.');
    return DEFAULT_FIELDS;
  }
}

export const SEARCH_FIELDS: SearchFieldMap = readFieldMap();

/** Facet fields the results page exposes, in display order. */
export const SEARCH_FACET_FIELDS = [SEARCH_FIELDS.type, SEARCH_FIELDS.author, SEARCH_FIELDS.tags].filter(
  Boolean
);

/** Sort choices offered on the results page. `fields` empty means relevance order. */
export type SearchSortChoice = {
  name: 'relevance' | 'title_asc' | 'title_desc' | 'date_desc' | 'date_asc';
  fields: { name: string; order: 'asc' | 'desc' }[];
};

export const SEARCH_SORT_CHOICES: SearchSortChoice[] = [
  { name: 'relevance', fields: [] },
  { name: 'title_asc', fields: [{ name: SEARCH_FIELDS.title, order: 'asc' }] },
  { name: 'title_desc', fields: [{ name: SEARCH_FIELDS.title, order: 'desc' }] },
  ...(SEARCH_FIELDS.date
    ? ([
        { name: 'date_desc', fields: [{ name: SEARCH_FIELDS.date, order: 'desc' }] },
        { name: 'date_asc', fields: [{ name: SEARCH_FIELDS.date, order: 'asc' }] },
      ] as SearchSortChoice[])
    : []),
];

/**
 * Maps a Sitecore content language ("en", "es-MX") to the locale code the source
 * was created with.
 *
 * A `locale` is only valid on multi-locale sources, so nothing is sent unless
 * `NEXT_PUBLIC_SEARCH_LOCALE_MAP` is set. Its JSON maps Sitecore languages to the
 * source's locale codes, e.g. `{"en":"en","es-MX":"es-MX"}`; languages missing from
 * the map fall back to the language tag itself. The solterra source created on
 * 2026-09-29 detected no languages and indexes everything as one language, so the
 * variable stays unset for it.
 */
export function toSearchLocale(language?: string | null): string | undefined {
  const raw = process.env.NEXT_PUBLIC_SEARCH_LOCALE_MAP;
  if (!raw || !language) return undefined;
  try {
    const map = JSON.parse(raw) as Record<string, string>;
    return map[language] || language;
  } catch {
    console.warn('NEXT_PUBLIC_SEARCH_LOCALE_MAP is not valid JSON; locale not sent.');
    return undefined;
  }
}

/** True when the app knows which source to query. */
export const isSearchConfigured = (indexId?: string) => Boolean(indexId || SEARCH_INDEX_ID);
