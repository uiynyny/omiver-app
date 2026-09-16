import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  // `ios` / `android` contain the Capacitor native projects, including
  // vendored third-party JS and Xcode's DerivedData. Linting them reports
  // errors we neither own nor can fix.
  globalIgnores(['dist', 'dist-ssr', 'coverage', 'ios', 'android']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs['recommended-latest'],
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    rules: {
      // A leading underscore marks a binding that exists only to be
      // discarded — e.g. stripping `token` out of a login response via
      // destructuring so it never reaches application state.
      '@typescript-eslint/no-unused-vars': ['error', {
        argsIgnorePattern: '^_',
        varsIgnorePattern: '^_',
        caughtErrors: 'all',
        caughtErrorsIgnorePattern: '^_',
        destructuredArrayIgnorePattern: '^_',
        ignoreRestSiblings: true,
      }],

      // The API layer is still largely untyped. This is real debt and should
      // be paid down, but as an `error` it buries genuine problems under ~40
      // pre-existing hits, so lint output becomes noise nobody reads.
      // Downgraded to a warning: visible, tracked, non-blocking.
      '@typescript-eslint/no-explicit-any': 'warn',
    },
  },
])
