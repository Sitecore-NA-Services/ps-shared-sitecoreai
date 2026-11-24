import { fileURLToPath } from 'node:url';
import type { StorybookConfig } from '@storybook/nextjs-vite';
import remarkGfm from 'remark-gfm';
import { mergeConfig } from 'vite';

const componentMapStub = fileURLToPath(new URL('./mocks/component-map.ts', import.meta.url));

const config: StorybookConfig = {
  framework: {
    name: '@storybook/nextjs-vite',
    options: {},
  },
  // Stories live in src/stories (outside src/components) so the Sitecore CLI
  // component map and import map never pick them up.
  stories: ['../src/stories/**/*.mdx', '../src/stories/**/*.stories.@(ts|tsx)'],
  addons: [
    {
      name: '@storybook/addon-docs',
      // GitHub-flavored markdown (tables) in the MDX docs pages.
      options: { mdxPluginOptions: { mdxCompileOptions: { remarkPlugins: [remarkGfm] } } },
    },
    '@storybook/addon-mcp',
  ],
  staticDirs: ['./public'],
  features: {
    // Feeds the docs toolset of the MCP server (docs-list / docs-show).
    componentsManifest: true,
  },
  typescript: {
    reactDocgen: 'react-docgen-typescript',
  },
  core: {
    disableTelemetry: true,
  },
  viteFinal: (viteConfig) =>
    mergeConfig(viteConfig, {
      resolve: {
        alias: [
          { find: /^\.sitecore\/component-map(\.client)?$/, replacement: componentMapStub },
        ],
      },
    }),
};

export default config;
