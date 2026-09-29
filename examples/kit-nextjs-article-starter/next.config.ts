import type { NextConfig } from 'next';
import path from 'path';
import createNextIntlPlugin from 'next-intl/plugin';

const nextConfig: NextConfig = {
  // Allow specifying a distinct distDir when concurrently running app in a container
  distDir: process.env.NEXTJS_DIST_DIR || '.next',

  // Pin Turbopack's root to this starter's directory so the font resolver
  // doesn't pick up an outer lockfile in a monorepo.
  turbopack: {
    root: path.resolve(__dirname),
  },
  
  // Enable React Strict Mode
  reactStrictMode: true,

  // Serve blocking metadata to every user agent. Next 15.2+ streams the result of
  // generateMetadata and, when it is not ready by the time the shell flushes,
  // injects <title> and the og:* / article:* meta into the <body> instead of the
  // <head>. The SitecoreAI Search crawler (not on Next's built-in bot list) reads
  // "head > title" and head meta, so under load roughly half the articles were
  // indexed with no title, author, type or tags. Matching every UA makes the
  // server wait for metadata before flushing, which costs nothing here because the
  // same getPage() call already gates the page body.
  htmlLimitedBots: /.*/,

  // Disable the X-Powered-By header. Follows security best practices.
  poweredByHeader: false,

  // use this configuration to ensure that only images from the whitelisted domains
  // can be served from the Next.js Image Optimization API
  // see https://nextjs.org/docs/app/api-reference/components/image#remotepatterns
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'edge*.**',
        port: '',
      },
      {
        protocol: 'https',
        hostname: 'xmc-*.**',
        port: '',
      },
      {
        // The rendering host serves Sitecore media via the /-/media rewrite (above),
        // so allow next/image to optimize media referenced by the deployment's own
        // (absolute) URL. Covers the production alias and Vercel preview deployments.
        protocol: 'https',
        hostname: '*.vercel.app',
        port: '',
      },
    ],
    // Disable image optimization in development to avoid upstream timeouts
    unoptimized: process.env.NODE_ENV === 'development',
  },
  
  rewrites: async () => {
    // Sitecore media URLs come back from the layout service as relative paths
    // (/-/media/... and /-/jssmedia/...). They are NOT prefixed with a host by the
    // Content SDK, so on a headless rendering host they resolve to the app origin —
    // which serves no media (404). Proxy them to the Sitecore media host instead.
    // Set NEXT_PUBLIC_SITECORE_API_HOST to your CM/media host (e.g. the XM Cloud
    // environment host). If unset, no media rewrite is added.
    const sitecoreApiHost = process.env.NEXT_PUBLIC_SITECORE_API_HOST?.replace(/\/$/, '');
    const mediaRewrites = sitecoreApiHost
      ? [
          {
            source: '/-/media/:path*',
            destination: `${sitecoreApiHost}/-/media/:path*`,
            locale: false as const,
          },
          {
            source: '/-/jssmedia/:path*',
            destination: `${sitecoreApiHost}/-/jssmedia/:path*`,
            locale: false as const,
          },
        ]
      : [];

    return [
      ...mediaRewrites,
      // serve the sitemap.xml and robots.txt files from the API route handlers
      {
        source: '/sitemap:id([\\w-]{0,}).xml',
        destination: '/api/sitemap',
        locale: false,
      },
      {
        source: '/robots.txt',
        destination: '/api/robots',
        locale: false,
      },
    ];
  },
};

const withNextIntl = createNextIntlPlugin();
export default withNextIntl(nextConfig);
