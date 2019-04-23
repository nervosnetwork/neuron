import React, { useEffect, useMemo } from 'react'
import { RouteComponentProps } from 'react-router-dom'
import { Card, Form, Button, Col, Row } from 'react-bootstrap'
import { useTranslation } from 'react-i18next'

import { ContentProps } from '../../containers/MainContent'
import InlineInput, { InputProps } from '../../widgets/InlineInput'
import { MainActions, actionCreators } from '../../containers/MainContent/reducer'
import { useNeuronWallet } from '../../utils/hooks'
import Dialog from '../../widgets/Dialog'

import { useWalletEditor, useInputs, useAreParamsValid, useToggleDialog } from './hooks'

export default (props: React.PropsWithoutRef<ContentProps & RouteComponentProps<{ id: string }>>) => {
  const { match, dialog, dispatch } = props
  const {
    params: { id },
  } = match
  const [t] = useTranslation()
  const {
    settings: { wallets },
  } = useNeuronWallet()

  const wallet = useMemo(() => wallets.find(w => w.id === id), [id])

  if (!wallet) {
    // TODO: Better error handling
    throw new Error('Wallet not found')
  }

  const editor = useWalletEditor()

  useEffect(() => {
    editor.initiate(wallet.name)
  }, [id])

  const inputs: InputProps[] = useInputs(editor)
  const areParamsValid = useAreParamsValid(editor.name.value, editor.newPassword.value, editor.confirmNewPassword.value)
  const toggleDialog = useToggleDialog(dispatch)

  const handleSubmit = () => {
    dispatch({
      type: MainActions.SetDialog,
      payload: {
        open: true,
      },
    })
  }

  const handleConfirm = () => {
    toggleDialog(false)
    dispatch(
      actionCreators.updateWallet({
        id: wallet.id,
        password: editor.password.value,
        newPassword: editor.newPassword.value,
        name: editor.name.value,
      }),
    )
  }

  return (
    <Card>
      <Card.Header>{t('settings.wallet-manager.edit-wallet.edit-wallet')}</Card.Header>
      <Card.Body>
        <Form>
          {inputs.map(inputProps => (
            <InlineInput {...inputProps} key={inputProps.label} />
          ))}
        </Form>
        <Button type="submit" variant="primary" size="lg" block onClick={handleSubmit} disabled={!areParamsValid}>
          {t('common.save')}
        </Button>
      </Card.Body>
      <Dialog
        open={dialog.open}
        onClick={() => {
          toggleDialog(false)
        }}
      >
        <Card
          onClick={(e: React.SyntheticEvent<HTMLDivElement>) => {
            e.preventDefault()
            e.stopPropagation()
          }}
          style={{
            width: '40%',
          }}
        >
          <>
            <Card.Header>{t('settings.wallet-manager.delete-wallet-title', { name: wallet.name })}</Card.Header>
            <Card.Body>
              <Form.Group as={Row} controlId="formPlaintextPassword">
                <Col>
                  <Form.Control type="password" placeholder="password" onChange={editor.password.onChange} />
                </Col>
              </Form.Group>
            </Card.Body>
            <Card.Footer className="text-muted">
              <Button variant="danger" onClick={handleConfirm} disabled={editor.password.value === ''}>
                {t('common.confirm')}
              </Button>
              <Button variant="light" onClick={() => toggleDialog(false)}>
                {t('common.cancel')}
              </Button>
            </Card.Footer>
          </>
        </Card>
      </Dialog>
    </Card>
  )
}
