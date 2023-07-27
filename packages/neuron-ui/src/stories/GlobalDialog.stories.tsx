import { Meta, StoryObj } from '@storybook/react'
import { action } from '@storybook/addon-actions'
import GlobalDialog from 'widgets/GlobalDialog'

const meta: Meta<typeof GlobalDialog> = {
  component: GlobalDialog,
  args: {
    onDismiss: action('Dismiss'),
    onBackUp: action('onBackUp'),
    onOk: action('onOk'),
  },
}

export default meta

type Story = StoryObj<typeof GlobalDialog>

export const Default: Story = {
  args: {
    type: null,
  },
}

export const UnlockSuccess: Story = {
  args: {
    type: 'unlock-success',
  },
}

export const RebuildSync: Story = {
  args: {
    type: 'rebuild-sync',
  },
}
