import React from 'react'
import { Form, Col, Row, OverlayTrigger, Tooltip } from 'react-bootstrap'

export interface InputProps {
  label: string
  value: string
  onChange: (event: React.FormEvent<React.PropsWithoutRef<any>>) => void
  tooltip?: string
  placeholder?: string
  inputtype?: string
  maxLength?: number
}

const InlineInput = ({ label, value, onChange, tooltip, placeholder, inputtype, maxLength }: InputProps) => (
  <Form.Group as={Row} controlId={label}>
    <Form.Label
      column
      style={{
        textTransform: 'capitalize',
      }}
    >
      {`${label}:`}
    </Form.Label>
    <Col sm="10">
      {tooltip ? (
        <OverlayTrigger
          placement="top-start"
          trigger={['hover', 'focus']}
          overlay={<Tooltip id={`tooltip-${label}`}>{tooltip}</Tooltip>}
        >
          <Form.Control
            type={inputtype || 'text'}
            value={value}
            placeholder={placeholder}
            onChange={onChange}
            maxLength={maxLength}
          />
        </OverlayTrigger>
      ) : (
        <Form.Control
          type={inputtype || 'text'}
          value={value}
          placeholder={placeholder}
          onChange={onChange}
          maxLength={maxLength}
        />
      )}
    </Col>
  </Form.Group>
)
export default InlineInput
