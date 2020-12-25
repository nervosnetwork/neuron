import React from 'react'
import { storiesOf } from '@storybook/react'
import { withKnobs, color, text, number } from '@storybook/addon-knobs'
import RingProgressBar from 'widgets/RingProgressBar'

const stories = storiesOf('Ring Progress Bar', module)

const propsList = {
  'css-color': {
    color: 'red',
    backgroundColor: 'lightgray',
    size: '300px',
    percents: 10,
  },
  'hex-color': {
    color: '#ccc',
    size: '300px',
    percents: 10,
  },
  '30-percents': {
    color: 'red',
    strokeWidth: '20px',
    size: '300px',
    percents: 30,
  },
}

Object.entries(propsList).forEach(([title, props]) => {
  stories.add(title, () => {
    return <RingProgressBar {...props} />
  })
})

stories.addDecorator(withKnobs()).add('With knob', () => {
  const props = {
    color: color('Color', 'red'),
    backgroundColor: color('Background Color', 'maroon'),
    strokeWidth: text('Stroke width', '20px'),
    size: text('Size', '300px'),
    percents: number('Percents', 20),
  }
  return <RingProgressBar {...props} />
})
