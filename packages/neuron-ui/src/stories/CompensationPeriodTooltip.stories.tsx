import { Meta, StoryObj } from '@storybook/react'
import CompensationPeriodTooltip, { CompensationPeriodTooltipProps } from 'components/CompensationPeriodTooltip'

const props: { [index: string]: CompensationPeriodTooltipProps } = {
  normalStart: {
    depositEpochValue: 0,
    baseEpochTimestamp: Date.now(),
    baseEpochValue: 4,
    endEpochValue: 180,
  },
  normalEnd: {
    depositEpochValue: 0,
    baseEpochTimestamp: Date.now(),
    baseEpochValue: 138,
    endEpochValue: 180,
  },
  suggestedStart: {
    depositEpochValue: 0,
    baseEpochTimestamp: Date.now(),
    baseEpochValue: 138.25,
    endEpochValue: 180,
  },
  suggestedEnd: {
    depositEpochValue: 0,
    baseEpochTimestamp: Date.now(),
    baseEpochValue: 174,
    endEpochValue: 180,
  },
  endingStart: {
    depositEpochValue: 0,
    baseEpochTimestamp: Date.now(),
    baseEpochValue: 174.25,
    endEpochValue: 180,
  },
  withdrawInNormal: {
    depositEpochValue: 0,
    baseEpochTimestamp: Date.now(),
    baseEpochValue: 100,
    endEpochValue: 180,
    isWithdrawn: true,
  },
  withdrawInSuggested: {
    depositEpochValue: 0,
    baseEpochTimestamp: Date.now(),
    baseEpochValue: 138.25,
    endEpochValue: 180,
    isWithdrawn: true,
  },
  withdrawnInEnding: {
    depositEpochValue: 0,
    baseEpochTimestamp: Date.now(),
    baseEpochValue: 174.25,
    endEpochValue: 180,
    isWithdrawn: true,
  },
  immatureForWithdraw: {
    depositEpochValue: 1,
    baseEpochTimestamp: Date.now(),
    baseEpochValue: 4.9,
    endEpochValue: 181,
  },
  baseLessThanDeposit: {
    depositEpochValue: 1,
    baseEpochTimestamp: Date.now(),
    baseEpochValue: 0,
    endEpochValue: 181,
  },
  baseLargerThanEnd: {
    depositEpochValue: 0,
    baseEpochTimestamp: Date.now(),
    baseEpochValue: 181,
    endEpochValue: 180,
  },
}

const meta: Meta<typeof CompensationPeriodTooltip> = {
  component: CompensationPeriodTooltip,
}

export default meta

type Story = StoryObj<typeof CompensationPeriodTooltip>

export const NormalStart: Story = {
  args: props.normalStart,
}

export const NormalEnd: Story = {
  args: props.normalEnd,
}

export const SuggestedStart: Story = {
  args: props.suggestedStart,
}

export const SuggestedEnd: Story = {
  args: props.suggestedEnd,
}

export const EndingStart: Story = {
  args: props.endingStart,
}

export const WithdrawInNormal: Story = {
  args: props.withdrawInNormal,
}

export const WithdrawInSuggested: Story = {
  args: props.withdrawInSuggested,
}

export const WithdrawnInEnding: Story = {
  args: props.withdrawnInEnding,
}

export const ImmatureForWithdraw: Story = {
  args: props.immatureForWithdraw,
}

export const BaseLessThanDeposit: Story = {
  args: props.baseLessThanDeposit,
}

export const BaseLargerThanEnd: Story = {
  args: props.baseLargerThanEnd,
}
