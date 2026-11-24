import type { LandingPageManifest } from '../manifest';

export const cleanEnergyWeek: LandingPageManifest = {
  id: 'clean-energy-week',
  title: 'Clean Energy Week Campaign',
  description:
    'Campaign landing page led by the Hero: four-image hero, priority tabs, editorial copy with a pull quote, partner proof, and a closing CTA with newsletter sign-up.',
  site: 'solterra',
  page: {
    name: 'Clean-Energy-Week',
    parent: 'home',
    fields: {
      pageTitle: 'Clean Energy Week',
      pageShortTitle: 'Clean Energy Week',
      pageSummary:
        'A week of open houses, array tours and enrollment events across Solterra communities.',
      ogTitle: 'Clean Energy Week | Solterra & Co.',
      ogDescription: 'Tour a local array, meet the operators and reserve a subscription.',
    },
  },
  sections: [
    {
      container: 'full-bleed',
      components: [
        {
          component: 'Hero',
          name: 'Clean Energy Week Hero',
          fields: {
            titleRequired: 'Clean Energy Week',
            descriptionOptional:
              'Seven days of array tours, open houses and enrollment events in the communities we power. Come see where your energy comes from.',
            linkOptional: { text: 'Find an event', page: 'resources' },
            heroImageOptional1: { media: 'womanInGlasses' },
            heroImageOptional2: { media: 'solarPanels' },
            heroImageOptional3: { media: 'woman1' },
            heroImageOptional4: { media: 'womanInSand' },
          },
        },
      ],
    },
    {
      container: 'full-bleed/full-width',
      components: [
        {
          component: 'MultiPromoTabs',
          name: 'Event Tracks',
          fields: { title: 'Pick your track for the week', droplistLabel: 'Choose a track' },
          children: [
            {
              name: 'Households',
              fields: {
                title: 'Households',
                'image 1': { media: 'woman3' },
                link1: { text: 'Neighborhood open houses', page: 'solutions' },
                image2: { media: 'solarPanels' },
                link2: { text: 'Array tours', page: 'howItWorks' },
              },
            },
            {
              name: 'Cities',
              fields: {
                title: 'Cities',
                'image 1': { media: 'italy' },
                link1: { text: 'Program design workshop', page: 'solutions' },
                image2: { media: 'windmills' },
                link2: { text: 'Financing roundtable', page: 'pricing' },
              },
            },
            {
              name: 'Students',
              fields: {
                title: 'Students',
                'image 1': { media: 'womanInGlasses' },
                link1: { text: 'Campus career day', page: 'company' },
                image2: { media: 'hero1' },
                link2: { text: 'Solar classroom', page: 'about' },
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
          component: 'RichText',
          name: 'Campaign Intro',
          fields: {
            Text: '<h2>Why we open the gates</h2><p>Most people never see the arrays that power their homes. During Clean Energy Week our field teams host tours, answer questions and walk subscribers through the monitoring dashboards they use every day.</p><p>Every event is free and open to the public. Families are welcome.</p>',
          },
        },
        {
          component: 'Quote',
          name: 'Operations Quote',
          fields: {
            subCopy:
              '\u201cWhen people stand next to the panels, the bill credit stops being abstract. That is when neighbors start signing up.\u201d',
          },
        },
      ],
    },
    {
      container: 'full-bleed/full-width',
      components: [
        {
          component: 'TestimonialCarousel',
          name: 'Partner Voices',
          fields: { Title: 'Partner voices' },
          children: [
            {
              name: 'Testimonial 1',
              fields: {
                testimonialQuote: 'Last year\u2019s open house enrolled 140 households in a single afternoon.',
                testimonialAttribution: 'CITY OF RIVERTON',
              },
            },
            {
              name: 'Testimonial 2',
              fields: {
                testimonialQuote: 'Our students built a lesson plan around the tour. It is now part of the science curriculum.',
                testimonialAttribution: 'LAKESIDE HIGH SCHOOL',
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
          name: 'Reserve CTA',
          fields: {
            titleRequired: 'See it. Then subscribe.',
            descriptionOptional: 'Reserve a spot on a tour near you.',
            linkOptional: { text: 'Reserve a tour', page: 'resources' },
          },
        },
        {
          component: 'SubscriptionBanner',
          name: 'Event Reminders',
          fields: {
            titleRequired: 'Get event reminders',
            descriptionOptional: 'One email when registration opens and one the day before your event.',
          },
        },
      ],
    },
  ],
};
