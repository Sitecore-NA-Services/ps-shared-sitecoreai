import { NextRequest, NextResponse } from 'next/server';
import { SiteResolver, type SiteInfo } from '@sitecore-content-sdk/nextjs';
import type { SitemapXmlOptions } from '@sitecore-content-sdk/content/client';
import client from 'lib/sitecore-client';
import sites from '.sitecore/sites.json';
import scConfig from 'sitecore.config';
import { resolveSiteOrigin } from 'lib/site-url';

export const dynamic = 'force-dynamic';

// Excluded URL patterns only (all other pages from Sitecore are included)
const EXCLUDED_PATTERNS: RegExp[] = [
  /\/404/i,
  /\/api\//i,
  /\/500$/i,
  /\/error/i,
  /\/_/i,
  /sitemap/i,
  /\/robots/i,
  /\.xml$/i,
  /\.(json|txt|css|js|ico|png|jpg|jpeg|gif|svg|woff|woff2|ttf|eot)$/i,
  /\?/i,
];

/** Include URL if it does not match any excluded pattern. */
function shouldIncludeUrl(url: string): boolean {
  try {
    const urlPath = new URL(url).pathname;
    return !EXCLUDED_PATTERNS.some((pattern) => pattern.test(urlPath));
  } catch {
    return false;
  }
}

// Escapes special XML characters
function escapeXml(text: string): string {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

/**
 * Builds SitemapXmlOptions from the request (Data fetching API pattern).
 * Mirrors the options used by createSitemapRouteHandler.
 */
function getSitemapOptions(request: NextRequest): SitemapXmlOptions {
  const sitesNormalized: SiteInfo[] = (sites as { name: string; hostName?: string; language?: string }[]).map(
    (s) => ({ name: s.name, hostName: s.hostName ?? '*', language: s.language ?? 'en' })
  );
  const siteResolver = new SiteResolver(sitesNormalized);
  const origin = resolveSiteOrigin(
    request.headers,
    scConfig.defaultSite,
    scConfig.defaultLanguage,
  );
  if (!origin) {
    throw new Error('No public site URL is configured for the sitemap');
  }
  const publicUrl = new URL(origin);
  const reqHost = publicUrl.host;
  const reqProtocol = publicUrl.protocol.replace(':', '');
  const site = siteResolver.getByHost(reqHost);
  return {
    reqHost,
    reqProtocol,
    siteName: site.name,
  };
}

/** Parses <url> entries from sitemap XML. */
function parseUrlEntriesFromXml(xml: string): { loc: string; lastmod?: string; changefreq?: string; priority?: string }[] {
  const urls: { loc: string; lastmod?: string; changefreq?: string; priority?: string }[] = [];
  for (const block of xml.matchAll(/<url>([\s\S]*?)<\/url>/g)) {
    const loc = block[1].match(/<loc>([^<]+)<\/loc>/)?.[1];
    if (loc) {
      urls.push({
        loc,
        lastmod: block[1].match(/<lastmod>([^<]+)<\/lastmod>/)?.[1],
        changefreq: block[1].match(/<changefreq>([^<]+)<\/changefreq>/)?.[1],
        priority: block[1].match(/<priority>([^<]+)<\/priority>/)?.[1],
      });
    }
  }
  return urls;
}

/** Parses <sitemap><loc>...</loc></sitemap> entries from a sitemap index. */
function parseSitemapIndexLocs(xml: string): string[] {
  const locs: string[] = [];
  for (const block of xml.matchAll(/<sitemap>([\s\S]*?)<\/sitemap>/g)) {
    const loc = block[1].match(/<loc>([^<]+)<\/loc>/)?.[1];
    if (loc) locs.push(loc);
  }
  return locs;
}

// Fetches sitemap via SitecoreClient.getSiteMap (Data fetching API), filters URLs, and returns LLM-optimized XML sitemap
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const options = getSitemapOptions(request);
    let urls: { loc: string; lastmod?: string; changefreq?: string; priority?: string }[] = [];

    try {
      const xml = await client.getSiteMap(options);
      if (xml) {
        urls = parseUrlEntriesFromXml(xml);
        // If getSiteMap returned a sitemap index (no <url> entries), fetch sub-sitemaps to get all URLs
        if (urls.length === 0) {
          const indexLocs = parseSitemapIndexLocs(xml);
          for (const loc of indexLocs) {
            try {
              const res = await fetch(loc, { headers: { Accept: 'application/xml' } });
              if (res.ok) {
                const subXml = await res.text();
                urls.push(...parseUrlEntriesFromXml(subXml));
              }
            } catch {
              // Skip failed sub-sitemap
            }
          }
        }
      }
    } catch {
      // getSiteMap failed or returned nothing; leave urls empty (sitemap will be empty)
    }

    const today = new Date().toISOString().split('T')[0];
    const baseUrl = `${options.reqProtocol}://${options.reqHost}`;
    urls = urls.map((url) => {
      try {
        const parsed = new URL(url.loc);
        return { ...url, loc: `${baseUrl}${parsed.pathname}${parsed.search}` };
      } catch {
        return url;
      }
    });

    const pageEntries = urls
      .filter((u) => shouldIncludeUrl(u.loc))
      .map((u) => `  <url>
    <loc>${escapeXml(u.loc)}</loc>
    <lastmod>${u.lastmod || today}</lastmod>
    <changefreq>${u.changefreq || 'weekly'}</changefreq>
    <priority>${u.priority || '0.5'}</priority>
  </url>`);

    const aiEndpoints = ['/ai/faq.json', '/ai/summary.json', '/ai/service.json'] as const;
    const aiEntries = aiEndpoints.map(
      (path) => `  <url>
    <loc>${escapeXml(`${baseUrl}${path}`)}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>`
    );

    const entries =
      pageEntries.length > 0 ? [...pageEntries, ...aiEntries].join('\n') : '';

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${entries}
</urlset>`;

    return new NextResponse(xml, {
      headers: {
        'Content-Type': 'application/xml; charset=utf-8',
        'Cache-Control': 'public, max-age=300, s-maxage=300, stale-while-revalidate=3600',
      },
    });
  } catch {
    return new NextResponse(
      '<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"></urlset>',
      { headers: { 'Content-Type': 'application/xml; charset=utf-8' } }
    );
  }
}
