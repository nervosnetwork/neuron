import React from 'react'
import { storiesOf } from '@storybook/react'
import { withRouter } from 'storybook-addon-react-router-v6'
import Breadcrum, { BreadcumProps } from 'widgets/Breadcrum'

const stories = storiesOf('Breadcum', module).addDecorator(withRouter())

const propsList: { [name: string]: BreadcumProps } = {
  empty: { pages: [] },
  root: {
    pages: [
      {
        label: 'root',
        link: 'root',
      },
    ],
  },
  '2 layers': {
    pages: [
      { label: 'root', link: 'root' },
      { label: 'first', link: 'first' },
    ],
  },
  '3 layers': {
    pages: [
      { label: 'root', link: 'root' },
      { label: 'first', link: 'first' },
      { label: 'second', link: 'second' },
    ],
  },
}

Object.entries(propsList).forEach(([name, props]) => {
  stories.add(name, () => {
    return <Breadcrum {...props} />
  })
})
