import type { ComponentKey } from './registry';
import type { ChildItem, ComponentEntry, FieldValues, LandingPageFields } from './manifest';
import { jsonValue, toImageField, toLinkField, toTextField } from './field-values';

/**
 * Converts a manifest entry (Sitecore field names) into the `fields` prop the React
 * component receives from the layout service. GraphQL-backed components mirror the
 * aliases of their rendering's ComponentQuery.
 */
export type AdapterContext = { pageFields?: LandingPageFields };

type Adapter = (entry: ComponentEntry, context: AdapterContext) => unknown;

const children = (entry: ComponentEntry): ChildItem[] => entry.children ?? [];
const f = (values: FieldValues, name: string) => values[name];

export const FIELD_ADAPTERS: Record<ComponentKey, Adapter> = {
  Hero: ({ fields }) => ({
    titleRequired: toTextField(f(fields, 'titleRequired')),
    descriptionOptional: toTextField(f(fields, 'descriptionOptional')),
    linkOptional: toLinkField(f(fields, 'linkOptional')),
    heroImageOptional1: toImageField(f(fields, 'heroImageOptional1')),
    heroVideoOptional1: toLinkField(f(fields, 'heroVideoOptional1')),
    heroImageOptional2: toImageField(f(fields, 'heroImageOptional2')),
    heroVideoOptional2: toLinkField(f(fields, 'heroVideoOptional2')),
    heroImageOptional3: toImageField(f(fields, 'heroImageOptional3')),
    heroVideoOptional3: toLinkField(f(fields, 'heroVideoOptional3')),
    heroImageOptional4: toImageField(f(fields, 'heroImageOptional4')),
    heroVideoOptional4: toLinkField(f(fields, 'heroVideoOptional4')),
  }),

  PageHeader: (entry, { pageFields }) => ({
    data: {
      datasource: {
        imageRequired: jsonValue(toImageField(f(entry.fields, 'imageRequired'))),
        logoText: jsonValue(toTextField(f(entry.fields, 'logoText'))),
        children: {
          results: children(entry).map((child) => ({
            image: jsonValue(toImageField(f(child.fields, 'image'))),
          })),
        },
      },
      externalFields: {
        pageTitle: jsonValue(toTextField(pageFields?.pageTitle)),
        pageHeaderTitle: jsonValue(toTextField(pageFields?.pageHeaderTitle ?? pageFields?.pageTitle)),
        pageSubtitle: jsonValue(toTextField(pageFields?.pageSubtitle)),
      },
    },
  }),

  LogoTabs: (entry) => ({
    data: {
      datasource: {
        title: jsonValue(toTextField(f(entry.fields, 'titleRequired'))),
        backgroundImage: jsonValue(toImageField(f(entry.fields, 'imageOptional'))),
        logos: {
          results: children(entry).map((child) => ({
            logo: jsonValue(toImageField(f(child.fields, 'imageRequired'))),
            title: jsonValue(toTextField(f(child.fields, 'titleRequired'))),
          })),
        },
        logoTabContent: {
          results: children(entry).map((child) => ({
            heading: jsonValue(toTextField(f(child.fields, 'descriptionOptional'))),
            cta: jsonValue(toLinkField(f(child.fields, 'linkOptional'))),
          })),
        },
      },
    },
  }),

  VerticalImageAccordion: (entry) => ({
    data: {
      datasource: {
        title: jsonValue(toTextField(f(entry.fields, 'titleOptional'))),
        items: {
          results: children(entry)
            .slice(0, 3)
            .map((child) => ({
              title: jsonValue(toTextField(f(child.fields, 'titleRequired'))),
              image: jsonValue(toImageField(f(child.fields, 'imageRequired'))),
              description: jsonValue(toTextField(f(child.fields, 'descriptionOptional'))),
              link: jsonValue(toLinkField(f(child.fields, 'linkOptional'))),
            })),
        },
      },
    },
  }),

  MultiPromo: (entry) => ({
    data: {
      datasource: {
        title: jsonValue(toTextField(f(entry.fields, 'title'))),
        description: jsonValue(toTextField(f(entry.fields, 'description'))),
        children: {
          results: children(entry).map((child) => ({
            heading: jsonValue(toTextField(f(child.fields, 'heading'))),
            image: jsonValue(toImageField(f(child.fields, 'image'))),
            link: jsonValue(toLinkField(f(child.fields, 'link'))),
            description: jsonValue(toTextField(f(child.fields, 'description'))),
          })),
        },
      },
    },
  }),

  MultiPromoTabs: (entry) => ({
    data: {
      datasource: {
        title: jsonValue(toTextField(f(entry.fields, 'title'))),
        droplistLabel: jsonValue(toTextField(f(entry.fields, 'droplistLabel'))),
        children: {
          results: children(entry).map((child) => ({
            title: jsonValue(toTextField(f(child.fields, 'title'))),
            image1: jsonValue(toImageField(f(child.fields, 'image 1'))),
            link1: jsonValue(toLinkField(f(child.fields, 'link1'))),
            image2: jsonValue(toImageField(f(child.fields, 'image2'))),
            link2: jsonValue(toLinkField(f(child.fields, 'link2'))),
          })),
        },
      },
    },
  }),

  PromoAnimated: ({ fields }) => ({
    title: toTextField(f(fields, 'title')),
    description: toTextField(f(fields, 'description')),
    image: toImageField(f(fields, 'image')),
    primaryLink: toLinkField(f(fields, 'primaryLink')),
    secondaryLink: toLinkField(f(fields, 'secondaryLink')),
  }),

  CtaBanner: ({ fields }) => ({
    titleRequired: toTextField(f(fields, 'titleRequired')),
    descriptionOptional: toTextField(f(fields, 'descriptionOptional')),
    linkOptional: toLinkField(f(fields, 'linkOptional')),
  }),

  Accordion: (entry) => ({
    data: {
      datasource: {
        heading: jsonValue(toTextField(f(entry.fields, 'heading'))),
        description: jsonValue(toTextField(f(entry.fields, 'description'))),
        link: jsonValue(toLinkField(f(entry.fields, 'link'))),
        children: {
          results: children(entry).map((child) => ({
            heading: jsonValue(toTextField(f(child.fields, 'heading'))),
            description: jsonValue(toTextField(f(child.fields, 'description'))),
          })),
        },
      },
    },
  }),

  TestimonialCarousel: (entry) => ({
    data: {
      datasource: {
        children: {
          results: children(entry).map((child) => ({
            testimonialQuote: jsonValue(toTextField(f(child.fields, 'testimonialQuote'))),
            testimonialAttribution: jsonValue(toTextField(f(child.fields, 'testimonialAttribution'))),
          })),
        },
      },
    },
  }),

  SubscriptionBanner: ({ fields }) => ({
    titleRequired: toTextField(f(fields, 'titleRequired')),
    descriptionOptional: toTextField(f(fields, 'descriptionOptional')),
  }),

  Quote: ({ fields }) => ({
    subCopy: toTextField(f(fields, 'subCopy')),
  }),

  RichText: ({ fields }) => ({
    Text: toTextField(f(fields, 'Text')),
  }),
};
