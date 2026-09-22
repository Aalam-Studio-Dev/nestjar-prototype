import js from '@eslint/js';
import jsxA11y from 'eslint-plugin-jsx-a11y';
import reactHooks from 'eslint-plugin-react-hooks';
import globals from 'globals';
import tseslint from 'typescript-eslint';

const adapterRule = {
  group: ['@/services/mock/*', '@/services/supabase/*'],
  message:
    'Import services through useServices() or @/services. Only src/services/index.ts picks an adapter.',
};

/*
 * Design-system boundaries. ui/ knows nothing about nestjar; components/ knows
 * the domain and the brand but never fetches data or knows about screens.
 */
const uiRule = {
  group: [
    '@/domain/*',
    '@/components/*',
    '@/data/*',
    '@/features/*',
    '@/services',
    '@/services/*',
    '@/app/*',
  ],
  message: 'ui/ holds generic primitives. Move nestjar-specific pieces into components/.',
};
const componentsRule = {
  group: ['@/data/*', '@/features/*', '@/services', '@/services/*', '@/app/*'],
  message: 'components/ is presentational. Take data as props; let a feature call the hook.',
};

export default tseslint.config(
  { ignores: ['dist', 'coverage', 'playwright-report', 'test-results'] },
  {
    files: ['**/*.{ts,tsx}'],
    extends: [js.configs.recommended, ...tseslint.configs.strict, jsxA11y.flatConfigs.strict],
    languageOptions: {
      ecmaVersion: 2023,
      globals: globals.browser,
    },
    plugins: {
      'react-hooks': reactHooks,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      '@typescript-eslint/consistent-type-imports': 'error',
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      'no-restricted-imports': ['error', { patterns: [adapterRule] }],
    },
  },
  {
    files: ['src/ui/**'],
    ignores: ['**/*.test.{ts,tsx}'],
    rules: {
      'no-restricted-imports': ['error', { patterns: [adapterRule, uiRule] }],
    },
  },
  {
    files: ['src/components/**'],
    ignores: ['**/*.test.{ts,tsx}'],
    rules: {
      'no-restricted-imports': ['error', { patterns: [adapterRule, componentsRule] }],
    },
  },
  {
    files: ['src/services/**'],
    rules: { 'no-restricted-imports': 'off' },
  },
  {
    files: ['**/*.test.{ts,tsx}', 'e2e/**'],
    rules: { '@typescript-eslint/no-non-null-assertion': 'off' },
  },
  {
    files: ['e2e/**', '*.config.ts'],
    languageOptions: { globals: globals.node },
  },
);
