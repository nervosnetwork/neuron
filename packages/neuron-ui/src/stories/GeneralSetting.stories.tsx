import React from 'react'
import { storiesOf } from '@storybook/react'
import { withKnobs } from '@storybook/addon-knobs'
import GeneralSetting from 'components/GeneralSetting'
import { initStates } from 'states'

const states: { [title: string]: boolean } = {
  'Clear cell cache on': true,
  'Clear cell cache off': false,
}

const stories = storiesOf('GeneralSettings', module)

Object.entries(states).forEach(([title]) => {
  const props = { ...initStates, settings: { ...initStates.settings }, dispatch: () => {} }
  stories.add(title, () => <GeneralSetting {...props} />)
})

stories.addDecorator(withKnobs).add('With knobs', () => {
  const props = {
    ...initStates,
  }
  return <GeneralSetting {...props} dispatch={() => {}} />
})
