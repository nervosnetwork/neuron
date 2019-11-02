import React from 'react'
import { storiesOf } from '@storybook/react'
import { withKnobs } from '@storybook/addon-knobs'
import GeneralSetting from 'components/GeneralSetting'
import initStates from 'states/initStates'

const stories = storiesOf('GeneralSettings', module)

stories.addDecorator(withKnobs).add('With knobs', () => {
  const props = {
    ...initStates,
    settings: {
      ...initStates.settings,
    },
  }
  return <GeneralSetting {...props} dispatch={() => {}} />
})
