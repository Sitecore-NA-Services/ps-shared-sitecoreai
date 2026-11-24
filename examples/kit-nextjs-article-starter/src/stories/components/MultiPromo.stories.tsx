import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { SitecoreComponent } from '../landing-pages/SitecoreComponent';

/**
 * Multi Promo: Sitecore rendering `MultiPromo` (registry key `MultiPromo`). Heading plus a
 * row of image promo cards; becomes a carousel on small screens.
 *
 * Datasource template `MultiPromo` (775d6354-cf01-4f34-9713-d34645079c88). Fields:
 * `title` (Single-Line Text, required), `description` (Single-Line Text). Children (2-4):
 * `SimplePromo` (f94c8c17-70e8-4d8b-9d35-d0465c0e0945) with `heading` (required),
 * `image` (required), `description` and `link`.
 */
const meta = {
  title: 'Solterra/Components/Multi Promo',
  component: SitecoreComponent,
} satisfies Meta<typeof SitecoreComponent>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    entry: {
      component: 'MultiPromo',
      name: 'Multi Promo',
      fields: {
        title: 'Flagship programs',
        description: 'Pick a starting point and expand when the community is ready.',
      },
      children: [
        {
          name: 'Promo 1',
          fields: {
            heading: 'Community solar',
            image: { media: 'solarPanels' },
            link: { text: 'Learn more', page: 'solutions' },
          },
        },
        {
          name: 'Promo 2',
          fields: {
            heading: 'Battery storage',
            image: { media: 'hero1' },
            link: { text: 'Learn more', page: 'platform' },
          },
        },
        {
          name: 'Promo 3',
          fields: {
            heading: 'Building efficiency',
            image: { media: 'woman3' },
            link: { text: 'Learn more', page: 'howItWorks' },
          },
        },
        {
          name: 'Promo 4',
          fields: {
            heading: 'Workforce training',
            image: { media: 'womanInGlasses' },
            link: { text: 'Learn more', page: 'company' },
          },
        },
      ],
    },
  },
};
