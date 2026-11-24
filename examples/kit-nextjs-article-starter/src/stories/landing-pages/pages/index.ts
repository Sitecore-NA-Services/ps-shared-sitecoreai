import type { LandingPageManifest } from '../manifest';
import { cleanEnergyWeek } from './clean-energy-week';
import { communitySolar } from './community-solar';

/**
 * Every landing page manifest exposed by Storybook and the MCP server.
 * Add a new page by creating a manifest file in this folder, adding it here and adding a
 * story to LandingPages.stories.tsx.
 */
export const LANDING_PAGES: LandingPageManifest[] = [communitySolar, cleanEnergyWeek];

export { cleanEnergyWeek, communitySolar };
