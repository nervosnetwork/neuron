import React from 'react'
import { storiesOf } from '@storybook/react'
import DatetimePickerDialog from 'widgets/DatetimePickerDialog'

const stories = storiesOf('Datetime Picker', module)

stories.add('Basic Datetime Picker', () => (
  <DatetimePickerDialog
    show
    notice="According to the actual running block height, there may have some time variances in locktime."
    onConfirm={console.info}
    onCancel={() => {}}
  />
))
