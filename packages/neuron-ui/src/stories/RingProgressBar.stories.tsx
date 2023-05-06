import React from 'react'
import { ComponentStory } from '@storybook/react'
import RingProgressBar from 'widgets/RingProgressBar'

export default {
  title: 'Ring Progress Bar',
  component: RingProgressBar,
}

const Template: ComponentStory<typeof RingProgressBar> = (props: any) => <RingProgressBar {...props} />

export const CssColor = Template.bind({})
CssColor.args = {
  color: 'red',
  backgroundColor: 'lightgray',
  size: '300px',
  percents: 10,
}

export const HexColor = Template.bind({})
HexColor.args = {
  color: '#ccc',
  size: '300px',
  percents: 10,
}

export const ThirtyPercent = Template.bind({})
ThirtyPercent.args = {
  color: 'red',
  strokeWidth: '20px',
  size: '300px',
  percents: 30,
}
