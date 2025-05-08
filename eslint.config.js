import { defineConfig } from 'eslint/config';
import love from 'eslint-config-love';

export default defineConfig([
  {
    ...love,
    files: ['**/*.ts'],
  },
]);
