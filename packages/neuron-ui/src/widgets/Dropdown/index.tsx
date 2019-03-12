import React from 'react'
import styled from 'styled-components'

const Item = styled.div<{ disabled?: boolean }>`
  background: #fff;
  appearance: 'none';
  flex: '1';
  padding: 5px 15px;
  &:hover {
    background: ${props => (props.disabled ? '#ccc' : '#289dcc')};
    color: #fff;
    cursor: ${props => (props.disabled ? 'not-allowed' : 'default')};
  }
`

export interface DropDownItem {
  label: string
  onClick: React.EventHandler<React.MouseEvent | React.KeyboardEvent>
  disabled?: boolean
}

const Dropdown = ({
  items,
  style,
  itemsStyle,
}: {
  items: (DropDownItem | null)[]
  style?: { [index: string]: string }
  itemsStyle?: { [index: string]: string }
}) => (
  <ul
    style={{
      position: 'absolute',
      minWidth: '100px',
      display: 'flex',
      flexDirection: 'column',
      // boxShadow: 1px
      ...style,
    }}
    role="menu"
  >
    {items.map((item, idx) => {
      if (!item) return null
      return (
        <Item
          role="menuitem"
          tabIndex={idx}
          key={item.label}
          onClick={item.onClick}
          onKeyUp={item.onClick}
          disabled={item.disabled}
          style={{
            ...itemsStyle,
          }}
        >
          {item.label}
        </Item>
      )
    })}
  </ul>
)

export default Dropdown
