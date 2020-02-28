import React from 'react'
import { storiesOf } from '@storybook/react'
import SignAndVerify from 'components/SignAndVerify'

const stories = storiesOf('Sign and Verify', module)

stories.add('Basic', () => {
  return <SignAndVerify />
})
