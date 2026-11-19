import type { SiteInfo } from '@sitecore-content-sdk/nextjs';
import sites from '.sitecore/sites.json';

const LOCAL_HOSTNAMES = new Set(['localhost', '127.0.0.1', '::1']);

function normalizePublicOrigin(value: string | undefined): string | undefined {
  if (!value || value === '*') return undefined;

  try {
    const candidate = value.trim();
    const url = new URL(candidate.includes('://') ? candidate : `https://${candidate}`);
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

export function resolveSiteOrigin(siteName?: string, locale?: string): string | undefined {
  const configuredOrigin = normalizePublicOrigin(
    process.env.NEXT_PUBLIC_SITE_URL ||
      process.env.VERCEL_PROJECT_PRODUCTION_URL ||
      process.env.SITECORE_EDITING_HOST_PUBLIC_HOST ||
      process.env.PUBLIC_URL
  );
  if (configuredOrigin) return configuredOrigin;

  const siteEntries = sites as SiteInfo[];
  const exactSiteEntry =
    siteEntries.find(
      (entry) => entry.name === siteName && entry.language === locale && entry.hostName !== '*'
    ) || siteEntries.find((entry) => entry.name === siteName && entry.hostName !== '*');

  return normalizePublicOrigin(exactSiteEntry?.hostName);
}

export function buildPageUrl(origin: string, path: string | string[] = []): string {
  const pathname = Array.isArray(path)
    ? path.length
      ? `/${path.join('/')}`
      : '/'
    : path.startsWith('/')
      ? path
      : `/${path}`;
  return `${origin}${encodeURI(pathname)}`;
}
