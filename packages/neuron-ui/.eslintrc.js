module.exports = {
  extends: ['airbnb', 'prettier'],
  parser: '@typescript-eslint/parser',
  plugins: ['@typescript-eslint'],
  settings: {
    // https://github.com/SimulatedGREG/electron-vue/issues/423#issuecomment-464807973
    'import/core-modules': ['electron'],
    'import/resolver': {
      node: {
        paths: ['src'],
        extensions: ['.js', '.ts', '.jsx', '.tsx'],
      },
    },
    react: {
      version: 'detect',
    },
  },
  rules: {
    // This is the configuration that was set when using eslint-plugin-prettier
    // https://github.com/prettier/eslint-plugin-prettier#arrow-body-style-and-prefer-arrow-callback-issue
    'arrow-body-style': 'off',
    'prefer-arrow-callback': 'off',

    // https://github.com/jsx-eslint/eslint-plugin-react/issues/498
    'react/prop-types': 'off',

    // TypeScript support
    // Avoid duplicating @typescript-eslint/no-unused-vars
    'no-unused-vars': 'off',
    '@typescript-eslint/no-unused-vars': [
      'error',
      {
        argsIgnorePattern: '^_',
      },
    ],
    // Avoid duplicating @typescript-eslint/no-shadow
    'no-shadow': 'off',
    '@typescript-eslint/no-shadow': 'error',

    // Unnecessary rules
    'no-plusplus': 'off',
    'max-classes-per-file': 'off',
    'react/require-default-props': 'off',
    'react/jsx-props-no-spreading': 'off',

    // Adjusted rules
    'no-console': [
      'error',
      {
        allow: ['info', 'warn', 'error', 'group', 'groupEnd'],
      },
    ],
    'lines-between-class-members': ['error', 'always', { exceptAfterSingleLine: true }],
    'react/no-unstable-nested-components': ['error', { allowAsProps: true }],
    'import/no-extraneous-dependencies': [
      'error',
      {
        devDependencies: ['**/*.stories.*', 'src/setupTests.ts'],
      },
    ],
    'react/jsx-filename-extension': [
      'warn',
      {
        extensions: ['.jsx', '.tsx'],
      },
    ],
    'import/extensions': [
      'error',
      'ignorePackages',
      {
        ts: 'never',
        tsx: 'never',
      },
    ],
    'react/function-component-definition': [
      'error',
      {
        namedComponents: 'arrow-function',
        unnamedComponents: 'arrow-function',
      },
    ],
    '@typescript-eslint/ban-types': [
      'error',
      {
        extendDefaults: true,
        types: {
          '{}': false,
          Function: false,
        },
      },
    ],
    'react/jsx-no-useless-fragment': [
      'error',
      {
        allowExpressions: true,
      },
    ],
  },
  overrides: [
    {
      files: ['*.ts', '*.tsx'],
      rules: {
        'no-undef': 'off',
      },
    },
    {
      files: ['*.ts', '*.tsx'],
      rules: {
        'react/jsx-no-constructed-context-values': 0,
      },
    },
  ],
  env: {
    jest: true,
    node: true,
    browser: true,
  },
  globals: {
    BigInt: 'readonly',
  },
}
