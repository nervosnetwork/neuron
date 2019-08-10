import path from 'path'
import initStoryshots from '@storybook/addon-storyshots'

describe.skip(`Snapshot testing`, () => {
  initStoryshots({
    configPath: path.resolve(__dirname, '../../../.storybook'),
  })
})
