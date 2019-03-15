import React, { useState } from 'react'
import styled from 'styled-components'
import { useTranslation } from 'react-i18next'
import { Card, Button, Form, Row, Col } from 'react-bootstrap'

import { MainActions } from '../../containers/MainContent/reducer'

const ButtonDiv = styled.div`
  display: flex;
  justify-content: space-between;
`

const InputWalletPswDialog = ({
  walletName,
  dispatch,
  handle,
}: {
  walletName: string
  dispatch: any
  handle?: any
}) => {
  const [errorMsg, setErrorMsg] = useState('')
  const [password, setPassword] = useState('')
  const [t] = useTranslation()
  const handleSubmit = () => {
    if (password) {
      dispatch({
        type: MainActions.SetDialog,
        payload: null,
      })
      handle()
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
      <Card.Header>{`Please Enter ${walletName} Password`}</Card.Header>
      <Card.Body>
        <Form.Group as={Row} controlId="formPlaintextPassword">
          <Col>
            <Form.Control
              type="password"
              placeholder="password"
              onChange={(e: any) => setPassword(e.currentTarget.value)}
              isInvalid={errorMsg !== ''}
            />
            <Form.Control.Feedback type="invalid">{errorMsg}</Form.Control.Feedback>
          </Col>
        </Form.Group>
      </Card.Body>
      <Card.Footer className="text-muted">
        <ButtonDiv>
          <Button variant="danger" onClick={handleSubmit}>
            {t('Confirm')}
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
            {t('Cancel')}
          </Button>
        </ButtonDiv>
      </Card.Footer>
    </Card>
  )
}

export default InputWalletPswDialog
