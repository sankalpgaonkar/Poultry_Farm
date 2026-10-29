import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist', 'node_modules', 'coverage']),
  // Frontend (React, browser, ES modules)
  {
    files: ['frontend/**/*.{js,jsx}'],
    extends: [
      js.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      ecmaVersion: 'latest',
      globals: globals.browser,
      parserOptions: { ecmaFeatures: { jsx: true }, sourceType: 'module' },
    },
    rules: {
      'no-unused-vars': ['error', { varsIgnorePattern: '^[A-Z_]', caughtErrors: 'none' }],
      // "load data when the page opens" effects are intentional here.
      'react-hooks/set-state-in-effect': 'off',
      // Context files export a provider plus its hook; fine for fast refresh in practice.
      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
    },
  },
  // Backend + Vercel function (Node, CommonJS)
  {
    files: ['backend/**/*.js', 'api/**/*.js'],
    extends: [js.configs.recommended],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'commonjs',
      globals: globals.node,
    },
    rules: {
      'no-unused-vars': ['error', { argsIgnorePattern: '^(_|next$)', caughtErrors: 'none' }],
    },
  },
  // Root config files (ES modules, Node)
  {
    files: ['*.{js,mjs}', 'e2e/**/*.mjs'],
    extends: [js.configs.recommended],
    languageOptions: { ecmaVersion: 'latest', sourceType: 'module', globals: { ...globals.node, ...globals.browser } },
  },
])
