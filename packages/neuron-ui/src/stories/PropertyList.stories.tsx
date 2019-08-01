import React from 'react'
import { storiesOf } from '@storybook/react'
import PropertyList, { Property, CellStyles } from 'widgets/PropertyList'

const states: { [title: string]: { properties: Property[] } } = {
  basic: {
    properties: Array.from({ length: 15 }, (_, idx) => ({
      label: `Property ${idx}`.repeat((idx % 5) + 1),
      value: `Value of property ${idx}`.repeat((idx % 5) + 1),
    })),
  },
}

const cellStyles: CellStyles = {
  labelWidth: '100px',
  valueWidth: '200px',
}

const stories = storiesOf('Property List', module)

Object.entries(states).forEach(([title, props]) => {
  stories.add(title, () => {
    return <PropertyList {...props} cellStyles={cellStyles} />
  })
})
