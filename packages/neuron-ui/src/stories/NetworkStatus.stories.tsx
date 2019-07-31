import React from 'react'
import { storiesOf } from '@storybook/react'
import { withKnobs, text, boolean } from '@storybook/addon-knobs'
import { NetworkStatus } from 'containers/Footer'

const states = {
  Online: {
    name: 'network name',
    online: true,
  },
  Offline: {
    name: 'network',
    online: false,
  },
}

const stories = storiesOf('Connection Status', module).addDecorator(withKnobs)

Object.entries(states).forEach(([title, props]) => {
  stories.add(title, () => {
    return <NetworkStatus {...props} />
  })
})

stories.add('With knobs', () => {
  const props = {
    name: text('Network name', 'network name'),
    online: boolean('online', false),
  }
  return <NetworkStatus {...props} />
})
