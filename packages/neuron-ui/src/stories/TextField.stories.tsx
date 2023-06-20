import React from 'react'
import { ComponentStory } from '@storybook/react'
import TextField from 'widgets/TextField'

export default {
  title: 'TextField',
  component: TextField,
  argTypes: {
    onChange: {
      table: {
        disable: true,
      },
    },
  },
}

const Template: ComponentStory<typeof TextField> = (props: any) => <TextField {...props} />
export const Basic = Template.bind({})
Basic.args = {
  label: 'label',
  required: false,
  stack: false,
  field: 'field',
  value: 'value',
  error: 'error',
  type: 'text',
  suffix: 'suffix',
  onChange: () => {},
}
