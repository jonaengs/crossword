import { defineConfig } from '@tanstack/start/config';
import tsConfigPaths from 'vite-tsconfig-paths';

export default defineConfig({
  vite: {
    plugins: [
      // @ts-expect-error apparently a pnpm bug: https://github.com/vitejs/vite/issues/13027
      tsConfigPaths({
        projects: ['./tsconfig.json'],
      }),
    ],
  },
});
