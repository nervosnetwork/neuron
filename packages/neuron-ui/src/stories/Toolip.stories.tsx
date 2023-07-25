import React from 'react'
import { Meta, StoryObj } from '@storybook/react'
import Tooltip from 'widgets/Tooltip'

const meta: Meta<typeof Tooltip> = {
  component: Tooltip,
  argTypes: {
    children: {
      table: {
        disable: true,
      },
    },
  },
  decorators: [
    (Component, { args, parameters }) => (
      <div style={{ width: parameters.width ?? '800px', backgroundColor: '#FFF' }}>
        <Component {...args} />
      </div>
    ),
  ],
}

export default meta

type Story = StoryObj<typeof Tooltip>

export const Basic: Story = {
  args: {
    tip: 'This is a tooltip',
    children: <span>show tooltip</span>,
  },
}

export const TipWithReactChildren: Story = {
  args: {
    tip: <span>This is a tooltip</span>,
    children: <span>show tooltip</span>,
  },
  argTypes: {
    tip: {
      table: {
        disable: true,
      },
    },
  },
}

export const BasicShortWidth: Story = {
  args: {
    tip: 'This is a tooltip',
    children: <span>tooltip</span>,
  },
  parameters: {
    width: '60px',
  },
}

export const TipWithReactChildrenShortWidth: Story = {
  args: {
    tip: <span>This is a tooltip</span>,
    children: <span>tooltip</span>,
  },
  argTypes: {
    tip: {
      table: {
        disable: true,
      },
    },
  },
  parameters: {
    width: '60px',
  },
}
