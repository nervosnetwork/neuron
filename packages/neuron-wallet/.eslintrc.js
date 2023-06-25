module.exports = {
  extends: ['eslint:recommended', 'plugin:@typescript-eslint/recommended', 'plugin:prettier/recommended'],
  settings: {
    'import/resolver': {
      node: {
        paths: ['src'],
        extensions: ['.js', '.ts'],
      },
    },
  },
  env: {
    es6: true,
    node: true,
    browser: true,
    jest: true,
  },
  globals: {
    BigInt: 'readonly',
  },
  rules: {
    // TODO: Some temporarily disabled rules will be re-enabled later, considering that many files are affected and will be addressed in the future.
    '@typescript-eslint/no-explicit-any': 'off',
    '@typescript-eslint/no-non-null-assertion': 'off',
    'prefer-const': 'off',

    // This is the configuration that was set when using eslint-plugin-prettier
    // https://github.com/prettier/eslint-plugin-prettier#arrow-body-style-and-prefer-arrow-callback-issue
    'arrow-body-style': 'off',
    'prefer-arrow-callback': 'off',

    // TypeScript support
    '@typescript-eslint/no-unused-vars': [
      'error',
      {
        argsIgnorePattern: '^_',
      },
    ],

    // Unnecessary rules
    'no-plusplus': 'off',
    'max-classes-per-file': 'off',
    '@typescript-eslint/no-inferrable-types': 'off',
    '@typescript-eslint/no-empty-function': 'off',
    '@typescript-eslint/ban-ts-comment': 'warn',

    // Adjusted rules
    'no-console': [
      2,
      {
        allow: ['info', 'warn', 'error', 'group', 'groupEnd'],
      },
    ],
    'lines-between-class-members': ['error', 'always', { exceptAfterSingleLine: true }],
  },
  overrides: [
    {
      files: ['*.test.ts', '*.test.tsx'],
      rules: {
        '@typescript-eslint/ban-ts-comment': 'off',
        '@typescript-eslint/no-var-requires': 'off',
      },
    },
  ],
}
