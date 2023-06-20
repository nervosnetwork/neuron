export default {
  "stories": ["../src/**/*.stories.mdx", "../src/**/*.stories.@(js|jsx|ts|tsx)"],
  "addons": [
    "@storybook/addon-links",
    "@storybook/addon-essentials",
    "@storybook/addon-interactions",
    "@storybook/preset-create-react-app",
    "storybook-addon-react-router-v6"
  ],
  "framework": "@storybook/react",
  core: {
    builder: "webpack5"
  },
  webpackFinal: config => {
    config.resolve.alias = {
      ...config.resolve.alias,
      electron: require.resolve('./electron')
    }
    return config
  },
}
