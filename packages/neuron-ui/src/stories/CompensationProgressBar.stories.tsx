import React from 'react'
import { storiesOf } from '@storybook/react'
import { number, withKnobs } from '@storybook/addon-knobs'
import CompensationProgressBar, { CompensationProgressBarProps } from 'components/CompensationProgressBar'

const stories = storiesOf('Compensation Progress Bar', module)

const props: { [index: string]: CompensationProgressBarProps } = {
  Normal: {
    currentEpochValue: 0,
    endEpochValue: 180,
  },
  Suggested: {
    currentEpochValue: 139,
    endEpochValue: 180,
  },
  Requested: {
    currentEpochValue: 175,
    endEpochValue: 180,
  },
  End: {
    currentEpochValue: 180,
    endEpochValue: 180,
  },
  WithdrawnInPeriod: {
    currentEpochValue: 160,
    endEpochValue: 180,
    withdrawEpochValue: 30,
  },
  WithdrawnOuterPeriod: {
    currentEpochValue: 181,
    endEpochValue: 180,
    withdrawEpochValue: 30,
  },
}

Object.keys(props).forEach(key => {
  stories.add(key, () => {
    return <CompensationProgressBar {...props[key]} style={{ width: '300px' }} />
  })
})

stories.addDecorator(withKnobs()).add('Knob', () => {
  const knobProps = {
    currentEpochValue: number('Current Epoch Value', 175),
    endEpochValue: number('End Epoch Value', 180),
    withdrawEpochValue: number('Withdrawn Epoch Value', 160),
  }
  return <CompensationProgressBar {...knobProps} style={{ width: '300px' }} />
})
