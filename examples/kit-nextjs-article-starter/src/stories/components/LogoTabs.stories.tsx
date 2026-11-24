import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { SitecoreComponent } from '../landing-pages/SitecoreComponent';

/**
 * Logo Tabs: Sitecore rendering `Logo Tab` (registry key `LogoTabs`). Audience or partner
 * tabs over a full-bleed background image; place it in a `full-bleed` section.
 *
 * Datasource template `Logo Tab` (07ec4360-f49a-48dd-ab46-5a5fa89cde7b). Fields:
 * `titleRequired` (Single-Line Text, required), `imageOptional` (Image, background).
 * Children (1-6): `Log Tab Item` (2b90bf80-bb08-44a2-ad76-600ad0ed915b) with
 * `titleRequired` (tab label), `imageRequired` (logo), `descriptionOptional` (statement
 * shown for the active tab) and `linkOptional` (CTA for the active tab).
 */
const meta = {
  title: 'Solterra/Components/Logo Tabs',
  component: SitecoreComponent,
} satisfies Meta<typeof SitecoreComponent>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    entry: {
      component: 'LogoTabs',
      name: 'Logo Tab',
      fields: {
        titleRequired: 'Partners we design with',
        imageOptional: { media: 'windmills' },
      },
      children: [
        {
          name: 'Log Tab Item 1',
          fields: {
            titleRequired: 'Cities',
            imageRequired: { media: 'logo' },
            descriptionOptional: 'Climate action plans turned into financed, subscribed, operating programs.',
            linkOptional: { text: 'Explore solutions', page: 'solutions' },
          },
        },
        {
          name: 'Log Tab Item 2',
          fields: {
            titleRequired: 'Housing authorities',
            imageRequired: { media: 'logo' },
            descriptionOptional: 'Bill credits and resilience for residents without shifting capital onto tenants.',
            linkOptional: { text: 'See pricing', page: 'pricing' },
          },
        },
        {
          name: 'Log Tab Item 3',
          fields: {
            titleRequired: 'Campuses',
            imageRequired: { media: 'logo' },
            descriptionOptional: 'Anchor an array on campus land and open subscriptions to staff and neighbors.',
          },
        },
      ],
    },
  },
};
