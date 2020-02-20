import React from 'react'
import { storiesOf } from '@storybook/react'
import DatetimePicker from 'widgets/DatetimePicker'

const stories = storiesOf('Datetime Picker', module)

stories.add('Basic Datetime Picker', () => <DatetimePicker onPick={console.info} />)
