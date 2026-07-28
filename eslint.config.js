import globals from 'globals';

/**
 * Flat ESLint config.
 *
 * Philosophy: rules that catch *bugs* are errors; rules that are stylistic are
 * warnings, so `npm run lint` stays actionable on a codebase that predates
 * linting. Formatting is deliberately not enforced here — see .editorconfig.
 */
export default [
  {
    ignores: [
      'node_modules/**',
      'playwright-report/**',
      'test-results/**',
      '.venv/**',
      'src/i18n.js' // generated-style translation bundle; 400 KB of data literals
    ]
  },

  // Browser application code (ES modules).
  {
    files: ['src/**/*.js'],
    languageOptions: {
      ecmaVersion: 2023,
      sourceType: 'module',
      globals: {
        ...globals.browser,
        THREE: 'readonly'
      }
    },
    rules: {
      // --- correctness ---
      'no-undef': 'error',
      'no-unused-vars': ['error', { args: 'none', varsIgnorePattern: '^_' }],
      'no-dupe-keys': 'error',
      'no-dupe-class-members': 'error',
      'no-unreachable': 'error',
      'no-fallthrough': 'error',
      'no-self-assign': 'error',
      'no-constant-condition': ['error', { checkLoops: false }],
      'no-async-promise-executor': 'error',
      'require-atomic-updates': 'error',
      'valid-typeof': 'error',
      'use-isnan': 'error',
      eqeqeq: ['error', 'smart'],

      // --- security / footguns ---
      'no-eval': 'error',
      'no-implied-eval': 'error',
      'no-new-func': 'error',
      'no-script-url': 'error',
      // innerHTML with interpolated values is the main XSS vector in this app.
      'no-restricted-properties': [
        'error',
        {
          property: 'innerHTML',
          message: 'Use textContent / replaceChildren, or route HTML through UIManager._buildSafeHelpNodes().'
        },
        {
          property: 'outerHTML',
          message: 'Use DOM construction instead of HTML string assignment.'
        }
      ],

      // --- hygiene ---
      'no-var': 'error',
      'prefer-const': 'warn',
      'no-console': ['warn', { allow: ['warn', 'error'] }],
      'no-empty': ['warn', { allowEmptyCatch: true }]
    }
  },

  // Service worker runs in a different global scope.
  {
    files: ['sw.js'],
    languageOptions: {
      ecmaVersion: 2023,
      sourceType: 'script',
      globals: globals.serviceworker
    },
    rules: {
      'no-undef': 'error',
      'no-unused-vars': 'error',
      'no-console': ['warn', { allow: ['warn', 'error'] }]
    }
  },

  // Node tooling and tests.
  {
    files: ['scripts/**/*.mjs', 'tests/**/*.js', 'playwright.config.js', 'eslint.config.js'],
    languageOptions: {
      ecmaVersion: 2023,
      sourceType: 'module',
      // Playwright specs run in Node but contain page.evaluate() callbacks that
      // are serialised into the browser, so both realms are legitimately in scope.
      globals: { ...globals.node, ...globals.browser }
    },
    rules: {
      'no-undef': 'error',
      'no-unused-vars': 'error'
    }
  }
];
