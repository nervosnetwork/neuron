import { Meta, StoryObj } from '@storybook/react'
import CompensationProgressBar from 'components/CompensationProgressBar'

const meta: Meta<typeof CompensationProgressBar> = {
  component: CompensationProgressBar,
  args: {
    style: { width: '300px' },
  },
}

export default meta

type Story = StoryObj<typeof CompensationProgressBar>

export const Normal: Story = {
  args: { currentEpochValue: 0, endEpochValue: 180 },
}

export const Suggested: Story = {
  args: { currentEpochValue: 139, endEpochValue: 180 },
}

export const Requested: Story = {
  args: { currentEpochValue: 175, endEpochValue: 180 },
}

export const End: Story = { args: { currentEpochValue: 180, endEpochValue: 180 } }

export const WithdrawnInPeriod: Story = { args: { currentEpochValue: 160, endEpochValue: 180, withdrawEpochValue: 30 } }

export const WithdrawnOuterPeriod: Story = {
  args: { currentEpochValue: 181, endEpochValue: 180, withdrawEpochValue: 30 },
}

export const CurrentLessThanEnd: Story = { args: { currentEpochValue: 181, endEpochValue: 180 } }

export const CurrentLessThanBegin: Story = { args: { currentEpochValue: 0, endEpochValue: 181 } }

export const Pending: Story = { args: { pending: true, currentEpochValue: 0, endEpochValue: 0 } }
