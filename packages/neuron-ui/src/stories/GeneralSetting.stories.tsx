import React from 'react'
import { storiesOf } from '@storybook/react'
import { withKnobs } from '@storybook/addon-knobs'
import GeneralSetting from 'components/GeneralSetting'

const stories = storiesOf('GeneralSettings', module)

stories.addDecorator(withKnobs).add('With knobs', () => {
  return <GeneralSetting />
})
