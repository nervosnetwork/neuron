import React from 'react'
import { storiesOf } from '@storybook/react'
import ExperimentalRibbon from 'widgets/ExperimentalRibbon'

const stories = storiesOf('Experimental Ribbon', module)

stories.add('Basic', () => {
  return <ExperimentalRibbon tag="story" />
})
