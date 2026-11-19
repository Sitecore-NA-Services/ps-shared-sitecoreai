import { environment } from '../../environments/environment';

type PublicEnvironment = Record<string, string> & {
  CSDK_PUBLIC_SITE_URL?: string;
};

const LOCAL_HOSTNAMES = new Set(['localhost', '127.0.0.1', '::1']);

export function resolveSiteOrigin(requestOrigin?: string): string | undefined {
  const configuredOrigin = (environment as PublicEnvironment).CSDK_PUBLIC_SITE_URL;
  for (const value of [configuredOrigin, requestOrigin]) {
    if (!value) continue;
    try {
      const url = new URL(value.includes('://') ? value : `https://${value}`);
      if (
        (url.protocol !== 'http:' && url.protocol !== 'https:') ||
        LOCAL_HOSTNAMES.has(url.hostname) ||
        url.hostname.endsWith('.localhost')
      ) {
        continue;
      }
      return url.origin;
    } catch {
      continue;
    }
  }
  return undefined;
}

export function buildPageUrl(origin: string, pathname: string): string {
  const path = pathname.startsWith('/') ? pathname : `/${pathname}`;
  return `${origin}${encodeURI(path)}`;
}
