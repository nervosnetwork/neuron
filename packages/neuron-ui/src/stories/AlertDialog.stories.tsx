import { Meta, StoryObj } from '@storybook/react'
import AlertDialog from 'widgets/AlertDialog'

const meta: Meta<typeof AlertDialog> = {
  component: AlertDialog,
  args: {
    title: 'This is the title of alert dialog',
    message: 'Here is the alert dialog message',
    type: 'success',
    show: false,
  },
}

export default meta

type Story = StoryObj<typeof AlertDialog>

export const Default: Story = {}
