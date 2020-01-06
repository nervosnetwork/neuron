import React from 'react'
import { storiesOf } from '@storybook/react'
import AlertDialog from 'widgets/AlertDialog'

const props = {
  content: {
    title: 'This is the title of alert dialog',
    message:
      'Lorem ipsum dolor sit amet, consectetur adipisicing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.',
  },
  dispatch: () => {},
}

const stories = storiesOf('Alert Dialog', module)
stories.add('basic alert dialog', () => {
  return <AlertDialog {...props} />
})
