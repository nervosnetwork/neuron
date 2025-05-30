import { StorybookConfig } from '@storybook/react-vite'
const { mergeConfig } = require('vite')
import path from 'path'

const config: StorybookConfig = {
  stories: ['../src/**/*.stories.@(js|jsx|ts|tsx)'],
  addons: [
    '@storybook/addon-links',
    '@storybook/addon-essentials',
    '@storybook/addon-interactions',
    'storybook-addon-react-router-v6',
  ],
  framework: '@storybook/react-vite',
  core: {
    builder: '@storybook/builder-vite',
  },
  async viteFinal(config) {
    return mergeConfig(config, {
      resolve: {
        alias: { electron: path.resolve(__dirname, '../.storybook/electron') },
      },
    })
  },
  docs: {
    autodocs: true,
  },
  staticDirs: ['../public'],
}

export default config
