import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { SitecoreComponent } from '../landing-pages/SitecoreComponent';

/**
 * Page Header: Sitecore rendering `Page Header` (registry key `PageHeader`). Standard top
 * section of a Solterra landing page.
 *
 * The H1 and intro copy come from the PAGE item, not the datasource: `pageHeaderTitle`
 * (falls back to `pageTitle`) and `pageSubtitle` (Rich Text). In a landing page manifest
 * set them under `page.fields`; here they are passed as `pageFields`.
 *
 * Datasource template `Page Header` (754d4fd3-aa54-46d0-84bd-0bb43f8aeba0). Fields:
 * `imageRequired` (Image, required), `logoText` (Single-Line Text), `link1`, `link2`
 * (General Link, not rendered). Children: `Logo List Image` items
 * (b895f657-9a7b-438b-a2f2-95fb1722be7f) with an `image` field, shown as a logo strip.
 */
const meta = {
  title: 'Solterra/Components/Page Header',
  component: SitecoreComponent,
} satisfies Meta<typeof SitecoreComponent>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    pageFields: {
      pageTitle: 'Solutions',
      pageHeaderTitle: 'Solutions for every community',
      pageSubtitle:
        '<p>Solar, storage, efficiency and workforce programs designed for cities, campuses and neighborhoods.</p>',
    },
    entry: {
      component: 'PageHeader',
      name: 'Page Header',
      fields: {
        imageRequired: { media: 'italy' },
        logoText: 'Programs for cities, campuses and neighborhoods',
      },
      children: [
        { name: 'Logo List Image 1', fields: { image: { media: 'logo' } } },
        { name: 'Logo List Image 2', fields: { image: { media: 'logo' } } },
      ],
    },
  },
};

export const WithoutLogos: Story = {
  args: {
    pageFields: {
      pageTitle: 'Company',
      pageHeaderTitle: 'Built with communities, not just for them',
      pageSubtitle: '<p>We originate, finance and operate the programs we build, for the life of the assets.</p>',
    },
    entry: {
      component: 'PageHeader',
      name: 'Page Header',
      fields: { imageRequired: { media: 'woman3' } },
    },
  },
};
