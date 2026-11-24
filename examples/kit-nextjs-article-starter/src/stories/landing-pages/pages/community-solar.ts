import type { LandingPageManifest } from '../manifest';

export const communitySolar: LandingPageManifest = {
  id: 'community-solar',
  title: 'Community Solar',
  description:
    'Program landing page for community solar subscriptions: page header, partner tabs, how-it-works panels, programs, proof points, FAQ and a closing CTA.',
  site: 'solterra',
  page: {
    name: 'Community-Solar',
    parent: 'solutions',
    fields: {
      pageTitle: 'Community Solar',
      pageHeaderTitle: 'Clean power your whole neighborhood can share',
      pageSubtitle:
        '<p>Subscribe to a local solar array, get credits on your utility bill, and keep the savings in the community that hosts the panels. No rooftop required.</p>',
      pageShortTitle: 'Community Solar',
      pageSummary:
        'How Solterra community solar programs work for households, cities and site hosts, and how to enroll.',
      ogTitle: 'Community Solar | Solterra & Co.',
      ogDescription: 'Local solar, shared savings. See how Solterra community solar programs work.',
    },
  },
  sections: [
    {
      container: 'full-width',
      components: [
        {
          component: 'PageHeader',
          name: 'Page Header',
          fields: {
            imageRequired: { media: 'solarPanels', alt: 'Community solar array at sunrise' },
            logoText: 'Trusted by cities, campuses and housing partners',
          },
          children: [
            { name: 'Logo List Image 1', fields: { image: { media: 'logo' } } },
            { name: 'Logo List Image 2', fields: { image: { media: 'logo' } } },
          ],
        },
      ],
    },
    {
      container: 'full-bleed',
      components: [
        {
          component: 'LogoTabs',
          name: 'Who Benefits',
          fields: {
            titleRequired: 'Who community solar is built for',
            imageOptional: { media: 'windmills', alt: 'Wind and solar farm' },
          },
          children: [
            {
              name: 'Households',
              fields: {
                titleRequired: 'Households',
                imageRequired: { media: 'logo' },
                descriptionOptional:
                  'Renters and homeowners save on every bill without installing anything on their roof.',
                linkOptional: { text: 'See pricing', page: 'pricing' },
              },
            },
            {
              name: 'Cities',
              fields: {
                titleRequired: 'Cities',
                imageRequired: { media: 'logo' },
                descriptionOptional:
                  'Turn climate action plans into subscribed, operating programs with no capital appropriation.',
                linkOptional: { text: 'Explore solutions', page: 'solutions' },
              },
            },
            {
              name: 'Site Hosts',
              fields: {
                titleRequired: 'Site hosts',
                imageRequired: { media: 'logo' },
                descriptionOptional:
                  'Campuses, congregations and nonprofits earn lease revenue from land and rooftops they already have.',
                linkOptional: { text: 'How it works', page: 'howItWorks' },
              },
            },
          ],
        },
      ],
    },
    {
      container: 'full-bleed/full-width',
      components: [
        {
          component: 'VerticalImageAccordion',
          name: 'How It Works',
          fields: { titleOptional: 'How a subscription works' },
          children: [
            {
              name: 'Vertical Accordion Item 1',
              fields: {
                titleRequired: 'Subscribe',
                imageRequired: { media: 'womanInGlasses' },
                descriptionOptional:
                  'Pick a share of a local array sized to your typical usage. Enrollment takes about five minutes.',
                linkOptional: { text: 'Check eligibility', page: 'howItWorks' },
              },
            },
            {
              name: 'Vertical Accordion Item 2',
              fields: {
                titleRequired: 'Generate',
                imageRequired: { media: 'solarPanels' },
                descriptionOptional:
                  'The array feeds the grid. Your share of the production is credited to your utility account every month.',
              },
            },
            {
              name: 'Vertical Accordion Item 3',
              fields: {
                titleRequired: 'Save',
                imageRequired: { media: 'tropicalBird' },
                descriptionOptional:
                  'Credits are worth more than the subscription fee, so you keep a guaranteed discount on power.',
                linkOptional: { text: 'See the numbers', page: 'pricing' },
              },
            },
          ],
        },
      ],
    },
    {
      container: 'full-width',
      components: [
        {
          component: 'MultiPromo',
          name: 'Programs',
          fields: {
            title: 'Programs near you',
            description: 'Each program is sized to the community that hosts it.',
          },
          children: [
            {
              name: 'Promo 1',
              fields: {
                heading: 'Neighborhood arrays',
                image: { media: 'windmills' },
                description: 'Shared arrays on parking canopies and vacant lots, open to every household.',
                link: { text: 'Learn more', page: 'solutions' },
              },
            },
            {
              name: 'Promo 2',
              fields: {
                heading: 'Campus programs',
                image: { media: 'woman3' },
                description: 'Universities and school districts anchor the array and open seats to staff.',
                link: { text: 'Learn more', page: 'solutions' },
              },
            },
            {
              name: 'Promo 3',
              fields: {
                heading: 'Income-qualified seats',
                image: { media: 'womanInSand' },
                description: 'Reserved subscriptions with deeper discounts for qualifying households.',
                link: { text: 'Learn more', page: 'pricing' },
              },
            },
          ],
        },
        {
          component: 'PromoAnimated',
          name: 'Host A Site',
          variant: 'ImageRight',
          fields: {
            title: 'Have a roof or a lot? Host an array',
            description:
              'Site hosts earn a 20-year lease payment while their neighbors save on power. We handle design, permitting and operations.',
            image: { media: 'femaleAuthor', alt: 'Site host partner' },
            primaryLink: { text: 'Talk to our team', page: 'company' },
            secondaryLink: { text: 'See the platform', page: 'platform' },
          },
        },
      ],
    },
    {
      container: 'full-bleed/full-width',
      components: [
        {
          component: 'TestimonialCarousel',
          name: 'Subscriber Stories',
          fields: { Title: 'Subscriber stories' },
          children: [
            {
              name: 'Testimonial 1',
              fields: {
                testimonialQuote:
                  'We signed up in March and saw the first credit on our April bill. No panels, no contractors, just savings.',
                testimonialAttribution: 'MARIA L., SUBSCRIBER',
              },
            },
            {
              name: 'Testimonial 2',
              fields: {
                testimonialQuote:
                  'Hosting the array on our school roof funds a solar curriculum and lowers bills for 300 families.',
                testimonialAttribution: 'RIVERSIDE UNIFIED',
              },
            },
          ],
        },
      ],
    },
    {
      container: 'full-bleed/full-width',
      components: [
        {
          component: 'Accordion',
          name: 'Community Solar FAQ',
          fields: { heading: 'Community solar questions' },
          children: [
            {
              name: 'Slide 1',
              fields: {
                heading: 'Do I need to own my home?',
                description:
                  '<p>No. Renters and owners can subscribe, as long as you have an account with a participating utility.</p>',
              },
            },
            {
              name: 'Slide 2',
              fields: {
                heading: 'What happens if I move?',
                description:
                  '<p>Move within the utility territory and your subscription follows you. Move away and you can cancel with 90 days notice.</p>',
              },
            },
            {
              name: 'Slide 3',
              fields: {
                heading: 'How much will I save?',
                description:
                  '<p>Most programs guarantee 10 to 15 percent off the credited energy, published before enrollment opens.</p>',
              },
            },
          ],
        },
      ],
    },
    {
      container: 'full-width',
      components: [
        {
          component: 'CtaBanner',
          name: 'Enroll CTA',
          fields: {
            titleRequired: 'Shared sun, shared savings.',
            descriptionOptional: 'Enrollment for the next array opens soon. Reserve your seat today.',
            linkOptional: { text: 'Reserve a seat', page: 'pricing' },
          },
        },
        {
          component: 'SubscriptionBanner',
          name: 'Program Updates',
          fields: {
            titleRequired: 'Get program updates',
            descriptionOptional: 'New arrays, enrollment windows and savings reports, about once a month.',
          },
        },
      ],
    },
  ],
};
