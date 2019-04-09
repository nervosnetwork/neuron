import React, { useState } from 'react'
import { RouteComponentProps } from 'react-router-dom'
import { Card, Form, Button, Alert } from 'react-bootstrap'
import { useTranslation } from 'react-i18next'

import { Routes } from '../../utils/const'
import InputWalletPasswordDialog, { CheckType } from '../Settings/InputWalletPasswordDialog'
import { ContentProps } from '../../containers/MainContent'
import InlineInput, { InputProps } from '../../widgets/InlineInput'
import { MainActions } from '../../containers/MainContent/reducer'
import { Wallet } from '../../contexts/NeuronWallet'
import Dialog from '../../widgets/Dialog'

export default (props: React.PropsWithoutRef<ContentProps & RouteComponentProps<{ wallet: string }>>) => {
  const { match, dialog, dispatch } = props
  const { params } = match
  const [t] = useTranslation()

  const myWallet: Wallet = JSON.parse(params.wallet)
  const [walletName, setWalletName] = useState(myWallet.name)
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [errorMsg, setErrorMsg] = useState('')

  const inputs: InputProps[] = [
    {
      label: t('settings.walletmanger.editwallet.walletname'),
      value: walletName,
      onChange: e => setWalletName(e.currentTarget.value),
      placeholder: t('settings.walletmanger.editwallet.walletname'),
      maxLength: 20,
    },
    {
      label: t('settings.walletmanger.editwallet.password'),
      value: password,
      onChange: e => setPassword(e.currentTarget.value),
      placeholder: t('settings.walletmanger.editwallet.password'),
      inputType: 'password',
    },
    {
      label: t('settings.walletmanger.editwallet.confirmpassword'),
      value: confirmPassword,
      onChange: e => setConfirmPassword(e.currentTarget.value),
      placeholder: t('settings.walletmanger.editwallet.confirmpassword'),
      inputType: 'password',
    },
  ]

  const handleSubmit = () => {
    if (!walletName) {
      setErrorMsg('Please Enter Wallet name')
    } else if (!password || !confirmPassword) {
      setErrorMsg('Please Enter password')
    } else if (confirmPassword !== password) {
      setErrorMsg('Password inconsistent')
    } else {
      dispatch({
        type: MainActions.SetDialog,
        payload: {
          open: true,
        },
      })
    }
  }

  return (
    <Card>
      <Card.Header>{t('settings.walletmanger.editwallet.editwallet')}</Card.Header>
      {errorMsg ? <Alert variant="warning">{errorMsg}</Alert> : null}
      <Card.Body>
        <Form>
          {inputs.map(inputProps => (
            <InlineInput {...inputProps} key={inputProps.label} />
          ))}
        </Form>
        <Button type="submit" variant="primary" size="lg" block onClick={() => handleSubmit()}>
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
          handle={() => props.history.push(`${Routes.SettingsWallets}`)}
          newWalletName={walletName}
          newPassword={password}
        />
      </Dialog>
    </Card>
  )
}
