import { fileURLToPath } from 'node:url';

import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

// The unit tests on their own. `pnpm test` runs this config, so it never
// starts the Storybook project, which indexes every story: a story that fails
// to index then fails only the story tests, not the unit job. vitest.config.ts
// lists this file as its unit project, so both runs share these settings.
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  test: {
    name: 'unit',
    globals: true,
    environment: 'happy-dom',
    setupFiles: ['./src/__tests__/setup.ts'],
    include: ['src/__tests__/**/*.test.{ts,tsx}'],
  },
});
