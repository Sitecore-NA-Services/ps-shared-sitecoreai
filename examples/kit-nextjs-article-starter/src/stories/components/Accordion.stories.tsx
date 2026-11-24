import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { SitecoreComponent } from '../landing-pages/SitecoreComponent';

/**
 * Accordion: Sitecore rendering `Accordion` (registry key `Accordion`). FAQ block with a
 * heading and expandable question/answer items. Solterra pages place it in a
 * `full-bleed/full-width` section.
 *
 * Datasource template `AccordionBlock` (4dddcbac-a737-4c55-8ec8-508f1550d44a). Fields:
 * `heading` (required), `description`, `link`. Children: `AccordionSlide`
 * (75bc6ab0-2492-4129-9f90-ca0bab019e07) with `heading` (question) and `description`
 * (answer, Rich Text HTML).
 */
const meta = {
  title: 'Solterra/Components/Accordion',
  component: SitecoreComponent,
} satisfies Meta<typeof SitecoreComponent>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    entry: {
      component: 'Accordion',
      name: 'Accordion',
      fields: { heading: 'Pricing questions' },
      children: [
        {
          name: 'Slide 1',
          fields: {
            heading: 'What does a city pay up front?',
            description:
              '<p>Most municipal programs require no capital appropriation. Development and construction are financed against contracted offtake and subscriber revenue.</p>',
          },
        },
        {
          name: 'Slide 2',
          fields: {
            heading: 'How are household savings set?',
            description:
              '<p>Subscribers receive a fixed percentage discount versus the utility supply rate, published before enrollment opens.</p>',
          },
        },
        {
          name: 'Slide 3',
          fields: {
            heading: 'Are there software or platform fees?',
            description:
              '<p>Platform operations are included in the program structure. There is no separate license to launch community solar.</p>',
          },
        },
      ],
    },
  },
};
