import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { SitecoreComponent } from '../landing-pages/SitecoreComponent';

/**
 * Promo Animated: Sitecore rendering `PromoAnimated` (registry key `PromoAnimated`). Single
 * promo with an animated image and up to two CTAs. Headless variants: `Default` (image
 * left) and `ImageRight`.
 *
 * Datasource template `AnimatedPromo` (bd372d9d-6e4f-4ae9-a54c-dbc2acdebe2a). Fields:
 * `title` (required), `description`, `image` (Image, required), `primaryLink`,
 * `secondaryLink` (General Link).
 *
 * Publishing note: the variant is the rendering's `FieldNames` parameter (variant item ID
 * in the registry). Tools that cannot set rendering parameters leave it on Default; switch
 * the variant in Pages.
 */
const meta = {
  title: 'Solterra/Components/Promo Animated',
  component: SitecoreComponent,
} satisfies Meta<typeof SitecoreComponent>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    entry: {
      component: 'PromoAnimated',
      name: 'Animated Promo',
      fields: {
        title: 'Start your career at Solterra & Co.',
        description:
          'Join the teams that design, build and operate community energy programs across the country.',
        image: { media: 'woman3Square' },
        primaryLink: { text: 'Explore careers', page: 'company' },
        secondaryLink: { text: 'Meet the company', page: 'about' },
      },
    },
  },
};

export const ImageRight: Story = {
  args: {
    entry: {
      component: 'PromoAnimated',
      name: 'Animated Promo',
      variant: 'ImageRight',
      fields: {
        title: 'From rooftop to grid scale',
        description:
          'Pair generation, storage and efficiency so a neighborhood program can grow into a city-wide portfolio.',
        image: { media: 'femaleAuthor' },
        secondaryLink: { text: 'View pricing', page: 'pricing' },
      },
    },
  },
};
