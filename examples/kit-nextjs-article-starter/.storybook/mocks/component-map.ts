import type { ComponentMap } from '@sitecore-content-sdk/nextjs';

/**
 * Storybook stand-in for `.sitecore/component-map`. The real map imports every component,
 * including server-only ones (Sitecore client, search, editing), which cannot run in the
 * Storybook browser bundle. Stories render components directly, so placeholders stay empty.
 */
const componentMap: ComponentMap = new Map();

export default componentMap;
