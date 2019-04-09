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
  wallet: Wallet
  dispatch: any
  checkType: CheckType
  handle?: any
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
  handle,
  newWalletName,
  newPassword,
}: InputPasswordProps) => {
  const [errorMsg, setErrorMsg] = useState('')
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
      if (handle) {
        handle(wallet.id, password)
      }
    } else if (args.msg) {
      setErrorMsg(args.msg)
    } else {
      setErrorMsg('Wrong password')
    }
  }

  const handleSubmit = () => {
    if (!password) {
      setErrorMsg('Please enter password')
    }
    switch (checkType) {
      case CheckType.EditWallet:
        if (newWalletName && newPassword) {
          dispatch(
            actionCreators.createOrUpdateWallet(
              {
                id: wallet.id,
                name: newWalletName,
              },
              password,
            ),
          )
        }
        break
      case CheckType.DeleteWallet:
        dispatch(actionCreators.deleteWallet(wallet.id, password))
        break
      case CheckType.CheckPassword:
      default:
        checkPassword(wallet.id, password, handleResult)
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
    </Card>
  )
}

export default InputWalletPasswordDialog
