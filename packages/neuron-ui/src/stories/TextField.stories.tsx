import { Meta, StoryObj } from '@storybook/react'
import TextField from 'widgets/TextField'

const meta: Meta<typeof TextField> = {
  component: TextField,
  argTypes: {
    onChange: {
      table: {
        disable: true,
      },
    },
  },
}

export default meta

type Story = StoryObj<typeof TextField>

export const Default: Story = {
  args: {
    label: 'label',
    required: false,
    stack: false,
    field: 'field',
    value: 'value',
    error: 'error',
    type: 'text',
    suffix: 'suffix',
    onChange: () => {},
  },
}
