import { Meta, StoryObj } from '@storybook/react'
import { action } from '@storybook/addon-actions'
import Pagination from 'widgets/Pagination'

const onChange = action('onclick')

const meta: Meta<typeof Pagination> = {
  component: Pagination,
  argTypes: {
    onChange: {
      table: {
        disable: true,
      },
    },
  },
}

export default meta

type Story = StoryObj<typeof Pagination>

export const OnlyOnePage: Story = {
  args: {
    pageNo: 1,
    count: 10,
    pageSize: 15,
    onChange,
  },
  storyName: '1 page',
}

export const AtTheFirstPage: Story = {
  args: {
    pageNo: 1,
    count: 100,
    pageSize: 15,
    onChange,
  },
}

export const AtTheLastPage: Story = {
  args: {
    pageNo: 7,
    count: 100,
    pageSize: 15,
    onChange,
  },
}

export const MoreThan5Pages: Story = {
  args: {
    pageNo: 6,
    count: 100,
    pageSize: 15,
    onChange,
  },
}
