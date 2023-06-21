import React from 'react'
import { storiesOf } from '@storybook/react'
import { withRouter } from 'storybook-addon-react-router-v6'
import SUDTSend from 'components/SUDTSend'

const stories = storiesOf('sUDT Send', module).addDecorator(withRouter())

stories.add('Basic', () => <SUDTSend />)
