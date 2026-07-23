import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    // Product quality gates must not execute archived authoring or local recovery tests.
    include: ['src/**/*.{test,spec}.?(c|m)[jt]s?(x)'],
  },
});
