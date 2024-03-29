import React from 'react'
import { Meta, StoryObj } from '@storybook/react'
import Table from 'widgets/Table'
import { HIDE_BALANCE } from 'utils/const'

const meta: Meta<typeof Table> = {
  component: Table,
  argTypes: {
    head: { control: 'text' },
  },
}

export default meta

type Story = StoryObj<typeof Table>

export const EmptyTable: Story = {
  args: {
    columns: [
      {
        title: 'a',
        dataIndex: 'a',
      },
      {
        title: 'b',
        dataIndex: 'b',
      },
    ],
    dataSource: [],
  },
}

export const DataTable: Story = {
  args: {
    columns: [
      {
        title: 'a',
        dataIndex: 'a',
      },
      {
        title: 'b',
        dataIndex: 'b',
      },
    ],
    dataSource: [
      {
        a: 10,
        b: 'aaa',
      },
      {
        a: 20,
        b: 'bbb',
      },
    ],
  },
}

export const TableWithHead: Story = {
  args: {
    columns: [
      {
        title: '时间',
        dataIndex: 'a',
      },
      {
        title: '类型',
        dataIndex: 'b',
      },
    ],
    dataSource: [
      {
        a: 10,
        b: 'aaa',
      },
      {
        a: 20,
        b: 'bbb',
      },
    ],
    head: <div style={{ padding: '16px' }}>head</div>,
  },
}

export const TableWithColumnRender: Story = {
  args: {
    columns: [
      {
        title: '时间',
        dataIndex: 'a',
        align: 'center',
      },
      {
        title: '类型',
        dataIndex: 'b',
      },
      {
        title: '余额',
        dataIndex: 'balance',
        isBalance: true,
        render(v: string, _idx, _item, showBalance) {
          return (
            <span style={{ color: v.includes('-') ? undefined : '#00C891' }}>{showBalance ? v : HIDE_BALANCE}</span>
          )
        },
      },
    ],
    dataSource: [
      {
        a: 10,
        b: 'aaa',
        balance: '9850000',
      },
      {
        a: 20,
        b: 'bbb',
        balance: '-0.1',
      },
    ],
    head: <div style={{ padding: '16px' }}>head</div>,
  },
}
