import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { LandingPage } from './LandingPage';
import { cleanEnergyWeek, communitySolar } from './pages';

/**
 * Full Solterra landing pages assembled from the production components. Each story's
 * `manifest` arg is a publishable page definition: call the MCP tool
 * `landing-page-get` with the story's manifest id to get the Sitecore publish plan.
 */
const meta = {
  title: 'Solterra/Landing Pages',
  component: LandingPage,
  parameters: {
    layout: 'fullscreen',
    docs: { story: { inline: false, iframeHeight: 900 } },
  },
} satisfies Meta<typeof LandingPage>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Manifest id: `community-solar`. Created under /Solutions as /Solutions/Community-Solar. */
export const CommunitySolar: Story = {
  args: { manifest: communitySolar },
};

/** Manifest id: `clean-energy-week`. Created under Home as /Clean-Energy-Week. */
export const CleanEnergyWeek: Story = {
  args: { manifest: cleanEnergyWeek },
};
