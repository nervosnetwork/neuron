import React from 'react'
import { ComponentStory } from '@storybook/react'
import Tooltip from 'widgets/Tooltip'

export default {
  title: 'Tooltip',
  component: Tooltip,
  argTypes: {
    children: {
      table: {
        disable: true,
      },
    },
  },
}

const Template: ComponentStory<typeof Tooltip> = (props: any) => (
  <div style={{ width: '800px', backgroundColor: '#FFF' }}>
    <Tooltip {...props} />
  </div>
)
export const Basic = Template.bind({})
Basic.args = {
  tip: 'This is a tooltip',
  children: <span>show tooltip</span>,
}

export const TipWithReactChildren = Template.bind({})
TipWithReactChildren.args = {
  tip: <span>This is a tooltip</span>,
  children: <span>show tooltip</span>,
}
TipWithReactChildren.argTypes = {
  tip: {
    table: {
      disable: true,
    },
  },
}

const TemplateShortWidth: ComponentStory<typeof Tooltip> = (props: any) => (
  <div style={{ width: '60px', backgroundColor: '#FFF' }}>
    <Tooltip {...props} />
  </div>
)
export const BasicShortWidth = TemplateShortWidth.bind({})
BasicShortWidth.args = {
  tip: 'This is a tooltip',
  children: <span>tooltip</span>,
}

export const TipWithReactChildrenShortWidth = TemplateShortWidth.bind({})
TipWithReactChildrenShortWidth.args = {
  tip: <span>This is a tooltip</span>,
  children: <span>tooltip</span>,
}
TipWithReactChildrenShortWidth.argTypes = {
  tip: {
    table: {
      disable: true,
    },
  },
}
