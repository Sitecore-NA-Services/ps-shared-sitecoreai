import { type NextRequest } from 'next/server';
import { createSitemapRouteHandler } from '@sitecore-content-sdk/nextjs/route-handler';
import sites from '.sitecore/sites.json';
import client from 'lib/sitecore-client';

export const dynamic = 'force-dynamic';

const sitemapHandler = createSitemapRouteHandler({ client, sites, revalidate: 300 });

/**
 * The canonical hostname that XM Cloud Edge bakes into sitemap <loc> URLs.
 * Requests from other domains (e.g. the Spanish domain) need their hostname
 * substituted in the XML so search engines see the correct domain.
 */
const CANONICAL_HOST = process.env.NEXT_PUBLIC_CANONICAL_SITE_HOST || 'article-starter.vercel.app';

/** Strip scheme + host from a URL, leaving the path (works on relative input too). */
function pathOf(u?: string | null): string | null {
  if (!u) return null;
  return u.replace(/^https?:\/\/[^/]+/, '');
}

/**
 * XM Cloud's native sitemap lists every item once per language variant — English
 * item-name paths (e.g. /Articles/x) AND Spanish display-name paths (e.g.
 * /articulos/x) — with each <url> carrying hreflang alternates for both languages.
 *
 * Each host serves exactly ONE language ("domain-as-locale" routing), so a host's
 * sitemap should only list that language's variant. Keep a <url> block only when
 * its <loc> equals this language's hreflang alternate. This removes cross-language
 * entries that would 404 on the wrong host (e.g. /articulos/* on the English host)
 * and de-duplicates the crawl — derived entirely from the sitemap's own hreflang
 * data, with no hard-coded path map.
 */
function filterToSiteLanguage(xml: string, lang: string): string {
  return xml.replace(/<url>[\s\S]*?<\/url>/g, (block) => {
    const loc = pathOf(block.match(/<loc>([^<]*)<\/loc>/)?.[1]);
    const wanted = pathOf(block.match(new RegExp(`hreflang="${lang}"\\s+href="([^"]*)"`))?.[1]);
    // If the block can't be classified (no matching alternate), keep it.
    if (!loc || !wanted) return block;
    return loc === wanted ? block : '';
  });
}

/**
 * XM Cloud Edge emits relative <loc>/…</loc> (and relative hreflang hrefs) in this
 * environment, which is invalid per the sitemap spec — search crawlers can't resolve
 * a host and drop every entry. Make them absolute against the request's own host so
 * the sitemap is crawlable on whichever domain served it.
 */
function absolutizeUrls(xml: string, base: string): string {
  return xml
    .replace(/(<loc>)(\/[^<]*)(<\/loc>)/g, `$1${base}$2$3`)
    .replace(/(hreflang="[^"]*"\s+href=")(\/[^"]*)(")/g, `$1${base}$2$3`);
}

/**
 * Single-host setup (no per-language domain, e.g. article-starter-sai): the host
 * serves its default language without a prefix and every other language under
 * /<locale> (next-intl "as-needed" routing). Edge lists the Spanish variants as
 * /Artículos/... with no prefix, which 404 on this host, so prefix every <loc> and
 * hreflang href whose language is not the host's own (2026-10-01: all 73 Spanish
 * articles were listed at 404 URLs).
 */
function prefixOtherLanguages(xml: string, hostLang: string): string {
  const own = hostLang.toLowerCase();
  const withPrefix = (url: string, lang: string) =>
    url.replace(/^(https?:\/\/[^/]+)?(\/.*)?$/, (_m, origin = '', path = '/') =>
      path.toLowerCase().startsWith(`/${lang.toLowerCase()}/`) || path.toLowerCase() === `/${lang.toLowerCase()}`
        ? `${origin}${path}`
        : `${origin}/${lang}${path === '/' ? '' : path}`
    );
  return xml.replace(/<url>[\s\S]*?<\/url>/g, (block) => {
    const loc = block.match(/<loc>([^<]*)<\/loc>/)?.[1];
    const alternates = [...block.matchAll(/hreflang="([^"]+)"\s+href="([^"]*)"/g)];
    const locLang = alternates.find(([, , href]) => pathOf(href) === pathOf(loc))?.[1];
    let out = block;
    if (loc && locLang && locLang !== 'x-default' && locLang.toLowerCase() !== own) {
      out = out.replace(`<loc>${loc}</loc>`, `<loc>${withPrefix(loc, locLang)}</loc>`);
    }
    return out.replace(/hreflang="([^"]+)"(\s+)href="([^"]*)"/g, (m, lang: string, sp: string, href: string) =>
      lang === 'x-default' || lang.toLowerCase() === own ? m : `hreflang="${lang}"${sp}href="${withPrefix(href, lang)}"`
    );
  });
}

export async function GET(request: NextRequest) {
  const response = await sitemapHandler.GET(request);
  if (!response.ok) return response;

  const reqHost =
    request.headers.get('x-forwarded-host') || request.headers.get('host') || CANONICAL_HOST;
  const base = `https://${reqHost}`;

  let xml = await response.text();

  // Keep only this host's language variant (uses the sitemap's own hreflang data).
  const siteEntry = (sites as Array<{ name: string; hostName: string; language: string }>).find(
    (s) => s.hostName === reqHost
  );
  if (siteEntry?.language) {
    // This host is registered for one language: list only that language.
    xml = filterToSiteLanguage(xml, siteEntry.language);
  } else {
    // Single host for all languages: other languages live under /<locale>.
    xml = prefixOtherLanguages(xml, process.env.NEXT_PUBLIC_DEFAULT_LANGUAGE || 'en');
  }

  // If Edge baked in the canonical host (absolute URLs), swap it for the request host.
  if (reqHost !== CANONICAL_HOST) {
    xml = xml.split(CANONICAL_HOST).join(reqHost);
  }

  // Make any remaining relative <loc>/hreflang URLs absolute against this host.
  xml = absolutizeUrls(xml, base);

  return new Response(xml, { headers: response.headers });
}
