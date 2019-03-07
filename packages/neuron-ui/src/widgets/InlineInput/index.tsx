import React from 'react'
import { Form, Col, Row, OverlayTrigger, Tooltip } from 'react-bootstrap'

interface InputProps {
  label: string
  value: string
  onChange: (event: React.FormEvent<React.PropsWithoutRef<any>>) => void
  tooltip?: string
  placeholder?: string
}

const InlineInput = ({ label, value, onChange, tooltip, placeholder }: InputProps) => (
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
          <Form.Control type="text" value={value} placeholder={placeholder} onChange={onChange} />
        </OverlayTrigger>
      ) : (
        <Form.Control type="text" value={value} placeholder={placeholder} onChange={onChange} />
      )}
    </Col>
  </Form.Group>
)
export default InlineInput
