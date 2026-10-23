import type { Preview } from '@storybook/react-vite';
import { useEffect } from 'react';

import './preview.css';

const preview: Preview = {
  globalTypes: {
    theme: {
      description: 'Color scheme',
      toolbar: {
        title: 'Theme',
        icon: 'mirror',
        items: ['light', 'dark'],
        dynamicTitle: true,
      },
    },
  },
  initialGlobals: { theme: 'light' },
  decorators: [
    (Story, context) => {
      const theme = context.globals.theme as string;
      useEffect(() => {
        // Toggle on <html>, not a wrapper div — dropdown menus portal to
        // <body>, so a wrapper-scoped .dark would leave them light.
        document.documentElement.classList.toggle('dark', theme === 'dark');
      }, [theme]);
      return <Story />;
    },
  ],
  parameters: {
    layout: 'padded',
    // Fail the story test (pnpm test:storybook) on any axe violation instead of
    // only listing it in the Accessibility panel.
    a11y: { test: 'error' },
    options: {
      // Features first, in the order a visitor would explore them; the first
      // entry is also the story Storybook opens on.
      storySort: {
        order: [
          'Features',
          [
            'Sorting',
            'Grouped Columns',
            'Row Selection',
            'Drag Selection',
            'Column Management',
            'Pagination',
            'URL Persistence',
            'localStorage Persistence',
          ],
          'Components',
          ['DataTable', 'PaginationClient', 'SortableHeaderClient'],
        ],
      },
    },
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
  },
};

export default preview;
