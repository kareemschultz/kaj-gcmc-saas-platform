import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['**/*.{test,spec}.{js,ts,jsx,tsx}'],
    exclude: ['node_modules', '.next', 'dist'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'lcov'],
      exclude: [
        'node_modules',
        '.next',
        'dist',
        '**/*.config.{js,ts}',
        '**/*.d.ts',
        '**/types/**',
      ],
    },
    setupFiles: ['./vitest.setup.ts'],
  },
  resolve: {
    alias: [
      { find: '@/config', replacement: path.resolve(__dirname, './config') },
      { find: '@/lib', replacement: path.resolve(__dirname, './lib') },
      { find: '@/types', replacement: path.resolve(__dirname, './types') },
      { find: '@/components', replacement: path.resolve(__dirname, './components') },
      { find: '@/app', replacement: path.resolve(__dirname, './app') },
      { find: '@', replacement: path.resolve(__dirname, './') },
    ],
  },
});
