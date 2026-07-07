import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./vitest.setup.ts'],
    include: ['src/**/*.test.{ts,tsx}'],
    pool: 'forks',
    coverage: {
      provider: 'v8',
      include: ['src/lib/**', 'src/utils/**', 'src/hooks/**'],
      exclude: ['src/**/*.d.ts', 'src/**/*.module.css', 'src/**/*.test.*'],
    },
  },
});
