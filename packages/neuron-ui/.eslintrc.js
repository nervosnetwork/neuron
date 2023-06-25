module.exports = {
  extends: ['airbnb', 'plugin:@typescript-eslint/recommended', 'plugin:prettier/recommended'],
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
  env: {
    jest: true,
    node: true,
    browser: true,
  },
  globals: {
    BigInt: 'readonly',
  },
  rules: {
    // TODO: Some temporarily disabled rules will be re-enabled later, considering that many files are affected and will be addressed in the future.
    '@typescript-eslint/no-explicit-any': 'off',
    '@typescript-eslint/no-non-null-assertion': 'off',

    // This is the configuration that was set when using eslint-plugin-prettier
    // https://github.com/prettier/eslint-plugin-prettier#arrow-body-style-and-prefer-arrow-callback-issue
    'arrow-body-style': 'off',
    'prefer-arrow-callback': 'off',

    // https://github.com/jsx-eslint/eslint-plugin-react/issues/498
    'react/prop-types': 'off',

    // TypeScript support
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
    '@typescript-eslint/no-inferrable-types': 'off',
    '@typescript-eslint/no-empty-function': 'off',
    '@typescript-eslint/ban-ts-comment': 'warn',
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
    'import/no-extraneous-dependencies': [
      'error',
      {
        devDependencies: ['**/*.stories.*', 'src/setupTests.ts'],
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
    'react/no-unstable-nested-components': ['error', { allowAsProps: true }],
    'react/jsx-filename-extension': [
      'warn',
      {
        extensions: ['.jsx', '.tsx'],
      },
    ],
    'react/function-component-definition': [
      'error',
      {
        namedComponents: 'arrow-function',
        unnamedComponents: 'arrow-function',
      },
    ],
    'react/jsx-no-useless-fragment': [
      'error',
      {
        allowExpressions: true,
      },
    ],
  },
}
