import scConfig from 'sitecore.config';
import { resolveSiteOrigin } from '@/lib/site-url';

export const dynamic = 'force-dynamic';

/**
 * API route for serving robots.txt
 *
 * This Next.js API route handler generates and returns the robots.txt content dynamically
 * based on the resolved site name. It is commonly
 * used by search engine crawlers to determine crawl and indexing rules.
 */

export async function GET(request: Request) {
  const baseUrl =
    resolveSiteOrigin(
      request.headers,
      scConfig.defaultSite,
      process.env.NEXT_PUBLIC_DEFAULT_LANGUAGE || scConfig.defaultLanguage,
    ) || 'https://article-starter.vercel.app';

  const robots = `User-agent: *\nAllow: /\nSitemap: ${baseUrl}/sitemap.xml`;

  return new Response(robots, {
    status: 200,
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=300',
    },
  });
}
