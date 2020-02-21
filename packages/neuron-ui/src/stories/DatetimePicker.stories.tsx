import React from 'react'
import { storiesOf } from '@storybook/react'
import DatetimePicker from 'widgets/DatetimePicker'

const stories = storiesOf('Datetime Picker', module)

stories.add('Basic Datetime Picker', () => (
  <DatetimePicker
    title="Set Locktime"
    notice="According to the actual running block height, there may have some time variances in locktime."
    onConfirm={console.info}
    onCancel={() => {}}
  />
))
