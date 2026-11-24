import type { Page } from '@sitecore-content-sdk/nextjs';

export type MockPageOptions = {
  /** Render as Pages (editing) would, i.e. show empty fields and editing hints. */
  isEditing?: boolean;
  locale?: string;
  routeFields?: Record<string, unknown>;
};

/** Minimal `Page` the Content SDK expects, standing in for the layout service response. */
export function createMockPage({
  isEditing = false,
  locale = 'en',
  routeFields = {},
}: MockPageOptions = {}): Page {
  return {
    siteName: 'solterra',
    locale,
    mode: {
      name: isEditing ? 'edit' : 'normal',
      designLibrary: { isVariantGeneration: false },
      isNormal: !isEditing,
      isPreview: false,
      isEditing,
      isDesignLibrary: false,
    },
    layout: {
      sitecore: {
        context: {
          pageEditing: isEditing,
          site: { name: 'solterra' },
          language: locale,
          itemPath: '/',
        },
        route: {
          name: 'storybook',
          placeholders: {},
          fields: routeFields,
        },
      },
    },
  } as unknown as Page;
}
