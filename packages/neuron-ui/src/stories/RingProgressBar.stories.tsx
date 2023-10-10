import { Meta, StoryObj } from '@storybook/react'
import RingProgressBar from 'widgets/RingProgressBar'

const meta: Meta<typeof RingProgressBar> = {
  component: RingProgressBar,
}

export default meta

type Story = StoryObj<typeof RingProgressBar>

export const CssColor: Story = {
  args: {
    color: 'red',
    backgroundColor: 'lightgray',
    size: '300px',
    percents: 10,
  },
}

export const HexColor: Story = {
  args: {
    color: '#ccc',
    size: '300px',
    percents: 10,
  },
}

export const ThirtyPercent: Story = {
  args: {
    color: 'red',
    strokeWidth: '20px',
    size: '300px',
    percents: 30,
  },
}
