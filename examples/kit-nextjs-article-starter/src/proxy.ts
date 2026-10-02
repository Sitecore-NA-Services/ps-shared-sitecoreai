import { type NextRequest, type NextFetchEvent, NextResponse } from 'next/server';
import {
  defineProxy,
  AppRouterMultisiteProxy,
  PersonalizeProxy,
  RedirectsProxy,
  LocaleProxy,
  BotTrackingProxy,
  PreviewProxy,
} from '@sitecore-content-sdk/nextjs/proxy';
import sites from '.sitecore/sites.json';
import scConfig from 'sitecore.config';
import { routing } from './i18n/routing';
import client from './lib/sitecore-client';

/**
 * Map a request hostname to the locale that domain should serve, so the site
 * language can be selected by domain (e.g. an es-MX domain vs the default en
 * domain) without duplicating the content tree.
 *
 * Driven entirely by the LOCALE_DOMAIN_MAP env var so deployment-specific hosts
 * never get baked into source. Format: a comma-separated list of host=locale
 * pairs, for example:
 *   LOCALE_DOMAIN_MAP="es.example.com=es-MX,fr.example.com=fr-FR"
 *
 * Each locale must also be declared in src/i18n/routing.ts and enabled (with
 * content versions) in XM Cloud. The Content SDK's LocaleProxy runs first
 * and resolves the locale before any site is known, so hostname-based language
 * selection belongs here rather than in site/multisite config.
 * See: https://doc.sitecore.com/sai/en/developers/content-sdk/internationalization-using-next-intl.html
 */
function parseDomainLocaleMap(raw: string | undefined): Record<string, string> {
  const map: Record<string, string> = {};
  if (!raw) return map;
  for (const pair of raw.split(',')) {
    const [host, loc] = pair.split('=').map((s) => s.trim());
    // Lower-case host keys for case-insensitive matching against the request host.
    if (host && loc) map[host.toLowerCase()] = loc;
  }
  return map;
}

const domainLocaleMap = parseDomainLocaleMap(process.env.LOCALE_DOMAIN_MAP);
const supportedLocales = routing.locales.slice();

/**
 * LocaleProxy that selects the language from the request hostname when the
 * URL has no explicit locale prefix. An explicit locale in the path always wins,
 * so /es-MX/... still works on any domain.
 *
 * Resolution order:
 * 1. LOCALE_DOMAIN_MAP env var (explicit override, useful before Site Grouping is deployed)
 * 2. site.language from sites.json — populated automatically by sitecore-tools:generate-map
 *    once a Site Grouping item with the correct HostName/POS is pushed to XM Cloud
 * 3. Base proxy resolution (locale header → defaultLanguage → 'en')
 */
class DomainLocaleProxy extends LocaleProxy {
  protected getLanguage(req: NextRequest, res?: NextResponse): string {
    const host = this.getHostHeader(req)?.toLowerCase();

    // 1. Explicit LOCALE_DOMAIN_MAP override
    const mapped = host ? domainLocaleMap[host] : undefined;
    if (mapped && supportedLocales.includes(mapped)) {
      return mapped;
    }

    // 2. Language from Site Grouping (via sites.json) — driven by the POS field on the
    //    Site Grouping item (e.g. "es-MX=solterra"). This removes the need for
    //    LOCALE_DOMAIN_MAP once the Spanish Site Grouping is deployed to XM Cloud.
    if (host) {
      try {
        const siteLanguage = this.getSite(req, res)?.language;
        if (siteLanguage && supportedLocales.includes(siteLanguage)) {
          return siteLanguage;
        }
      } catch {
        // SiteResolver throws if the host doesn't match — fall through to default
      }
    }

    return super.getLanguage(req, res);
  }
}

type PersonalizeExperienceParams = ReturnType<PersonalizeProxy['getExperienceParams']>;
type ExtendedExperienceParams = PersonalizeExperienceParams & { sampleParam?: string };

// Extend proxy so sampleParam is emitted as a top-level request param
class SampleParamPersonalizeProxy extends PersonalizeProxy {
  protected getExperienceParams(req: NextRequest): ExtendedExperienceParams {
    console.log('[Personalize Proxy] Getting experience params for:', req.nextUrl.pathname);
    const params = super.getExperienceParams(req) as ExtendedExperienceParams;

    const sampleValue = req.nextUrl.searchParams.get('sampleParam') || undefined;

    if (sampleValue) {
      params.sampleParam = sampleValue;
      console.log('[Personalize Proxy] sampleParam captured:', sampleValue);
    }

    console.log('[Personalize Proxy] Experience params:', JSON.stringify(params, null, 2));
    return params;
  }

