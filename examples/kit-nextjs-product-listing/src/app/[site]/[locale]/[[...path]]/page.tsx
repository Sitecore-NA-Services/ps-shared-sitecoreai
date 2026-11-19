import { isDesignLibraryPreviewData } from '@sitecore-content-sdk/nextjs/editing';
import { notFound } from 'next/navigation';
import { draftMode, headers } from 'next/headers';
import { SiteInfo } from '@sitecore-content-sdk/nextjs';
import sites from '.sitecore/sites.json';
import { routing } from 'src/i18n/routing';
import scConfig from 'sitecore.config';
import client from 'src/lib/sitecore-client';
import Layout, { RouteFields } from 'src/Layout';
import components from '.sitecore/component-map';
import Providers from 'src/Providers';
import { NextIntlClientProvider } from 'next-intl';
import { setRequestLocale } from 'next-intl/server';
import { buildPageUrl, resolveSiteOrigin } from '@/lib/site-url';

type PageProps = {
  params: Promise<{
    site: string;
    locale: string;
    path?: string[];
    [key: string]: string | string[] | undefined;
  }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

export default async function Page({ params, searchParams }: PageProps) {
  const { site, locale, path } = await params;
  const draft = await draftMode();

  // Set site and locale to be available in src/i18n/request.ts for fetching the dictionary
  setRequestLocale(`${site}_${locale}`);

  // Fetch the page data from Sitecore
  let page;
  if (draft.isEnabled) {
    const editingParams = await searchParams;
    if (isDesignLibraryPreviewData(editingParams)) {
      page = await client.getDesignLibraryData(editingParams);
    } else {
      page = await client.getPreview(editingParams);
    }
  } else {
    page = await client.getPage(path ?? [], { site, locale });
  }

  // If the page is not found, return a 404
  if (!page) {
    notFound();
  }

  // Fetch the component data from Sitecore (Likely will be deprecated)
  const componentProps = await client.getComponentData(page.layout, {}, components);

  return (
    <NextIntlClientProvider>
      <Providers page={page} componentProps={componentProps}>
        <Layout page={page} />
      </Providers>
    </NextIntlClientProvider>
  );
}
// This function gets called at build and export time to determine
// pages for SSG ("paths", as tokenized array).
export const generateStaticParams = async () => {
  if (process.env.NODE_ENV !== 'development' && scConfig.generateStaticPaths) {
    // Filter sites to only include the sites this starter is designed to serve.
    // This prevents cross-site build errors when multiple starters share the same XM Cloud instance.
    const defaultSite = scConfig.defaultSite;
    const allowedSites = defaultSite
      ? sites
          .filter((site: SiteInfo) => site.name === defaultSite)
          .map((site: SiteInfo) => site.name)
      : sites.map((site: SiteInfo) => site.name);

    return await client.getAppRouterStaticParams(allowedSites, routing.locales.slice());
  }
  return [];
};

// Metadata fields for the page.
export const generateMetadata = async ({ params }: PageProps) => {
  const headersList = await headers();
  const { path, site, locale } = await params;
  const siteOrigin = resolveSiteOrigin(headersList, site, locale);
  const canonicalUrl = siteOrigin ? buildPageUrl(siteOrigin, path) : undefined;

  // The same call as for rendering the page. Should be cached by default react behavior
  const page = await client.getPage(path ?? [], { site, locale });
  // Cast route fields once to the expected RouteFields shape to avoid accessing unknown {}
  const routeFields = (page?.layout.sitecore.route?.fields ?? {}) as RouteFields;

  const metadataTitle = routeFields?.metadataTitle?.value?.toString();
  const pageTitle = routeFields?.pageTitle?.value?.toString();
  const ogDescription = routeFields?.ogDescription?.value?.toString();
  const description = routeFields?.metadataDescription?.value?.toString();
  const ogTitle = routeFields?.ogTitle?.value?.toString();
  const ogImageSrc = routeFields?.ogImage?.value?.src;

  return {
    title: metadataTitle || pageTitle || 'Page',
    description: ogDescription || description || 'SYNC',
    ...(canonicalUrl && { alternates: { canonical: canonicalUrl } }),
    openGraph: {
      title: ogTitle || 'Page',
      type: 'website',
      description: ogDescription || description || 'SYNC',
      url: canonicalUrl,
      images:
        ogImageSrc ||
        'https://edge.sitecorecloud.io/sitecoresaa60dc-chahcontentabf6-maina179-91b6/media/Feature/JSS-Experience-Accelerator/Basic-Site/banner-image.jpg?h=2001&iar=0&w=3000',
    },
  };
};
