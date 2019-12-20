import React from 'react'
import { storiesOf } from '@storybook/react'
import { withKnobs, text, boolean } from '@storybook/addon-knobs'
import TextField from 'widgets/TextField'

const stories = storiesOf('TextField', module).addDecorator(withKnobs())

stories.add('Basic', () => {
  const props = {
    label: text('Label', 'label'),
    required: boolean('Required', false),
    stack: boolean('Stack', false),
    field: text('Field', 'field'),
    value: text('Value', 'value'),
    error: text('Error', 'error'),
    type: text('Type', 'text') as 'text' | 'password',
    onChange: () => {},
  }
  return <TextField {...props} />
})
