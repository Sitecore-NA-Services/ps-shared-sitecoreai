/**
 * Sitecore metadata for every component a Solterra landing page can use.
 * IDs were read from the Solterra site in the ps-shared environment (rendering items under
 * /sitecore/layout/Renderings/Project/click-click-launch and datasources of existing
 * Solterra landing pages). This file is React-free so the MCP function can bundle it.
 */

export type SitecoreFieldType =
  | 'Single-Line Text'
  | 'Multi-Line Text'
  | 'Rich Text'
  | 'Image'
  | 'General Link';

export type FieldSpec = {
  name: string;
  type: SitecoreFieldType;
  required?: boolean;
  description?: string;
};

export type TemplateRef = { id: string; name: string };

export type SitecoreComponentSpec = {
  /** Display name of the rendering in Pages. */
  renderingName: string;
  renderingId: string;
  /** Storybook title of the component's stories. */
  storyTitle: string;
  usage: string;
  /** Template every new datasource item must use. */
  datasourceTemplate: TemplateRef;
  /**
   * True when the rendering's configured "Datasource Template" differs from the template
   * the React component reads. The publish plan then creates the datasource explicitly
   * and attaches it with set_component_datasource.
   */
  createDatasourceExplicitly?: boolean;
  fields: FieldSpec[];
  children?: {
    template: TemplateRef;
    /** Suggested child item name prefix. */
    itemName: string;
    fields: FieldSpec[];
    min?: number;
    max?: number;
  };
  /** Headless variant name -> variant definition item ID (FieldNames rendering parameter). */
  variants?: Record<string, string>;
  notes?: string[];
};

export const SOLTERRA_SITE = {
  name: 'solterra',
  siteId: '8693bf90-d2da-46f4-9782-517d8a920d0a',
  homePath: '/sitecore/content/nextjs-article_starter/solterra/Home',
  landingPageTemplate: { id: 'f2d4db83-3e54-4b3d-8577-f0772ae289f0', name: 'Landing Page' },
  pageDataFolderTemplate: { id: '1c82e550-ebcd-4e5d-8abd-d50d0809541e', name: 'Page Data' },
  mainPlaceholder: 'headless-main',
} as const;

export const SECTION_CONTAINERS = {
  fullBleed: {
    renderingName: 'Container Full Bleed',
    renderingId: 'e80c2a78-fcc2-4d32-8ec5-4133f608be5c',
    placeholderPrefix: 'container-fullbleed',
  },
  fullWidth: {
    renderingName: 'Container Full Width',
    renderingId: '02340885-3692-4cad-ac11-ed61206501a3',
    placeholderPrefix: 'container-fullwidth',
  },
} as const;

const text = (name: string, required = false, description?: string): FieldSpec => ({
  name,
  type: 'Single-Line Text',
  required,
  description,
});
const multiline = (name: string, required = false, description?: string): FieldSpec => ({
  name,
  type: 'Multi-Line Text',
  required,
  description,
});
const rich = (name: string, required = false, description?: string): FieldSpec => ({
  name,
  type: 'Rich Text',
  required,
  description,
});
const image = (name: string, required = false, description?: string): FieldSpec => ({
  name,
  type: 'Image',
  required,
  description,
});
const link = (name: string, required = false, description?: string): FieldSpec => ({
  name,
  type: 'General Link',
  required,
  description,
});

