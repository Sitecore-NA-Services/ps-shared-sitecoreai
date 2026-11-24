import type { SolterraMediaKey } from '../_support/solterra-media';
import type { SolterraPageKey } from '../_support/solterra-pages';
import type { ComponentKey } from './registry';

/**
 * Landing page manifests describe a page in Sitecore terms: rendering keys from the
 * registry, datasource item names and **Sitecore field names** (not React prop names).
 * Storybook renders a manifest with the real components, and the MCP `landing-page-get`
 * tool turns the same manifest into a Sitecore publish plan, so what you see is what
 * gets created.
 */

/** Image from the Solterra media library, referenced by catalog key. */
export type ImageValue = { media: SolterraMediaKey; alt?: string };

/** Link to an existing Solterra page (published as an internal link). */
export type InternalLinkValue = { text: string; page: SolterraPageKey; anchor?: string };

/** Link to an absolute URL (published as an external link). */
export type ExternalLinkValue = { text: string; url: string; target?: '_blank' };

export type LinkValue = InternalLinkValue | ExternalLinkValue;

/**
 * Plain strings are used for Single-Line Text, Multi-Line Text and Rich Text fields
 * (Rich Text values are HTML).
 */
export type FieldValue = string | ImageValue | LinkValue;

export type FieldValues = Record<string, FieldValue>;

export type ChildItem = {
  /** Item name of the child datasource item. */
  name: string;
  fields: FieldValues;
};

export type ComponentEntry = {
  /** Registry key, see `SITECORE_COMPONENTS`. */
  component: ComponentKey;
  /** Item name of the datasource created under the page's `Data` folder. */
  name: string;
  /** Headless variant name (must exist in the registry entry's `variants`). Defaults to `Default`. */
  variant?: string;
  fields: FieldValues;
  children?: ChildItem[];
};

/**
 * Section containers, mirroring how Solterra landing pages are built in Pages:
 * - `full-bleed`: Container Full Bleed in `headless-main`, component inside it
 * - `full-width`: Container Full Width in `headless-main`, component inside it
 * - `full-bleed/full-width`: Full Width nested in Full Bleed, component inside the Full Width
 */
export type SectionContainer = 'full-bleed' | 'full-width' | 'full-bleed/full-width';

export type Section = {
  container: SectionContainer;
  components: ComponentEntry[];
};

export type LandingPageFields = {
  /** Navigation/browser title. */
  pageTitle: string;
  /** Large H1 shown by the Page Header component (falls back to `pageTitle`). */
  pageHeaderTitle?: string;
  /** Intro copy shown by the Page Header component (Rich Text). */
  pageSubtitle?: string;
  pageShortTitle?: string;
  pageSummary?: string;
  ogTitle?: string;
  ogDescription?: string;
  metadataDescription?: string;
};

export type LandingPageManifest = {
  /** Stable identifier, also used by the MCP tools. */
  id: string;
  title: string;
  description: string;
  site: 'solterra';
  page: {
    /** Sitecore item name (becomes the URL segment). */
    name: string;
    /** Existing page the new page is created under. */
    parent: SolterraPageKey;
    fields: LandingPageFields;
  };
  sections: Section[];
};

export const isImageValue = (value: FieldValue): value is ImageValue =>
  typeof value === 'object' && value !== null && 'media' in value;

export const isLinkValue = (value: FieldValue): value is LinkValue =>
  typeof value === 'object' && value !== null && 'text' in value && ('page' in value || 'url' in value);

export const isInternalLink = (value: LinkValue): value is InternalLinkValue => 'page' in value;
