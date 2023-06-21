import React from 'react'
import { ComponentStory } from '@storybook/react'
import { action } from '@storybook/addon-actions'
import Pagination from 'widgets/Pagination'

export default {
  title: 'Pagination',
  component: Pagination,
  argTypes: {
    onChange: {
      table: {
        disable: true,
      },
    },
  },
}

const onChange = action('onclick')

const Template: ComponentStory<typeof Pagination> = (props: any) => <Pagination {...props} />

export const OnlyOnePage = Template.bind({})
OnlyOnePage.args = {
  pageNo: 1,
  count: 10,
  pageSize: 15,
  onChange,
}
OnlyOnePage.storyName = '1 page'

export const AtTheFisrtPage = Template.bind({})
AtTheFisrtPage.args = {
  pageNo: 1,
  count: 100,
  pageSize: 15,
  onChange,
}

export const AtTheLastPage = Template.bind({})
AtTheLastPage.args = {
  pageNo: 7,
  count: 100,
  pageSize: 15,
  onChange,
}

export const MoreThan5Pages = Template.bind({})
MoreThan5Pages.args = {
  pageNo: 6,
  count: 100,
  pageSize: 15,
  onChange,
}