  // Personalize returns null for a flow it does not know (e.g. page variants Edge still lists
  // after the page's own flow is gone). The SDK reads `.variantId` off that null inside one
  // Promise.all, so a single orphaned flow throws away every other variant on the page.
  protected async personalize(
    args: Parameters<PersonalizeProxy['personalize']>[0]
  ): ReturnType<PersonalizeProxy['personalize']> {
    const result = await super.personalize(args);
    if (!result) {
      console.warn('[Personalize Proxy] No result for flow', args.friendlyId);
      return { variantId: '' };
    }
    return result;
  }
}

export default function proxy(req: NextRequest, event: NextFetchEvent) {
  // The Articles listing page was removed from navigation in favor of the search
  // page; redirect anyone who still lands on it directly to /search.
  if (req.nextUrl.pathname === '/Articles') {
    return NextResponse.redirect(new URL('/search', req.url), { status: 301 });
  }

  // PreviewProxy authorizes preview requests
  const preview = new PreviewProxy({
    client: client,
    ...scConfig.api.edge,
  });

  // BotTrackingProxy will detect and track bots before any other proxies run
  const botTracking = new BotTrackingProxy({
    ...scConfig.api.edge,
    sites,
    fetchEvent: event,
  });

  const locale = new DomainLocaleProxy({
    /**
     * List of sites for site resolver to work with
     */
    sites,
    /**
     * List of all supported locales configured in routing.ts
     */
    locales: routing.locales.slice(),
    /**
     * Default language to use if no language is identified in the request
     */
    defaultLanguage: scConfig.defaultLanguage,
    // This function determines if the proxy should be turned off on per-request basis.
    // Certain paths are ignored by default (e.g. files and Next.js API routes), but you may wish to disable more.
    // This is an important performance consideration since Next.js Edge proxy runs on every request.
    // in multilanguage scenarios, we need locale proxy to always run first to ensure locale is set and used correctly by the rest of the proxies
    skip: () => false,
  });

  const multisite = new AppRouterMultisiteProxy({
    /**
     * List of sites for site resolver to work with
     */
    sites,
    ...scConfig.multisite,
    // This function determines if the proxy should be turned off on per-request basis.
    // Certain paths are ignored by default (e.g. files and Next.js API routes), but you may wish to disable more.
    // This is an important performance consideration since Next.js Edge proxy runs on every request.
    skip: () => false,
  });

  const redirects = new RedirectsProxy({
    /**
     * List of sites for site resolver to work with
     */
    sites,
    ...scConfig.api.edge,
    ...scConfig.api.local,
    ...scConfig.redirects,
    // This function determines if the proxy should be turned off on per-request basis.
    // Certain paths are ignored by default (e.g. Next.js API routes), but you may wish to disable more.
    // By default it is disabled while in development mode.
    // This is an important performance consideration since Next.js Edge proxy runs on every request.
    skip: () => false,
  });

  const personalize = new SampleParamPersonalizeProxy({
    /**
     * List of sites for site resolver to work with
     */
    sites,
    ...scConfig.api.edge,
    ...scConfig.personalize,
    // This function determines if the proxy should be turned off on per-request basis.
    // Certain paths are ignored by default (e.g. Next.js API routes), but you may wish to disable more.
    // By default it is disabled while in development mode.
    // This is an important performance consideration since Next.js Edge proxy runs on every request.
    // NOTE: Personalize requires Edge configuration and cannot work with local containers.
    // The proxy will disable itself if Edge config is not present.
    skip: () => false,
  });

  return defineProxy(preview, botTracking, locale, multisite, redirects, personalize).exec(req);
}

export const config = {
  /*
   * Match all paths except for:
   * 1. API route handlers
   * 2. /_next (Next.js internals)
   * 3. /sitecore/api (Sitecore API routes)
   * 4. /- (Sitecore media)
   * 5. /healthz (Health check)
   * 7. all root files inside /public
   */
  matcher: [
    '/',
    '/((?!api/|sitemap|robots|_next/|healthz|sitecore/api/|-/|favicon.ico|sc_logo.svg).*)',
  ],
};
