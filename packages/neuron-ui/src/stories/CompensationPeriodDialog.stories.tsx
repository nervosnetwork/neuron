import React from 'react'
import { storiesOf } from '@storybook/react'
import CompensationPeriodDialog from 'components/CompensationPeriodDialog'

const props = {
  compensationPeriod: {
    currentEpochValue: 170.1,
    targetEpochValue: 180,
  },
  onDismiss: () => {},
}

const stories = storiesOf('Compensation Period Dialog', module)

stories.add('With knobs', () => {
  return <CompensationPeriodDialog {...props} />
})
