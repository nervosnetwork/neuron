import { Meta, StoryObj } from '@storybook/react'
import Dialog from 'widgets/Dialog'

const meta: Meta<typeof Dialog> = {
  component: Dialog,
}

export default meta

type Story = StoryObj<typeof Dialog>

export const Default: Story = {
  args: {
    show: true,
    title: 'title',
    subTitle: 'subTitle',
    onConfirm: console.info,
    onCancel: () => {},
    children: '是否开始下载',
  },
}

export const Confirm: Story = {
  args: {
    show: true,
    title: 'dialog title',
    subTitle: 'dialog subTitle',
    showHeader: false,
    showCancel: false,
    onConfirm: console.info,
    onCancel: () => {},
    children: '当前已是最新版本',
  },
}
