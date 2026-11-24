import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { SitecoreComponent } from '../landing-pages/SitecoreComponent';

/**
 * CTA Banner: Sitecore rendering `CTA Banner` (registry key `CtaBanner`). Centered
 * statement with one button; use near the end of a page.
 *
 * Datasource template `CTA Banner` (bee4869d-b588-42c2-9797-76510c397e6a). Fields:
 * `titleRequired` (Single-Line Text, required), `descriptionOptional` (Single-Line Text),
 * `linkOptional` (General Link).
 */
const meta = {
  title: 'Solterra/Components/CTA Banner',
  component: SitecoreComponent,
} satisfies Meta<typeof SitecoreComponent>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    entry: {
      component: 'CtaBanner',
      name: 'CTA Banner',
      fields: {
        titleRequired: '3.4 billion people in 190 countries use our brands every day.',
        descriptionOptional: 'Be a part of the confidence revolution with Solterra & Co.',
        linkOptional: { text: 'See our brands', page: 'about' },
      },
    },
  },
};

/** `colorScheme` is a rendering parameter (set in Pages); values: primary, secondary. */
export const PrimaryColorScheme: Story = {
  args: { ...Default.args, params: { colorScheme: 'primary' } },
};
