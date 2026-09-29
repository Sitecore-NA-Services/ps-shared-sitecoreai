/**
 * This Layout is needed for Starter Kit.
 */
import React, { Suspense, type JSX } from 'react';
import Head from 'next/head';
import {
  Page,
  Field,
  ImageField,
  AppPlaceholder,
  DesignLibraryApp,
} from '@sitecore-content-sdk/nextjs';
import Scripts from 'src/Scripts';
import SitecoreStyles from 'components/content-sdk/SitecoreStyles';
import GuestDataCapture from 'components/content-sdk/GuestDataCapture';
import { Figtree } from 'next/font/google';
import componentMap from '.sitecore/component-map';
import Providers from './Providers';
import { resolvePageMetadata, type RouteFields } from '@/lib/page-metadata';
import type { PrefixMap } from '@/lib/localize-href';
import HtmlLang from '@/components/util/HtmlLang';

const heading = Figtree({
  weight: ['400', '500'],
  variable: '--font-heading',
  subsets: ['latin', 'latin-ext'],
  display: 'swap',
});

const body = Figtree({
  weight: ['400', '500'],
  variable: '--font-body',
  subsets: ['latin', 'latin-ext'],
  display: 'swap',
});
interface LayoutProps {
  page: Page;
  localizedPaths?: PrefixMap;
}

const Layout = ({ page, localizedPaths = {} }: LayoutProps): JSX.Element => {
  const { layout, mode } = page;
  const { route } = layout.sitecore;
  const fields = route?.fields as RouteFields;
  const mainClassPageEditing = mode.isEditing ? 'editing-mode' : 'prod-mode';
  const classNamesMain = `${mainClassPageEditing} ${body.variable} ${heading.variable} main-layout`;
  const metadata = resolvePageMetadata(fields);
  return (
    <>
      <HtmlLang lang={layout.sitecore.context?.language} />
      <Scripts />
      <SitecoreStyles layoutData={layout} />
      <Head>
        <link rel="preconnect" href="https://edge-platform.sitecorecloud.io" />
        <title>{metadata.title}</title>
        {metadata.description && (
          <meta name="description" content={metadata.description} />
        )}
        {metadata.keywords && <meta name="keywords" content={metadata.keywords} />}
        {metadata.canonicalUrl && (
          <link rel="canonical" href={metadata.canonicalUrl} />
        )}
        <link rel="icon" href="/favicon.ico" />
        {metadata.ogTitle && <meta property="og:title" content={metadata.ogTitle} />}
        {metadata.ogDescription && (
          <meta property="og:description" content={metadata.ogDescription} />
        )}
        {metadata.ogImage && <meta property="og:image" content={metadata.ogImage} />}
      </Head>
      <Providers page={page} localizedPaths={localizedPaths}>
        {/* Capture query string parameters for CDP personalization */}
        <Suspense fallback={null}>
          <GuestDataCapture />
        </Suspense>
        {/* root placeholder for the app, which we add components to using route data */}
        <div className={`min-h-screen flex flex-col ${classNamesMain}`}>
          {mode.isDesignLibrary ? (
            route && (
              <DesignLibraryApp
                page={page}
                rendering={route}
                componentMap={componentMap}
                loadServerImportMap={() =>
                  import('.sitecore/import-map.server')
                }
              />
            )
          ) : (
            <>
              <header>
                <div id="header">
                  {route && (
                    <AppPlaceholder
                      page={page}
                      componentMap={componentMap}
                      name="headless-header"
                      rendering={route}
                    />
                  )}
                </div>
              </header>
              <main>
                <div id="content" className="antialiased">
                  {route && (
                    <AppPlaceholder
                      page={page}
                      componentMap={componentMap}
                      name="headless-main"
                      rendering={route}
                    />
                  )}
                </div>
              </main>
              <footer>
                <div id="footer">
                  {route && (
                    <AppPlaceholder
                      page={page}
                      componentMap={componentMap}
                      name="headless-footer"
                      rendering={route}
                    />
                  )}
                </div>
              </footer>
            </>
          )}
        </div>
      </Providers>
    </>
  );
};

export default Layout;
