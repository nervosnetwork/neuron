import React, { useEffect, useState } from 'react'
import { RouteComponentProps } from 'react-router-dom'
import { Card, Form, Button } from 'react-bootstrap'
import { useTranslation } from 'react-i18next'

import { ContentProps } from '../../containers/MainContent'
import InlineInput, { InputProps } from '../../widgets/InlineInput'
import { MainActions } from '../../containers/MainContent/reducer'
import { useNeuronWallet } from '../../utils/hooks'
import InputWalletPasswordDialog, { CheckType } from '../Settings/InputWalletPasswordDialog'
import Dialog from '../../widgets/Dialog'
import { Routes } from '../../utils/const'

export default (props: React.PropsWithoutRef<ContentProps & RouteComponentProps<{ id: string }>>) => {
  const { match, dialog, dispatch } = props
  const { params } = match
  const [t] = useTranslation()
  const {
    settings: { wallets },
    messages: errorMessages,
  } = useNeuronWallet()

  const myWallet = wallets.find(wallet => wallet.id === params.id)
  const [walletName, setWalletName] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  useEffect(() => {
    if (password !== '') {
      dispatch({
        type: MainActions.SetDialog,
        payload: {
          open: false,
        },
      })
      props.history.push(`${Routes.SettingsWallets}`)
    }
  }, [wallets])

  const inputs: InputProps[] = [
    {
      label: t('settings.wallet-manager.edit-wallet.wallet-name'),
      value: walletName,
      onChange: e => setWalletName(e.currentTarget.value),
      placeholder: myWallet!.name,
      maxLength: 20,
    },
    {
      label: t('settings.wallet-manager.edit-wallet.password'),
      value: password,
      onChange: e => setPassword(e.currentTarget.value),
      placeholder: t('settings.wallet-manager.edit-wallet.password'),
      inputType: 'password',
    },
    {
      label: t('settings.wallet-manager.edit-wallet.confirm-password'),
      value: confirmPassword,
      onChange: e => setConfirmPassword(e.currentTarget.value),
      placeholder: t('settings.wallet-manager.edit-wallet.confirm-password'),
      inputType: 'password',
    },
  ]

  const handleSubmit = () => {
    dispatch({
      type: MainActions.SetDialog,
      payload: {
        open: true,
      },
    })
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
        <Button
          type="submit"
          variant="primary"
          size="lg"
          block
          onClick={() => handleSubmit()}
          disabled={password === '' || confirmPassword === '' || password !== confirmPassword || walletName === ''}
        >
          {t('common.save')}
        </Button>
      </Card.Body>
      <Dialog
        open={dialog.open}
        onClick={() => {
          dispatch({
            type: MainActions.SetDialog,
            payload: {
              open: false,
            },
          })
        }}
      >
        <InputWalletPasswordDialog
          wallet={myWallet}
          dispatch={dispatch}
          checkType={CheckType.EditWallet}
          errorMessage={errorMessages.length > 0 ? errorMessages[errorMessages.length - 1].content : ''}
          newWalletName={walletName}
          newPassword={password}
        />
      </Dialog>
    </Card>
  )
}
