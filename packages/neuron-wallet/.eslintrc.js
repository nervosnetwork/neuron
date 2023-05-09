module.exports = {
  extends: ['eslint:recommended', 'prettier'],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    sourceType: 'module',
  },
  plugins: ['@typescript-eslint'],
  rules: {
    // This is the configuration that was set when using eslint-plugin-prettier
    // https://github.com/prettier/eslint-plugin-prettier#arrow-body-style-and-prefer-arrow-callback-issue
    'arrow-body-style': 'off',
    'prefer-arrow-callback': 'off',

    // TypeScript support
    // Avoid duplicating @typescript-eslint/no-unused-vars
    'no-unused-vars': 'off',
    '@typescript-eslint/no-unused-vars': [
      'error',
      {
        argsIgnorePattern: '^_',
      },
    ],

    // Unnecessary rules
    'no-plusplus': 'off',

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
      files: ['*.ts', '*.tsx'],
      rules: {
        'no-undef': 'off',
      },
    },
  ],
  globals: {
    BigInt: 'readonly',
  },
  env: {
    es6: true,
    node: true,
    browser: true,
    jest: true,
  },
  settings: {
    'import/resolver': {
      node: {
        paths: ['src'],
        extensions: ['.js', '.ts'],
      },
    },
  },
}
