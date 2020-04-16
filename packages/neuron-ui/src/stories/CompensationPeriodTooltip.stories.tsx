import React from 'react'
import { storiesOf } from '@storybook/react'
import CompensationPeriodTooltip, { CompensationPeriodTooltipProps } from 'components/CompensationPeriodTooltip'

const stories = storiesOf('Compensation Period Tooltip', module)

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
  'immature for withdraw': {
    depositEpochValue: 1,
    baseEpochTimestamp: Date.now(),
    baseEpochValue: 4.9,
    endEpochValue: 181,
  },
  'base less than deposit': {
    depositEpochValue: 1,
    baseEpochTimestamp: Date.now(),
    baseEpochValue: 0,
    endEpochValue: 181,
  },
  'base larger than end': {
    depositEpochValue: 0,
    baseEpochTimestamp: Date.now(),
    baseEpochValue: 181,
    endEpochValue: 180,
  },
}

Object.keys(props).forEach(key => {
  stories.add(key, () => {
    return <CompensationPeriodTooltip {...props[key]} />
  })
})
