import { Meta, StoryObj } from '@storybook/react'
import DatetimePickerDialog from 'widgets/DatetimePickerDialog'

const meta: Meta<typeof DatetimePickerDialog> = {
  component: DatetimePickerDialog,
}

export default meta

type Story = StoryObj<typeof DatetimePickerDialog>

export const Default: Story = {
  args: {
    show: false,
    notice: 'According to the actual running block height, there may have some time variances in locktime.',
    onConfirm: console.info,
    onCancel: () => {},
  },
}
