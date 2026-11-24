import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { SitecoreComponent } from '../landing-pages/SitecoreComponent';

/**
 * Rich Text: Sitecore rendering `RichText` (registry key `RichText`). Free-form body copy.
 *
 * Datasource template `Text` (0a7aa373-5ed1-4e9b-9678-22d3c5faf6df). Fields: `Text`
 * (Rich Text, required, HTML).
 */
const meta = {
  title: 'Solterra/Components/Rich Text',
  component: SitecoreComponent,
} satisfies Meta<typeof SitecoreComponent>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    entry: {
      component: 'RichText',
      name: 'Text',
      fields: {
        Text: '<h2>Why community energy</h2><p>Solterra programs keep generation, jobs and savings close to the people who host them. Every program is designed with the community, financed without new municipal debt, and operated by our own teams for its full life.</p><ul><li>Guaranteed bill savings for subscribers</li><li>Lease revenue for site hosts</li><li>Local hiring and training</li></ul>',
      },
    },
  },
};
