import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { SitecoreComponent } from '../landing-pages/SitecoreComponent';

/**
 * Quote: Sitecore rendering `Quote` (registry key `Quote`). Pull quote with an accent rule.
 *
 * Datasource template `Quote` (0beea775-efea-488b-b691-e582ccc1377a). Fields: `subCopy`
 * (Multi-Line Text, required; include the quotation marks).
 */
const meta = {
  title: 'Solterra/Components/Quote',
  component: SitecoreComponent,
} satisfies Meta<typeof SitecoreComponent>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    entry: {
      component: 'Quote',
      name: 'Quote',
      fields: {
        subCopy:
          '\u201cSustainable energy is more than innovation. It is how communities build a resilient future.\u201d',
      },
    },
  },
};
