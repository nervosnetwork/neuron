import React from 'react'
import { storiesOf } from '@storybook/react'
import { withKnobs, text } from '@storybook/addon-knobs'
import NetworkStatus from 'components/NetworkStatus'

const states = {
  Online: {
    networkName: 'network name',
    connectionStatus: 'online' as any,
    onAction: () => {},
  },
  Offline: {
    networkName: 'network',
    connectionStatus: 'offline' as any,
    onAction: () => {},
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
    networkName: text('Network name', 'network name'),
    connectionStatus: text('online', 'online') as any,
    onAction: () => {},
  }
  return <NetworkStatus {...props} />
})
