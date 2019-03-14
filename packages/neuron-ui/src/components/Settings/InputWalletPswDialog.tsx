import React, { useState } from 'react'
import { Card, Button, Form, Row, Col } from 'react-bootstrap'
import { MainActions } from '../../containers/MainContent/reducer'
import { Wallet } from '../../contexts/Wallet'

const InputWalletPswDialog = ({ wallet, dispatch }: { wallet: Wallet; dispatch: any }) => {
  const [errorMsg, setErrorMsg] = useState('')
  const [password, stePassword] = useState('')

  const handleSubmit = () => {
    if (password) {
      dispatch({
        type: MainActions.SetDialog,
        payload: null,
      })
    } else {
      setErrorMsg('Please enter password')
    }
  }

  return (
    <Card
      onClick={(e: React.SyntheticEvent<HTMLDivElement>) => {
        e.preventDefault()
        e.stopPropagation()
      }}
      style={{
        width: '40%',
      }}
    >
      <Card.Header>{`Please Enter ${wallet.name} Password`}</Card.Header>
      <Card.Body>
        <Form.Group as={Row} controlId="formPlaintextPassword">
          <Col>
            <Form.Control
              type="password"
              placeholder="password"
              onChange={(e: any) => stePassword(e.currentTarget.value)}
              isInvalid={errorMsg !== ''}
            />
            <Form.Control.Feedback type="invalid">{errorMsg}</Form.Control.Feedback>
          </Col>
        </Form.Group>
      </Card.Body>
      <Card.Footer className="text-muted">
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
          }}
        >
          <Button variant="danger" onClick={handleSubmit}>
            Confirm
          </Button>
          <Button
            variant="light"
            onClick={() =>
              dispatch({
                type: MainActions.SetDialog,
                payload: null,
              })
            }
          >
            Cancel
          </Button>
        </div>
      </Card.Footer>
    </Card>
  )
}

export default InputWalletPswDialog
