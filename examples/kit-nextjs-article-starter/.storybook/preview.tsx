import type { Preview } from '@storybook/nextjs-vite';
import { SitecoreStoryProvider } from '../src/stories/_support/SitecoreStoryProvider';
import '../src/app/globals.css';
import './preview.css';

const preview: Preview = {
  globalTypes: {
    pageMode: {
      description: 'Render as the live site or as Sitecore Pages (editing) would',
      toolbar: {
        title: 'Page mode',
        icon: 'edit',
        items: [
          { value: 'normal', title: 'Live site' },
          { value: 'editing', title: 'Pages editing' },
        ],
        dynamicTitle: true,
      },
    },
  },
  initialGlobals: {
    pageMode: 'normal',
  },
  parameters: {
    layout: 'fullscreen',
    controls: { expanded: true },
    nextjs: { appDirectory: true },
    options: {
      storySort: {
        order: ['Solterra', ['Introduction', 'Publishing to Sitecore', 'Landing Pages', 'Components']],
      },
    },
  },
  decorators: [
    (Story, context) => (
      <SitecoreStoryProvider isEditing={context.globals.pageMode === 'editing'}>
        <Story />
      </SitecoreStoryProvider>
    ),
  ],
  tags: ['autodocs'],
};

export default preview;
