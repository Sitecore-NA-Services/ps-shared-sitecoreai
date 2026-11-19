import { type NextRequest, NextResponse } from 'next/server';
import scConfig from 'sitecore.config';
import { resolveSiteOrigin } from 'lib/site-url';

export const dynamic = 'force-dynamic';

const CACHE_MAX_AGE = 86400; // 24 hours

/** Generates the ai.txt content with crawler permissions and AI endpoints. */
function generateAiTxtContent(siteUrl: string): string {
  const lastModified = new Date().toISOString().split('T')[0];

  return `# AI Crawler Permissions for ${siteUrl}

User-Agent: *
Allow: /

User-Agent: GPTBot
Allow: /

User-Agent: Claude-Web
Allow: /

User-Agent: Anthropic-AI
Allow: /

User-Agent: Google-Extended
Allow: /

User-Agent: CCBot
Allow: /

User-Agent: PerplexityBot
Allow: /

Disallow: /api/editing/
Disallow: /sitecore/

AI-Endpoint: ${siteUrl}/ai/summary.json
AI-Endpoint: ${siteUrl}/ai/faq.json
AI-Endpoint: ${siteUrl}/ai/service.json

Sitemap: ${siteUrl}/sitemap-llm.xml
Sitemap: ${siteUrl}/sitemap.xml

Last-Modified: ${lastModified}
`;
}

/** GET handler that serves the ai.txt file for AI crawlers. */
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const siteUrl = resolveSiteOrigin(
      request.headers,
      scConfig.defaultSite,
      scConfig.defaultLanguage,
    );
    if (!siteUrl) {
      throw new Error('No public site URL is configured for ai.txt');
    }
    const aiTxtContent = generateAiTxtContent(siteUrl);

    return new NextResponse(aiTxtContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': `public, max-age=${CACHE_MAX_AGE}, s-maxage=${CACHE_MAX_AGE}`,
        'X-Content-Type-Options': 'nosniff',
      },
    });
  } catch (error) {
    console.error('Error generating ai.txt:', error);

    return new NextResponse('# Error generating ai.txt\n', {
      status: 500,
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
      },
    });
  }
}
