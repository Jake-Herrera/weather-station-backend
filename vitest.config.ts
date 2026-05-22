import { defineConfig } from 'vitest/config';
import { fileURLToPath } from 'node:url';

export default defineConfig({
  resolve: {
    alias: {
      // Tell Vitest what "@/" means, same as in tsconfig.json
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  test: {
    // Look for test files anywhere under the project
    include: ['tests/**/*.test.ts'],
  },
});