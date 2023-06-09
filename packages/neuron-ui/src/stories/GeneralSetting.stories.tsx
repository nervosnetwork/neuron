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
    version: '0.110.1',
    releaseNotes: 'release 0.110.1',
  },
}

export const DownloadUpdate = Template.bind({})
DownloadUpdate.args = {
  updater: {
    checking: false,
    isUpdated: false,
    downloadProgress: 0.1,
    progressInfo: {},
    version: '0.110.1',
    releaseDate: '2023-05-31T13:15:58.827Z',
    releaseNotes: 'release 0.110.1',
    errorMsg: '',
  },
}
