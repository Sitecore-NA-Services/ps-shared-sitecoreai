import type React from 'react';
import { useSitecore, type ComponentRendering, type Page } from '@sitecore-content-sdk/nextjs';
import { Default as Hero } from '@/components/hero/Hero';
import { Default as PageHeader } from '@/components/page-header/PageHeader';
import { Default as LogoTabs } from '@/components/logo-tabs/LogoTabs';
import { Default as VerticalImageAccordion } from '@/components/vertical-image-accordion/VerticalImageAccordion';
import { Default as MultiPromo } from '@/components/multi-promo/MultiPromo';
import { Default as MultiPromoTabs } from '@/components/multi-promo-tabs/MultiPromoTabs';
import {
  Default as PromoAnimated,
  ImageRight as PromoAnimatedImageRight,
} from '@/components/promo-animated/PromoAnimated';
import { Default as CtaBanner } from '@/components/cta-banner/CtaBanner';
import { Default as Accordion } from '@/components/accordion-block/AccordionBlock';
import { Default as TestimonialCarousel } from '@/components/testimonial-carousel/TestimonialCarousel';
import { Default as SubscriptionBanner } from '@/components/subscription-banner/SubscriptionBanner';
import { Default as Quote } from '@/components/quote/Quote';
import { Default as RichText } from '@/components/sxa/RichText';
import type { ComponentEntry, LandingPageFields } from './manifest';
import { FIELD_ADAPTERS } from './adapters';
import { SITECORE_COMPONENTS, type ComponentKey } from './registry';

/** Props every Sitecore component receives from the placeholder. */
type LayoutProps = {
  fields: unknown;
  params: Record<string, string>;
  rendering: ComponentRendering;
  page: Page;
};

// Each component declares its own fields type; the adapters produce that shape.
type AnyLayoutComponent = React.ComponentType<LayoutProps>;
const asLayoutComponent = (component: unknown) => component as AnyLayoutComponent;

const VARIANTS: Record<ComponentKey, Record<string, AnyLayoutComponent>> = {
  Hero: { Default: asLayoutComponent(Hero) },
  PageHeader: { Default: asLayoutComponent(PageHeader) },
  LogoTabs: { Default: asLayoutComponent(LogoTabs) },
  VerticalImageAccordion: { Default: asLayoutComponent(VerticalImageAccordion) },
  MultiPromo: { Default: asLayoutComponent(MultiPromo) },
  MultiPromoTabs: { Default: asLayoutComponent(MultiPromoTabs) },
  PromoAnimated: {
    Default: asLayoutComponent(PromoAnimated),
    ImageRight: asLayoutComponent(PromoAnimatedImageRight),
  },
  CtaBanner: { Default: asLayoutComponent(CtaBanner) },
  Accordion: { Default: asLayoutComponent(Accordion) },
  TestimonialCarousel: { Default: asLayoutComponent(TestimonialCarousel) },
  SubscriptionBanner: { Default: asLayoutComponent(SubscriptionBanner) },
  Quote: { Default: asLayoutComponent(Quote) },
  RichText: { Default: asLayoutComponent(RichText) },
};

export type SitecoreComponentProps = {
  entry: ComponentEntry;
  /** Page-level fields, read by Page Header. */
  pageFields?: LandingPageFields;
  /** Extra rendering parameters (e.g. `colorScheme`) for component-level stories. */
  params?: Record<string, string>;
};

/**
 * Renders one manifest entry with the production React component, exactly as the
 * Sitecore placeholder would after the layout service resolved its datasource.
 */
export function SitecoreComponent({ entry, pageFields, params = {} }: SitecoreComponentProps) {
  const { page } = useSitecore();
  const spec = SITECORE_COMPONENTS[entry.component];
  const variant = entry.variant ?? 'Default';
  const Component = VARIANTS[entry.component][variant] ?? VARIANTS[entry.component].Default;
  const variantIds: Record<string, string> = 'variants' in spec ? spec.variants : {};

  const rendering: ComponentRendering = {
    componentName: spec.renderingName,
    uid: `storybook-${entry.component}-${entry.name}`,
    dataSource: `local:/Data/${entry.name}`,
  };

  return (
    <Component
      fields={FIELD_ADAPTERS[entry.component](entry, { pageFields })}
      params={{ styles: '', FieldNames: variantIds[variant] ?? '', ...params }}
      rendering={rendering}
      page={page}
    />
  );
}

export const getVariantNames = (key: ComponentKey) => Object.keys(VARIANTS[key]);
