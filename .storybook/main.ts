import type { StorybookConfig } from '@storybook/react-vite';
import tailwindcss from '@tailwindcss/vite';

const config: StorybookConfig = {
  framework: {
    name: '@storybook/react-vite',
    options: {},
  },
  stories: ['../src/**/*.stories.@(ts|tsx)'],
  addons: ['@storybook/addon-docs', '@storybook/addon-a11y', '@storybook/addon-vitest'],
  viteFinal: viteConfig => {
    viteConfig.plugins = viteConfig.plugins ?? [];
    // Tailwind v4 — compiles the utility classes used in the component markup
    // (see .storybook/preview.css for the entrypoint with @source + tokens).
    viteConfig.plugins.push(tailwindcss());
    return viteConfig;
  },
};

export default config;
