import { Meta, StoryObj } from '@storybook/react'
import ExperimentalRibbon from 'widgets/ExperimentalRibbon'

const meta: Meta<typeof ExperimentalRibbon> = {
  component: ExperimentalRibbon,
}

export default meta

type Story = StoryObj<typeof ExperimentalRibbon>

export const Default: Story = {
  args: {
    tag: 'story',
  },
}
