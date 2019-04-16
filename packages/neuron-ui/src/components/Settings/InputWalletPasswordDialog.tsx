import React, { useState } from 'react'
import styled from 'styled-components'
import { useTranslation } from 'react-i18next'
import { Card, Button, Form, Row, Col } from 'react-bootstrap'

import { MainActions, actionCreators } from '../../containers/MainContent/reducer'
import { checkPassword } from '../../services/UILayer'
import { Wallet } from '../../contexts/NeuronWallet'

export enum CheckType {
  CheckPassword,
  EditWallet,
  DeleteWallet,
}

interface InputPasswordProps {
  wallet?: Wallet
  dispatch: any
  errorMessage: string
  checkType: CheckType
  newWalletName?: string
  newPassword?: string
}

const ButtonDiv = styled.div`
  display: flex;
  justify-content: space-between;
`

const InputWalletPasswordDialog = ({
  wallet,
  dispatch,
  checkType,
  errorMessage,
  newWalletName,
  newPassword,
}: InputPasswordProps) => {
  const [password, setPassword] = useState('')
  const [t] = useTranslation()

  const handleResult = (args: ChannelResponse<string>) => {
    if (args.result) {
      dispatch({
        type: MainActions.SetDialog,
        payload: {
          open: false,
        },
      })
    }
  }

  const handleSubmit = (id: string) => {
    switch (checkType) {
      case CheckType.EditWallet:
        if (newWalletName && newPassword) {
          dispatch(
            actionCreators.createOrUpdateWallet(
              {
                id,
                name: newWalletName,
              },
              password,
            ),
          )
        }
        break
      case CheckType.DeleteWallet:
        dispatch(actionCreators.deleteWallet({ id, password }))
        break
      case CheckType.CheckPassword:
      default:
        checkPassword(id, password, handleResult)
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
      {wallet ? (
        <>
          <Card.Header>{`Please Enter ${wallet.name} Password`}</Card.Header>
          <Card.Body>
            <Form.Group as={Row} controlId="formPlaintextPassword">
              <Col>
                <Form.Control
                  type="password"
                  placeholder="password"
                  onChange={(e: any) => setPassword(e.currentTarget.value)}
                  isInvalid={errorMessage !== ''}
                />
                <Form.Control.Feedback type="invalid">{errorMessage}</Form.Control.Feedback>
              </Col>
            </Form.Group>
          </Card.Body>
          <Card.Footer className="text-muted">
            <ButtonDiv>
              <Button variant="danger" onClick={() => handleSubmit(wallet.id)} disabled={password === ''}>
                {t('common.confirm')}
              </Button>
              <Button
                variant="light"
                onClick={() =>
                  dispatch({
                    type: MainActions.SetDialog,
                    payload: {
                      open: false,
                    },
                  })
                }
              >
                {t('common.cancel')}
              </Button>
            </ButtonDiv>
          </Card.Footer>
        </>
      ) : (
        <div>Wallet not found</div>
      )}
    </Card>
  )
}

export default InputWalletPasswordDialog
