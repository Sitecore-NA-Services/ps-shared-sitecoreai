import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { SitecoreComponent } from '../landing-pages/SitecoreComponent';

/**
 * Testimonial Carousel: Sitecore rendering `TestimonialCarousel` (registry key
 * `TestimonialCarousel`). Rotating customer quotes.
 *
 * Datasource template `TestimonialCarousel` (cd4eeb25-5a6c-4a23-baff-bae9d921ffd1). Fields:
 * `Title` (internal label, not rendered). Children (2 or more): `TestimonialItem`
 * (a2dbd4d1-e6db-49ef-a759-fd4f765227aa) with `testimonialQuote` (required) and
 * `testimonialAttribution` (shown in capitals).
 */
const meta = {
  title: 'Solterra/Components/Testimonial Carousel',
  component: SitecoreComponent,
} satisfies Meta<typeof SitecoreComponent>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    entry: {
      component: 'TestimonialCarousel',
      name: 'Testimonial',
      fields: { Title: 'Testimonial' },
      children: [
        {
          name: 'Testimonial 1',
          fields: {
            testimonialQuote: 'We cut costs and our carbon footprint. Sustainability has never been easier.',
            testimonialAttribution: 'LUMEA RENEWABLES',
          },
        },
        {
          name: 'Testimonial 2',
          fields: {
            testimonialQuote: 'A seamless clean energy transition with expert support at every step.',
            testimonialAttribution: 'EVERGEN POWER',
          },
        },
        {
          name: 'Testimonial 3',
          fields: {
            testimonialQuote: 'Our residents saw the first bill credit within a month of launch.',
            testimonialAttribution: 'MAISON LUME HOUSING',
          },
        },
      ],
    },
  },
};
