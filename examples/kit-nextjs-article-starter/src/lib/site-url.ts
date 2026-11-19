import type { SiteInfo } from '@sitecore-content-sdk/nextjs';
import sites from '.sitecore/sites.json';

type HeadersLike = {
  get(name: string): string | null;
};

const LOCAL_HOSTNAMES = new Set(['localhost', '127.0.0.1', '::1']);

function firstHeaderValue(value: string | null): string | null {
  return value?.split(',')[0]?.trim() || null;
}

function normalizePublicOrigin(value: string | null | undefined): string | undefined {
  const candidate = firstHeaderValue(value || null);
  if (!candidate || candidate === '*') return undefined;

  try {
    const url = new URL(
      candidate.includes('://') ? candidate : `https://${candidate}`,
    );
    if (
      (url.protocol !== 'http:' && url.protocol !== 'https:') ||
      url.username ||
      url.password ||
      LOCAL_HOSTNAMES.has(url.hostname) ||
      url.hostname.endsWith('.localhost')
    ) {
      return undefined;
    }

    return url.origin;
  } catch {
    return undefined;
  }
}

export function resolveSiteOrigin(
  requestHeaders?: HeadersLike,
  siteName?: string,
  locale?: string,
): string | undefined {
  const configuredOrigins = [
    process.env.NEXT_PUBLIC_SITE_URL,
    process.env.VERCEL_PROJECT_PRODUCTION_URL,
    process.env.SITECORE_EDITING_HOST_PUBLIC_HOST,
    process.env.PUBLIC_URL,
  ];

  for (const configuredOrigin of configuredOrigins) {
    const origin = normalizePublicOrigin(configuredOrigin);
    if (origin) return origin;
  }

  const forwardedHost = firstHeaderValue(
    requestHeaders?.get('x-forwarded-host') || null,
  );
  const requestHost = forwardedHost || firstHeaderValue(requestHeaders?.get('host') || null);
  const requestOrigin = normalizePublicOrigin(
    requestHost ? `https://${requestHost}` : undefined,
  );
  if (requestOrigin) return requestOrigin;

  const siteEntries = sites as SiteInfo[];
  const exactSiteEntry =
    siteEntries.find(
      (entry) =>
        entry.name === siteName &&
        entry.language === locale &&
        entry.hostName !== '*',
    ) ||
    siteEntries.find(
      (entry) => entry.name === siteName && entry.hostName !== '*',
    );

  return normalizePublicOrigin(exactSiteEntry?.hostName);
}

export function buildPageUrl(origin: string, path: string[] = []): string {
  const pathname = path.length ? `/${path.join('/')}` : '/';
  return `${origin}${encodeURI(pathname)}`;
}
