import { SOLTERRA_MEDIA } from '../_support/solterra-media';
import { SOLTERRA_PAGES } from '../_support/solterra-pages';
import {
  type FieldValue,
  type ImageValue,
  type LinkValue,
  isImageValue,
  isInternalLink,
  isLinkValue,
} from './manifest';

const escapeXml = (value: string) =>
  value
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

const toSitecoreGuid = (id: string) => `{${id.toUpperCase()}}`;

/** Raw value to store in a Sitecore field (what create_content_item / update_fields_on_item expect). */
export function toSitecoreFieldValue(value: FieldValue): string {
  if (typeof value === 'string') {
    return value;
  }
  if (isImageValue(value)) {
    const media = SOLTERRA_MEDIA[value.media];
    return `<image mediaid="${toSitecoreGuid(media.mediaId)}" alt="${escapeXml(value.alt ?? media.alt)}" />`;
  }
  if (isLinkValue(value)) {
    if (isInternalLink(value)) {
      const page = SOLTERRA_PAGES[value.page];
      return `<link linktype="internal" id="${toSitecoreGuid(page.id)}" text="${escapeXml(value.text)}" anchor="${escapeXml(value.anchor ?? '')}" querystring="" target="" title="" class="" />`;
    }
    return `<link linktype="external" url="${escapeXml(value.url)}" text="${escapeXml(value.text)}" target="${value.target ?? ''}" title="" class="" />`;
  }
  throw new Error(`Unsupported field value: ${JSON.stringify(value)}`);
}

export type RenderTextField = { value: string };
export type RenderImageField = {
  value: { src: string; alt: string; width: number; height: number };
};
export type RenderLinkField = {
  value: { href: string; text: string; linktype: string; target?: string; id?: string; anchor?: string };
};

export const toTextField = (value?: FieldValue): RenderTextField => ({
  value: typeof value === 'string' ? value : '',
});

export const toImageField = (value?: FieldValue): RenderImageField | undefined => {
  if (!value || !isImageValue(value)) {
    return undefined;
  }
  const media = SOLTERRA_MEDIA[value.media];
  return {
    value: { src: media.src, alt: value.alt ?? media.alt, width: media.width, height: media.height },
  };
};

export const toLinkField = (value?: FieldValue): RenderLinkField | undefined => {
  if (!value || !isLinkValue(value)) {
    return undefined;
  }
  if (isInternalLink(value)) {
    const page = SOLTERRA_PAGES[value.page];
    return {
      value: {
        href: page.route + (value.anchor ? `#${value.anchor}` : ''),
        text: value.text,
        linktype: 'internal',
        id: page.id,
      },
    };
  }
  return {
    value: { href: value.url, text: value.text, linktype: 'external', target: value.target ?? '' },
  };
};

/** Wraps a field in the `{ jsonValue }` shape that GraphQL-backed components receive. */
export const jsonValue = <T>(field: T | undefined): { jsonValue: T } | undefined =>
  field === undefined ? undefined : { jsonValue: field };

export type { FieldValue, ImageValue, LinkValue };
