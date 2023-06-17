import React from 'react'
import { ComponentStory } from '@storybook/react'
import GeneralSetting from 'components/GeneralSetting'
import { initStates } from 'states'

export default {
  title: 'GeneralSettings',
  component: GeneralSetting,
}

const Template: ComponentStory<typeof GeneralSetting> = (props: any) => <GeneralSetting {...props} />

export const Normal = Template.bind({})
Normal.args = {
  updater: initStates.updater,
}

export const Checking = Template.bind({})
Checking.args = {
  updater: {
    ...initStates.updater,
    checking: true,
  },
}

export const HasUpdater = Template.bind({})
HasUpdater.args = {
  updater: {
    ...initStates.updater,
    version: '0.104.0',
    releaseNotes: 'release 0.104.0',
  },
}

export const DownloadUpdate = Template.bind({})
DownloadUpdate.args = {
  updater: {
    checking: false,
    downloadProgress: 0.1,
    version: '0.104.0',
    releaseNotes: 'release 0.104.0',
  },
}
