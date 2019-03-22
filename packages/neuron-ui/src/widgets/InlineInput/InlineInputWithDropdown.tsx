import React from 'react'
import { Col, Row, Form, InputGroup, DropdownButton, Dropdown } from 'react-bootstrap'

export interface InlineInputWithDropdownProps {
  label: string
  disabled?: boolean
  value: string
  placeholder?: string
  onChange: React.EventHandler<React.FormEvent<{}>>
  prepend?: boolean
  variant?:
    | 'link'
    | 'primary'
    | 'secondary'
    | 'success'
    | 'danger'
    | 'warning'
    | 'info'
    | 'dark'
    | 'light'
    | 'outline-primary'
    | 'outline-secondary'
    | 'outline-success'
    | 'outline-danger'
  dropDown: {
    title: string
    items: {
      label: string
      key: string
      onClick: React.EventHandler<React.MouseEvent>
      disabled?: boolean
    }[]
  }
}

const InlineInputWithDropdown = ({
  label,
  disabled,
  value,
  placeholder,
  onChange,
  prepend,
  variant = 'outline-secondary',
  dropDown,
}: InlineInputWithDropdownProps) => (
  <Form.Group as={Row}>
    <Form.Label column>{label}</Form.Label>
    <Col sm={10}>
      <InputGroup>
        <Form.Control disabled={disabled} value={value} onChange={onChange} placeholder={placeholder} />
        <DropdownButton
          as={prepend ? InputGroup.Prepend : InputGroup.Append}
          variant={variant}
          title={dropDown.title}
          value={0}
          id={`${label}-id`}
        >
          {dropDown.items.map(item => (
            <Dropdown.Item key={item.key} onClick={item.onClick} disabled={item.disabled}>
              {item.label}
            </Dropdown.Item>
          ))}
        </DropdownButton>
      </InputGroup>
    </Col>
  </Form.Group>
)

InlineInputWithDropdown.displayName = 'InlineInputWithDropdown'

export default InlineInputWithDropdown
