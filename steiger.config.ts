import fsd from '@feature-sliced/steiger-plugin';
import { defineConfig } from 'steiger';

export default defineConfig([
  ...fsd.configs.recommended,
  {
    ignores: ['node_modules/**', '.next/**', 'public/**', '.idea/**', '.claude/**', '.github/**'],
  },
  {
    files: ['./src/pages/**'],
    rules: {
      'fsd/no-segmentless-slices': 'off', // Отключаем обязательное создание сегментов в pages
    },
  },
]);
