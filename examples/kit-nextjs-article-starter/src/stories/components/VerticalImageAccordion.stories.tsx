import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { SitecoreComponent } from '../landing-pages/SitecoreComponent';

/**
 * Vertical Image Accordion: Sitecore rendering `Vertical Image Accordion` (registry key
 * `VerticalImageAccordion`). Three image panels that expand on hover or focus. Solterra
 * pages place it in a `full-bleed/full-width` section.
 *
 * Datasource template `Vertical Image Accordion` (22c53a61-7af2-4cc6-86a5-06e0fdb85ee5).
 * Fields: `titleOptional` (Single-Line Text). Children (exactly 3 are rendered):
 * `Vertical Accordion Item` (e64d342f-e5aa-4233-88c4-58ccd451a7d3) with `titleRequired`,
 * `imageRequired`, `descriptionOptional` and `linkOptional`.
 */
const meta = {
  title: 'Solterra/Components/Vertical Image Accordion',
  component: SitecoreComponent,
} satisfies Meta<typeof SitecoreComponent>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    entry: {
      component: 'VerticalImageAccordion',
      name: 'Vertical Image Accordion',
      fields: { titleOptional: 'Solution areas' },
      children: [
        {
          name: 'Vertical Accordion Item 1',
          fields: {
            titleRequired: 'Solar',
            imageRequired: { media: 'solarPanels' },
            descriptionOptional: 'Community and campus arrays sized to local load, interconnection and equity targets.',
            linkOptional: { text: 'Explore', page: 'solutions' },
          },
        },
        {
          name: 'Vertical Accordion Item 2',
          fields: {
            titleRequired: 'Storage',
            imageRequired: { media: 'hero1' },
            descriptionOptional: 'Batteries that shift solar, shave peaks and keep critical facilities online.',
          },
        },
        {
          name: 'Vertical Accordion Item 3',
          fields: {
            titleRequired: 'Workforce',
            imageRequired: { media: 'woman3' },
            descriptionOptional: 'Training pathways so installation and operations jobs stay in the community.',
            linkOptional: { text: 'Explore', page: 'company' },
          },
        },
      ],
    },
  },
};
