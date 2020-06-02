import React from 'react'
import { Dropdown, IDropdownProps, Icon } from 'office-ui-fabric-react'

const CustomDropdown = (props: IDropdownProps) => (
  <Dropdown
    onRenderCaretDown={() => {
      return <Icon iconName="ArrowDown" />
    }}
    styles={{
      label: {
        fontSize: '0.75rem',
        fontWeight: 500,
      },

      title: {
        fontSize: '0.75rem!important',
        fontWeight: 500,
        height: '1.625rem',
        lineHeight: '1.625rem',
      },
      dropdownOptionText: {
        fontSize: '0.75rem!important',
        boxShadow: 'border-box',
      },
      dropdownItem: {
        fontSize: '0.75rem!important',
        boxShadow: 'border-box',
        minHeight: 'auto',
      },
      dropdownItemSelected: {
        fontSize: '0.75rem!important',
        minHeight: 'auto',
        backgroundColor: '#e3e3e3',
      },
      root: {
        fontSize: '0.75rem',
        marginBottom: '10px',
      },
    }}
    {...props}
  />
)

export default CustomDropdown
