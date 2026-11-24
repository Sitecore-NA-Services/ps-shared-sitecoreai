import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { SitecoreComponent } from '../landing-pages/SitecoreComponent';

/**
 * Hero: Sitecore rendering `Hero` (registry key `Hero`). Opening section of a campaign or
 * home-style page with a large headline, intro, primary CTA and a strip of four images
 * (each can be swapped for an ambient MP4 video).
 *
 * Datasource template `Hero` (a19c3230-c5ee-47a1-ae3f-12a1fc3c4273). Fields:
 * `titleRequired` (Single-Line Text, required), `descriptionOptional` (Single-Line Text),
 * `linkOptional` (General Link), `heroImageOptional1..4` (Image),
 * `heroVideoOptional1..4` (General Link to an MP4).
 *
 * Publishing note: the rendering's default datasource template is a different, unused
 * template, so the datasource must be created explicitly from the template above and
 * attached with set_component_datasource. The MCP `landing-page-get` plan does this.
 */
const meta = {
  title: 'Solterra/Components/Hero',
  component: SitecoreComponent,
} satisfies Meta<typeof SitecoreComponent>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    entry: {
      component: 'Hero',
      name: 'Hero',
      fields: {
        titleRequired: 'Energy that stays in the neighborhood',
        descriptionOptional:
          'Solterra designs, finances and operates community solar, storage and efficiency programs so the savings stay local.',
        linkOptional: { text: 'Explore solutions', page: 'solutions' },
        heroImageOptional1: { media: 'womanInGlasses' },
        heroImageOptional2: { media: 'solarPanels' },
        heroImageOptional3: { media: 'tropicalBird' },
        heroImageOptional4: { media: 'womanInSand' },
      },
    },
  },
};

/** `colorScheme` is a rendering parameter (set in Pages); values: primary, secondary, tertiary, dark, light. */
export const PrimaryColorScheme: Story = {
  args: {
    ...Default.args,
    params: { colorScheme: 'primary' },
  },
};

/** How the component looks in Sitecore Pages with empty fields. */
export const EmptyInPagesEditing: Story = {
  args: { entry: { component: 'Hero', name: 'Hero', fields: {} } },
  globals: { pageMode: 'editing' },
};
