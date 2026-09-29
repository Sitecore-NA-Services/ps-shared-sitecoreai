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
 *     HTML), so they are not hard-coded: override any of them in
 *     `NEXT_PUBLIC_SEARCH_FIELD_MAP`, either as JSON
 *     (`{"title":"page_title","tags":"topics"}`) or as `key:value` pairs
 *     separated by spaces (`title:page_title tags:topics`). The second form
 *     exists for SitecoreAI Deploy variables, which reject double quotes and
 *     whose deployment broke outright on values containing `=` and `,`
 *     (2026-09-29: three editing-host deployments failed at the deployment
 *     stage until `image=,date=` was removed). `=` and `,` still parse, for
 *     hosts that accept them. An empty value (`date:`) disables that field.
 *     `image` and `date` are empty by default because the article site source
 *     extracts neither; map them when a source provides them.
 */

/**
 * Parses a small string-to-string map from JSON or from `key:value` / `key=value`
 * pairs separated by whitespace, commas or semicolons. Returns undefined when the
 * input is empty or unparseable.
 */
export function parseMapEnv(raw: string | undefined, name: string): Record<string, string> | undefined {
  const value = raw?.trim();
  if (!value) return undefined;
  if (value.startsWith('{')) {
    try {
      return JSON.parse(value) as Record<string, string>;
    } catch {
      console.warn(`${name} is not valid JSON; ignoring it.`);
      return undefined;
    }
  }
  const map: Record<string, string> = {};
  for (const pair of value.split(/[\s,;]+/)) {
    const i = pair.search(/[:=]/);
    if (i <= 0) continue;
    map[pair.slice(0, i).trim()] = pair.slice(i + 1).trim();
  }
  return map;
}

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
  /** Publish date used for newest/oldest sorting. Empty (the default) disables date sorting. */
  date: string;
};

const DEFAULT_FIELDS: SearchFieldMap = {
  id: 'sc_item_id',
  url: 'sc_url',
  title: 'title',
  description: 'description',
  image: '',
  type: 'type',
  author: 'author',
  tags: 'tags',
  date: '',
};

function readFieldMap(): SearchFieldMap {
  const overrides = parseMapEnv(process.env.NEXT_PUBLIC_SEARCH_FIELD_MAP, 'NEXT_PUBLIC_SEARCH_FIELD_MAP');
  return overrides ? { ...DEFAULT_FIELDS, ...(overrides as Partial<SearchFieldMap>) } : DEFAULT_FIELDS;
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
 * `NEXT_PUBLIC_SEARCH_LOCALE_MAP` is set. It maps Sitecore languages to the source's
 * locale codes as JSON (`{"en":"en","es-MX":"es-MX"}`) or `en:en es-MX:es-MX`;
 * languages missing from the map fall back to the language tag itself. The solterra source created on
 * 2026-09-29 detected no languages and indexes everything as one language, so the
 * variable stays unset for it.
 */
export function toSearchLocale(language?: string | null): string | undefined {
  if (!language) return undefined;
  const map = parseMapEnv(process.env.NEXT_PUBLIC_SEARCH_LOCALE_MAP, 'NEXT_PUBLIC_SEARCH_LOCALE_MAP');
  if (!map) return undefined;
  return map[language] || language;
}

/** True when the app knows which source to query. */
export const isSearchConfigured = (indexId?: string) => Boolean(indexId || SEARCH_INDEX_ID);
