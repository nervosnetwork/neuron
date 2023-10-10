import { Meta, StoryObj } from '@storybook/react'
import GeneralSetting from 'components/GeneralSetting'
import { withRouter } from 'storybook-addon-react-router-v6'
import { initStates } from 'states'

const meta: Meta<typeof GeneralSetting> = {
  component: GeneralSetting,
  decorators: [withRouter()],
}

export default meta

type Story = StoryObj<typeof GeneralSetting>

export const Default: Story = {
  args: {
    updater: initStates.updater,
  },
}

export const Checking: Story = {
  args: {
    updater: {
      ...initStates.updater,
      checking: true,
    },
  },
}

export const HasUpdater: Story = {
  args: {
    updater: {
      ...initStates.updater,
      releaseDate: '2023-05-31T13:15:58.827Z',
      version: '0.110.1',
      releaseNotes: 'release 0.110.1',
    },
  },
}

export const DownloadUpdate: Story = {
  args: {
    updater: {
      ...initStates.updater,
      checking: false,
      isUpdated: false,
      downloadProgress: 0.1,
      progressInfo: null,
      version: '0.110.1',
      releaseDate: '2023-05-31T13:15:58.827Z',
      releaseNotes: 'release 0.110.1',
      errorMsg: '',
    },
  },
}
