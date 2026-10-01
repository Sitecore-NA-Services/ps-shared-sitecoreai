/**
 * Extracts the article's rendered body text from Sitecore layout data so it can be
 * emitted as a `<meta property="article:body">` tag.
 *
 * Why: the Sitecore Search crawler runs with JavaScript rendering disabled and, in
 * this environment, reliably reads `<head>` `property=` meta tags but NOT `<body>`
 * content. To make full article text searchable (in whatever language the page
 * renders), we surface the body text into a head meta the crawler can read.
 */

const stripHtml = (html: string): string =>
  html
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/\s+/g, ' ')
    .trim();

type AnyRecord = Record<string, unknown>;

/**
 * Walk the "headless-main" placeholder tree of a route and collect the text values
 * of content fields. Falls back to the whole route if the main placeholder is absent.
 */
export function extractMainText(route: unknown, maxLength = 6000): string {
  if (!route || typeof route !== 'object') return '';

  const parts: string[] = [];
  const seen = new Set<string>();

  const pushValue = (value: unknown) => {
    if (typeof value !== 'string') return;
    const isHtml = /<[a-z!/][\s\S]*>/i.test(value);
    const text = isHtml ? stripHtml(value) : value.trim();
    if (!text || text.length < 3) return;
    // Keep prose only: multi-word text, or clearly rich content. Skip slugs, urls,
    // guids, css class blobs, tokens.
    if (!isHtml && !/\s/.test(text)) return;
    if (/^https?:\/\//i.test(text)) return;
    if (/^[{(]?[0-9a-f]{8}-[0-9a-f]{4}-/i.test(text)) return;
    if (text === '$name') return;
    if (seen.has(text)) return;
    seen.add(text);
    parts.push(text);
  };

  // A field is any object shaped like `{ value: ... }`. Collect its string value
  // (Text/RichText). Ignore nested objects (ImageField {src}, LinkField {href}).
  const walk = (node: unknown, depth: number) => {
    if (depth > 16 || !node || typeof node !== 'object') return;
    if (Array.isArray(node)) {
      node.forEach((n) => walk(n, depth + 1));
      return;
    }
    const obj = node as AnyRecord;
    if ('value' in obj && typeof obj.value === 'string' && !('src' in obj) && !('href' in obj)) {
      pushValue(obj.value);
    }
    for (const [key, child] of Object.entries(obj)) {
      if (key === 'editable') continue; // Sitecore chrome markup, not content
      if (child && typeof child === 'object') walk(child, depth + 1);
    }
  };

  const r = route as AnyRecord;
  const placeholders = r.placeholders as AnyRecord | undefined;
  const main = placeholders?.['headless-main'];
  walk(main ?? route, 0);

  // Article pages render their body from the page's own fields. In the old org the
  // ArticleFull rendering's GraphQL query copied them into the component
  // ("externalFields"), so the walk above found them; in the new org that query
  // returns nothing and the component reads the route fields directly, which left
  // 62 of 73 articles with an empty description (2026-10-01). Fall back to the
  // article fields themselves, in the same title, author, body order.
  if (!parts.length) {
    const fields = (r.fields ?? {}) as AnyRecord;
    for (const name of ['ArticleTitle', 'ArticleAuthor', 'ArticleContent']) walk(fields[name], 0);
  }

  const joined = parts.join(' ').replace(/\s+/g, ' ').trim();
  return joined.length > maxLength ? joined.slice(0, maxLength) : joined;
}
