import React from 'react'
import { storiesOf } from '@storybook/react'
import StoryRouter from 'storybook-react-router'
import SUDTSend from 'components/SUDTSend'

const stories = storiesOf('sUDT Send', module).addDecorator(StoryRouter())

stories.add('Basic', () => <SUDTSend />)
