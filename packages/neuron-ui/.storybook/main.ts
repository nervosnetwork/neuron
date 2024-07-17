export default {
  stories: ['../src/**/*.stories.mdx', '../src/**/*.stories.@(js|jsx|ts|tsx)'],
  addons: [
    '@storybook/addon-links',
    '@storybook/addon-essentials',
    '@storybook/addon-interactions',
    '@storybook/preset-create-react-app',
    'storybook-addon-react-router-v6',
  ],
  framework: {
    name: '@storybook/react-webpack5',
    options: {},
  },
  webpackFinal: config => {
    config.resolve.fallback = {
      fs: false,
      crypto: false,
      buffer: false,
    }
    config.resolve.alias = {
      ...config.resolve.alias,
      electron: require.resolve('./electron'),
    }
    return config
  },
  docs: {
    autodocs: true,
  },
}
