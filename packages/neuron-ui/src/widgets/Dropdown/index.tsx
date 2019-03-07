import React from 'react'

export interface DropDownItem {
  label: string
  onClick: React.EventHandler<React.MouseEvent | React.KeyboardEvent>
}

const Dropdown = ({ items, style }: { items: DropDownItem[]; style?: { [index: string]: string } }) => (
  <div
    style={{
      display: 'flex',
      flexDirection: 'column',
      ...style,
    }}
  >
    {items.map(item => (
      <button key={item.label} onClick={item.onClick} onKeyUp={item.onClick} type="button">
        {item.label}
      </button>
    ))}
  </div>
)

export default Dropdown
