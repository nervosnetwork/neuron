import React from 'react'
import styled from 'styled-components'

const Container = styled.ul`
  position: absolute;
  min-width: 100px;
  display: flex;
  flex-direction: column;
`

const Item = styled.div<{ disabled?: boolean; selected: boolean; primaryColor: string }>`
  background: #fff;
  appearance: 'none';
  flex: '1';
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  padding: 5px 15px;
  line-height: 2.4;
  color: ${props => (props.selected ? props.primaryColor : '#000')};
  &:hover {
    background: ${props => (props.disabled ? '#ccc' : props.primaryColor)};
    color: #fff;
    cursor: ${props => (props.disabled ? 'not-allowed' : 'default')};
  }
`

export interface DropDownItem {
  label: string
  key: string
  onClick: React.EventHandler<React.MouseEvent | React.KeyboardEvent>
  disabled?: boolean
}

const Dropdown = ({
  items,
  selected,
  style,
  itemsStyle,
  primaryColor = '#289dcc',
}: {
  items: (DropDownItem | null)[]
  selected?: number
  style?: { [index: string]: string }
  itemsStyle?: { [index: string]: string }
  primaryColor?: string
}) => (
  <Container
    style={{
      ...style,
    }}
    role="menu"
  >
    {items.map((item, idx) => {
      if (!item) return null
      return (
        <Item
          role="menuitem"
          selected={selected === idx}
          tabIndex={idx}
          key={item.key}
          onClick={item.onClick}
          onKeyUp={item.onClick}
          disabled={item.disabled}
          primaryColor={primaryColor}
          style={{
            ...itemsStyle,
          }}
        >
          {item.label}
        </Item>
      )
    })}
  </Container>
)

export default Dropdown
