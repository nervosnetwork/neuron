import React from 'react'
import { storiesOf } from '@storybook/react'
import CompensationPeriodDialog from 'components/CompensationPeriodDialog'

const props = {
  compensationPeriod: {
    currentEpochNumber: BigInt(170),
    currentEpochIndex: BigInt(1),
    currentEpochLength: BigInt(10),
    targetEpochNumber: BigInt(180),
  },
  onDismiss: () => {},
}

const stories = storiesOf('Compensation Period Dialog', module)

stories.add('With knobs', () => {
  return <CompensationPeriodDialog {...props} />
})
