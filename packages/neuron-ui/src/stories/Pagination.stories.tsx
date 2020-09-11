import React from 'react'
import { storiesOf } from '@storybook/react'
import { action } from '@storybook/addon-actions'
import { withKnobs, number } from '@storybook/addon-knobs'
import Pagination, { PaginationProps } from 'widgets/Pagination'

const stories = storiesOf('Pagination', module)
const onChange = action('onclick')

const propsList: { [name: string]: PaginationProps } = {
  '1 page': {
    pageNo: 1,
    count: 10,
    pageSize: 15,
    onChange,
  },
  'at the fisrt page': {
    pageNo: 1,
    count: 100,
    pageSize: 15,
    onChange,
  },
  'at the last page': {
    pageNo: 7,
    count: 100,
    pageSize: 15,
    onChange,
  },
  'more than 5 pages': {
    pageNo: 6,
    count: 100,
    pageSize: 15,
    onChange,
  },
}

Object.entries(propsList).forEach(([title, props]) => {
  stories.add(title, () => {
    return <Pagination {...props} />
  })
})

stories.addDecorator(withKnobs).add('with knobs', () => {
  const props = {
    pageNo: number('page no', 1),
    count: number('count', 100),
    pageSize: number('page size', 15),
    onChange,
  }
  return <Pagination {...props} />
})
