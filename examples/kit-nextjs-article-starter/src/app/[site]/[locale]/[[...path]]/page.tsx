import { isDesignLibraryPreviewData } from '@sitecore-content-sdk/nextjs/editing';
import { notFound } from 'next/navigation';
import { draftMode, headers } from 'next/headers';
import { SiteInfo } from '@sitecore-content-sdk/nextjs';
import sites from '.sitecore/sites.json';
import { routing } from 'src/i18n/routing';
import scConfig from 'sitecore.config';
import client from 'src/lib/sitecore-client';
import Layout from 'src/Layout';
import components from '.sitecore/component-map';
import Providers from 'src/Providers';
import { NextIntlClientProvider } from 'next-intl';
import { setRequestLocale } from 'next-intl/server';
import { resolvePageMetadata, type RouteFields } from '@/lib/page-metadata';
import { extractMainText } from '@/lib/search-body';
import { getLocalizedPathPrefixes } from '@/lib/localized-paths';

type PageProps = {
  params: Promise<{
    site: string;
    locale: string;
    path?: string[];
    [key: string]: string | string[] | undefined;
  }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

/**
 * Catch-all segments arrive URL-encoded ("Art%C3%ADculos"), but Sitecore routes
 * are matched on the decoded item name ("Artículos"), so every Spanish article
 * (and any other non-ASCII path) returned 404. Decode before fetching.
 */
function decodePath(path?: string[]): string[] {
  return (path ?? []).map((segment) => {
    try {
      return decodeURIComponent(segment);
    } catch {
      return segment;
    }
  });
}

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
    page = await client.getPage(decodePath(path), { site, locale });
  }

  // If the page is not found, return a 404
  if (!page) {
    notFound();
  }

  // Fetch the component data from Sitecore (Likely will be deprecated)
  // Pass the resolved locale so component-level GraphQL queries (e.g. the
  // SecondaryNavigation tree query) run in the correct language. Without it the
  // context defaults to the default language and nav labels render in English
  // even on es-MX pages.
  const componentProps = await client.getComponentData(
    page.layout,
    { locale },
    components,
  );

  // Map of item-name URL paths -> localized display-name paths for this locale,
  // used to render Spanish link hrefs (Edge serves item-name url.path).
  const localizedPaths = await getLocalizedPathPrefixes(locale);

  return (
    <NextIntlClientProvider>
      <Providers page={page} componentProps={componentProps} localizedPaths={localizedPaths}>
        <Layout page={page} localizedPaths={localizedPaths} />
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
    return await client.getAppRouterStaticParams(
      allowedSites,
      routing.locales.slice(),
    );
  }
  return [];
};

// Metadata fields for the page.
export const generateMetadata = async ({ params }: PageProps) => {
  const headersList = await headers();
  const host = headersList.get('host');
  const protocol = process.env.NODE_ENV === 'development' ? 'http' : 'https';
  const url = `${protocol}://${host}`;

  const { path, site, locale } = await params;

  // The same call as for rendering the page. Should be cached by default react behavior
  const page = await client.getPage(decodePath(path), { site, locale });
  const fields = page?.layout.sitecore.route?.fields as RouteFields;
  const pagePath = path?.length ? `/${path.join('/')}` : '/';
  const canonicalUrl = `${url}${pagePath}`;
  const metadata = resolvePageMetadata(fields, canonicalUrl);

  // The Sitecore Search crawler reads head `property=` meta (og:*) but not the page
  // <body>. Fold the article's full rendered body text into og:description so the
  // crawler can index the complete article content in whatever language this page
  // renders (equal en/es search coverage). The short name="description" tag below is
  // left untouched for SEO.
  const PLACEHOLDER_DESC = 'Sitecore Next.js App Router Example';
  const articleBody = extractMainText(page?.layout.sitecore.route);
  const ogSummary =
    metadata.ogDescription && metadata.ogDescription !== PLACEHOLDER_DESC
      ? metadata.ogDescription
      : '';
  const ogDescription =
    [ogSummary, articleBody].filter(Boolean).join(' ').replace(/\s+/g, ' ').trim() ||
    PLACEHOLDER_DESC;

  // Emit article taxonomy as Open Graph *article* meta so the Sitecore Search
  // crawler can extract author / content type / topics into facetable attributes.
  //
  // Important: the crawler's document extractor reads `property=`-based meta
  // (e.g. `<meta property="article:author">`), NOT custom `name=` meta tags.
  // Next renders openGraph.authors -> article:author, openGraph.tags ->
  // article:tag (one per value), and openGraph.section -> article:section.
  // Pages without a content type fall back to "content", exactly as on the
  // original CEC site, so the type facet and result badges match it.
  const tax = fields as unknown as {
    ArticleAuthor?: { value?: string };
    taxAuthor?: { name?: string };
    taxContentType?: { name?: string };
    taxTopic?: Array<{ name?: string }>;
  };
  const author = tax?.ArticleAuthor?.value || tax?.taxAuthor?.name || '';
  const contentType = tax?.taxContentType?.name || '';
  const topics = Array.isArray(tax?.taxTopic)
    ? tax.taxTopic.map((t) => t?.name).filter((n): n is string => !!n)
    : [];

  return {
    title: metadata.title,
    description: metadata.description || 'Sitecore Next.js App Router Example',
    alternates: { canonical: canonicalUrl },
    openGraph: {
      type: 'article',
      title: metadata.ogTitle,
      description: ogDescription,
      url: canonicalUrl,
      // -> <meta property="og:locale" content="es_MX"> (server-rendered so the
      //    Search crawler can tag each document's locale; renderJavaScript is off).
      locale: locale === 'en' ? 'en_US' : locale.replace('-', '_'),
      images: metadata.ogImage ? [metadata.ogImage] : undefined,
      // -> <meta property="article:author" content="...">
      ...(author ? { authors: [author] } : {}),
      // -> one <meta property="article:tag" content="..."> per topic
      ...(topics.length ? { tags: topics } : {}),
      // -> <meta property="article:section" content="..."> (the content type)
      section: contentType || 'content',
    },
  };
};
