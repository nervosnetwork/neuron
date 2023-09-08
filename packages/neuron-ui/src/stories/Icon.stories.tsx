import React from 'react'
import { Meta, StoryObj } from '@storybook/react'
import * as icons from '../widgets/Icons/icon'

type IconNames = keyof typeof icons
const backgroundForIcons: Record<string, string> = {
  Experimental: '#aaa',
  History: '#aaa',
  NervosDAO: '#aaa',
  Overview: '#aaa',
  Send: '#aaa',
  Receive: '#aaa',
  Settings: '#aaa',
  Transfer: '#aaa',
}

const meta: Meta<unknown> = {
  component: () => {
    return (
      <div
        style={{
          display: 'grid',
          gridGap: '24px',
          gridTemplateColumns: 'repeat(auto-fit, 120px)',
          justifyContent: 'center',
        }}
      >
        {Object.keys(icons).map(key => {
          const IconComponent = icons[key as IconNames]
          return (
            <div style={{ textAlign: 'center' }}>
              <IconComponent
                key={key}
                style={{ width: '16px', height: '16px', backgroundColor: backgroundForIcons[key] }}
              />
              <br />
              {key}
            </div>
          )
        })}
      </div>
    )
  },
}

export default meta

type Story = StoryObj<unknown>

export const ShowAll: Story = {}