export const SITECORE_COMPONENTS = {
  Hero: {
    renderingName: 'Hero',
    renderingId: '6d0aae4a-c2d1-4f3a-8285-705d13de8244',
    storyTitle: 'Solterra/Components/Hero',
    usage: 'Opening section of a campaign or home-style page: large headline, intro, CTA and a strip of four images or ambient videos.',
    datasourceTemplate: { id: 'a19c3230-c5ee-47a1-ae3f-12a1fc3c4273', name: 'Hero' },
    createDatasourceExplicitly: true,
    fields: [
      text('titleRequired', true, 'Headline (H1)'),
      text('descriptionOptional', false, 'Intro paragraph'),
      link('linkOptional', false, 'Primary CTA'),
      image('heroImageOptional1', false, 'Tall image, position 1'),
      link('heroVideoOptional1', false, 'MP4 URL that replaces image 1'),
      image('heroImageOptional2', false, 'Short image, position 2'),
      link('heroVideoOptional2'),
      image('heroImageOptional3', false, 'Tall image, position 3'),
      link('heroVideoOptional3'),
      image('heroImageOptional4', false, 'Tall image, position 4'),
      link('heroVideoOptional4'),
    ],
    variants: { Default: 'f6b86420-89ea-4753-865a-c33f4badcf16' },
    notes: [
      'The Hero rendering\'s configured datasource template (ae018465-4e68-4a49-8b15-9702274fa75a, fields title/badge/bannerCTA) is NOT the one this component reads. Always create the datasource from template a19c3230-c5ee-47a1-ae3f-12a1fc3c4273 and attach it.',
    ],
  },
  PageHeader: {
    renderingName: 'Page Header',
    renderingId: 'c78595d2-0892-4ec6-9ff8-b71edbf17861',
    storyTitle: 'Solterra/Components/Page Header',
    usage: 'Standard top of a Solterra landing page. Title and subtitle come from the PAGE fields pageHeaderTitle (or pageTitle) and pageSubtitle; the datasource supplies the image, the logo strip caption and the logos.',
    datasourceTemplate: { id: '754d4fd3-aa54-46d0-84bd-0bb43f8aeba0', name: 'Page Header' },
    fields: [
      image('imageRequired', true, 'Image shown on the right'),
      text('logoText', false, 'Caption above the logo strip'),
      link('link1'),
      link('link2'),
    ],
    children: {
      template: { id: 'b895f657-9a7b-438b-a2f2-95fb1722be7f', name: 'Logo List Image' },
      itemName: 'Logo List Image',
      fields: [image('image', true)],
      max: 6,
    },
  },
  LogoTabs: {
    renderingName: 'Logo Tab',
    renderingId: '14ca65a5-8661-4195-ac0e-51c0e58c695d',
    storyTitle: 'Solterra/Components/Logo Tabs',
    usage: 'Audience or partner tabs over a full-bleed background image. Each child is one tab: its logo, title, a short statement and an optional link.',
    datasourceTemplate: { id: '07ec4360-f49a-48dd-ab46-5a5fa89cde7b', name: 'Logo Tab' },
    fields: [
      text('titleRequired', true, 'Section heading'),
      image('imageOptional', false, 'Background image'),
    ],
    children: {
      template: { id: '2b90bf80-bb08-44a2-ad76-600ad0ed915b', name: 'Log Tab Item' },
      itemName: 'Log Tab Item',
      fields: [
        text('titleRequired', true, 'Tab label (shown under the logo)'),
        image('imageRequired', true, 'Logo'),
        text('descriptionOptional', false, 'Statement shown when the tab is active'),
        link('linkOptional', false, 'CTA shown when the tab is active'),
      ],
      min: 1,
      max: 6,
    },
  },
  VerticalImageAccordion: {
    renderingName: 'Vertical Image Accordion',
    renderingId: 'd3b4a150-de17-4112-ab45-cd40a6d5a776',
    storyTitle: 'Solterra/Components/Vertical Image Accordion',
    usage: 'Three image panels that expand on hover/focus, each with a title, description and link. Good for solution areas or process steps.',
    datasourceTemplate: { id: '22c53a61-7af2-4cc6-86a5-06e0fdb85ee5', name: 'Vertical Image Accordion' },
    fields: [text('titleOptional', false, 'Section heading')],
    children: {
      template: { id: 'e64d342f-e5aa-4233-88c4-58ccd451a7d3', name: 'Vertical Accordion Item' },
      itemName: 'Vertical Accordion Item',
      fields: [
        text('titleRequired', true),
        image('imageRequired', true),
        text('descriptionOptional'),
        link('linkOptional'),
      ],
      min: 1,
      max: 3,
    },
    notes: ['The component query reads only the first 3 children.'],
  },
  MultiPromo: {
    renderingName: 'MultiPromo',
    renderingId: 'd806ddf7-39a7-4a6d-8e0a-d138bc53845d',
    storyTitle: 'Solterra/Components/Multi Promo',
    usage: 'Heading plus a row of image promo cards (carousel on small screens).',
    datasourceTemplate: { id: '775d6354-cf01-4f34-9713-d34645079c88', name: 'MultiPromo' },
    fields: [text('title', true), text('description')],
    children: {
      template: { id: 'f94c8c17-70e8-4d8b-9d35-d0465c0e0945', name: 'SimplePromo' },
      itemName: 'Promo',
      fields: [text('heading', true), image('image', true), text('description'), link('link')],
      min: 2,
      max: 4,
    },
  },
  MultiPromoTabs: {
    renderingName: 'MultiPromoTabs',
    renderingId: 'ead21da1-10f6-45c6-a0d5-55aaf09fb743',
    storyTitle: 'Solterra/Components/Multi Promo Tabs',
    usage: 'Tabbed promo: each tab shows two image tiles with links. Becomes a dropdown on small screens.',
    datasourceTemplate: { id: 'd12c656f-b4a4-46a9-a851-67666fef7838', name: 'MultiPromoTabs' },
    fields: [text('title', true), text('droplistLabel', false, 'Label of the mobile dropdown')],
    children: {
      template: { id: 'ccea3863-e5cc-4c75-8296-5b5ca47010fa', name: 'PromoTabItem' },
      itemName: 'Tab',
      fields: [
        text('title', true, 'Tab label'),
        image('image 1', true, 'First tile image (field name contains a space)'),
        link('link1', true, 'First tile link (text is the tile caption)'),
        image('image2', true),
        link('link2'),
      ],
      min: 2,
      max: 5,
    },
  },
  PromoAnimated: {
    renderingName: 'PromoAnimated',
    renderingId: '241a1b8e-e69a-4e07-b5e4-53975371ad3c',
    storyTitle: 'Solterra/Components/Promo Animated',
    usage: 'Single promo with an animated image and up to two CTAs.',
    datasourceTemplate: { id: 'bd372d9d-6e4f-4ae9-a54c-dbc2acdebe2a', name: 'AnimatedPromo' },
    fields: [
      text('title', true),
      text('description'),
      image('image', true),
      link('primaryLink'),
      link('secondaryLink'),
    ],
    variants: {
      Default: '262e7d03-511d-4c7f-8199-d8bcdef48a81',
      ImageRight: '2e9756b5-9a83-4546-aac8-fe797db5e1b6',
    },
  },
  CtaBanner: {
    renderingName: 'CTA Banner',
    renderingId: '3332f59b-f5f3-44df-b66e-2811c31aeb3c',
    storyTitle: 'Solterra/Components/CTA Banner',
    usage: 'Centered statement with one button. Use near the end of a page.',
    datasourceTemplate: { id: 'bee4869d-b588-42c2-9797-76510c397e6a', name: 'CTA Banner' },
    fields: [text('titleRequired', true), text('descriptionOptional'), link('linkOptional')],
  },
  Accordion: {
    renderingName: 'Accordion',
    renderingId: '913e30c7-63c2-4a2b-9d44-b2adaeed6bc2',
    storyTitle: 'Solterra/Components/Accordion',
    usage: 'FAQ block: heading plus expandable question/answer items.',
    datasourceTemplate: { id: '4dddcbac-a737-4c55-8ec8-508f1550d44a', name: 'AccordionBlock' },
    fields: [text('heading', true), text('description'), link('link')],
    children: {
      template: { id: '75bc6ab0-2492-4129-9f90-ca0bab019e07', name: 'AccordionSlide' },
      itemName: 'Slide',
      fields: [text('heading', true, 'Question'), rich('description', true, 'Answer (HTML)')],
      min: 1,
    },
  },
  TestimonialCarousel: {
    renderingName: 'TestimonialCarousel',
    renderingId: 'fc274b80-2ef2-4b05-89d4-22fcb1e9cc9c',
    storyTitle: 'Solterra/Components/Testimonial Carousel',
    usage: 'Rotating customer quotes.',
    datasourceTemplate: { id: 'cd4eeb25-5a6c-4a23-baff-bae9d921ffd1', name: 'TestimonialCarousel' },
    fields: [text('Title', false, 'Internal label, not rendered')],
    children: {
      template: { id: 'a2dbd4d1-e6db-49ef-a759-fd4f765227aa', name: 'TestimonialItem' },
      itemName: 'Testimonial',
      fields: [text('testimonialQuote', true), text('testimonialAttribution')],
      min: 2,
    },
  },
  SubscriptionBanner: {
    renderingName: 'Subscription Banner',
    renderingId: 'ac86d4f7-a0ac-4995-bd89-bb976a5556da',
    storyTitle: 'Solterra/Components/Subscription Banner',
    usage: 'Newsletter sign-up: title, description and an email form (labels come from the site dictionary).',
    datasourceTemplate: { id: 'd2c0babb-51e4-4e13-9305-6a1107962413', name: 'Subscription Banner' },
    fields: [text('titleRequired', true), text('descriptionOptional')],
  },
  Quote: {
    renderingName: 'Quote',
    renderingId: 'e488257c-c8a2-45f5-9dc8-b0f63969105c',
    storyTitle: 'Solterra/Components/Quote',
    usage: 'Pull quote with an accent rule.',
    datasourceTemplate: { id: '0beea775-efea-488b-b691-e582ccc1377a', name: 'Quote' },
    fields: [multiline('subCopy', true, 'Quote text, include the quotation marks')],
  },
  RichText: {
    renderingName: 'RichText',
    renderingId: '9c6d53e3-fe57-4638-af7b-6d68304c7a94',
    storyTitle: 'Solterra/Components/Rich Text',
    usage: 'Free-form body copy (HTML).',
    datasourceTemplate: { id: '0a7aa373-5ed1-4e9b-9678-22d3c5faf6df', name: 'Text' },
    fields: [rich('Text', true)],
  },
} as const satisfies Record<string, SitecoreComponentSpec>;

export type ComponentKey = keyof typeof SITECORE_COMPONENTS;

export const COMPONENT_KEYS = Object.keys(SITECORE_COMPONENTS) as ComponentKey[];

export const getComponentSpec = (key: ComponentKey): SitecoreComponentSpec => SITECORE_COMPONENTS[key];
