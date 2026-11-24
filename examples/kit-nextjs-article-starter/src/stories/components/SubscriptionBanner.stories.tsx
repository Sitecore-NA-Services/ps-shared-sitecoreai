import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { SitecoreComponent } from '../landing-pages/SitecoreComponent';

/**
 * Subscription Banner: Sitecore rendering `Subscription Banner` (registry key
 * `SubscriptionBanner`). Newsletter sign-up with an email form. Button label, placeholder
 * and messages come from the site dictionary, not the datasource.
 *
 * Datasource template `Subscription Banner` (d2c0babb-51e4-4e13-9305-6a1107962413).
 * Fields: `titleRequired` (required), `descriptionOptional`.
 */
const meta = {
  title: 'Solterra/Components/Subscription Banner',
  component: SitecoreComponent,
} satisfies Meta<typeof SitecoreComponent>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    entry: {
      component: 'SubscriptionBanner',
      name: 'Subscription Banner',
      fields: {
        titleRequired: 'Get platform release notes',
        descriptionOptional: 'Product updates for program operators and utility partners.',
      },
    },
  },
};
