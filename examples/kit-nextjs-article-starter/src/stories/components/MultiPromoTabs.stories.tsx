import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { SitecoreComponent } from '../landing-pages/SitecoreComponent';

/**
 * Multi Promo Tabs: Sitecore rendering `MultiPromoTabs` (registry key `MultiPromoTabs`).
 * Tabbed promo where each tab shows two image tiles with links; becomes a dropdown on small
 * screens.
 *
 * Datasource template `MultiPromoTabs` (d12c656f-b4a4-46a9-a851-67666fef7838). Fields:
 * `title` (required), `droplistLabel` (mobile dropdown label). Children (2-5):
 * `PromoTabItem` (ccea3863-e5cc-4c75-8296-5b5ca47010fa) with `title` (tab label),
 * `image 1` (Image; the field name contains a space), `link1`, `image2` and `link2`.
 * The link text is the tile caption.
 */
const meta = {
  title: 'Solterra/Components/Multi Promo Tabs',
  component: SitecoreComponent,
} satisfies Meta<typeof SitecoreComponent>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    entry: {
      component: 'MultiPromoTabs',
      name: 'Multi Promo Tabs',
      fields: {
        title: 'Our focus is on four sustainability priorities',
        droplistLabel: 'Select',
      },
      children: [
        {
          name: 'Climate',
          fields: {
            title: 'Climate',
            'image 1': { media: 'solarPanels' },
            link1: { text: 'Solar electric program', page: 'solutions' },
            image2: { media: 'windmills' },
            link2: { text: 'Wind energy collection', page: 'solutions' },
          },
        },
        {
          name: 'Nature',
          fields: {
            title: 'Nature',
            'image 1': { media: 'tropicalBird' },
            link1: { text: 'Habitat-friendly arrays', page: 'howItWorks' },
            image2: { media: 'italy' },
            link2: { text: 'Land stewardship', page: 'company' },
          },
        },
        {
          name: 'Livelihoods',
          fields: {
            title: 'Livelihoods',
            'image 1': { media: 'woman3' },
            link1: { text: 'Workforce programs', page: 'company' },
            image2: { media: 'womanInGlasses' },
            link2: { text: 'Local hiring', page: 'about' },
          },
        },
      ],
    },
  },
};
