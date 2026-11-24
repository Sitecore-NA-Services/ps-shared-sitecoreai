import type React from 'react';
import { useMemo } from 'react';
import { NextIntlClientProvider } from 'next-intl';
import { SitecoreProvider, type ComponentMap } from '@sitecore-content-sdk/nextjs';
import { VideoProvider } from '@/contexts/VideoContext';
import { LocalizedPathsProvider } from '@/lib/localize-href';
import { SubscriptionBannerDictionaryKeys } from '@/components/subscription-banner/subscription-banner.dictionary';
import { createMockPage } from './mock-page';

/** Values for the Sitecore dictionary items the previewed components read. */
const STORYBOOK_MESSAGES: Record<string, string> = {
  [SubscriptionBannerDictionaryKeys.SUBSCRIPTIONBANNER_BUTTON_LABEL]: 'Subscribe',
  [SubscriptionBannerDictionaryKeys.SUBSCRIPTIONBANNER_EMAIL_FIELD_PLACEHOLDER]:
    'Enter your email address',
  [SubscriptionBannerDictionaryKeys.SUBSCRIPTIONBANNER_SUCCESS_MESSAGE]: 'Thank you for subscribing',
  [SubscriptionBannerDictionaryKeys.SUBSCRIPTIONBANNER_EMAIL_FORMAT_ERROR]: 'Email format is invalid',
};

const EMPTY_COMPONENT_MAP: ComponentMap = new Map();
const STORYBOOK_API = { edge: { contextId: 'storybook', clientContextId: 'storybook' } };

export type SitecoreStoryProviderProps = {
  isEditing?: boolean;
  children: React.ReactNode;
};

/** Stands in for the app's Providers + Layout so components render outside Next.js routing. */
export function SitecoreStoryProvider({ isEditing = false, children }: SitecoreStoryProviderProps) {
  const page = useMemo(() => createMockPage({ isEditing }), [isEditing]);

  return (
    <SitecoreProvider
      api={STORYBOOK_API as React.ComponentProps<typeof SitecoreProvider>['api']}
      componentMap={EMPTY_COMPONENT_MAP}
      page={page}
    >
      <NextIntlClientProvider locale="en" messages={STORYBOOK_MESSAGES} timeZone="America/Chicago">
        <LocalizedPathsProvider map={{}}>
          <VideoProvider>
            <div className={isEditing ? 'editing-mode' : 'prod-mode'}>{children}</div>
          </VideoProvider>
        </LocalizedPathsProvider>
      </NextIntlClientProvider>
    </SitecoreProvider>
  );
}
