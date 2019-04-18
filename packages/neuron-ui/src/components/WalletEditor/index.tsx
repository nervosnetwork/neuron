import React, { useState } from 'react'
import { RouteComponentProps } from 'react-router-dom'
import { Card, Form, Button, Alert } from 'react-bootstrap'
import { useTranslation } from 'react-i18next'

import { ContentProps } from '../../containers/MainContent'
import InlineInput, { InputProps } from '../../widgets/InlineInput'
import { MainActions } from '../../containers/MainContent/reducer'
import { useNeuronWallet } from '../../utils/hooks'

export default (props: React.PropsWithoutRef<ContentProps & RouteComponentProps<{ id: string }>>) => {
  const { match, dispatch } = props
  const { params } = match
  const [t] = useTranslation()
  const {
    settings: { wallets },
  } = useNeuronWallet()

  const myWallet = wallets.find(wallet => wallet.id === params.id)
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [errorMsg, setErrorMsg] = useState('')

  const inputs: InputProps[] = [
    {
      label: t('settings.wallet-manager.edit-wallet.wallet-name'),
      value: myWallet!.name,
      onChange: e => {
        myWallet!.name = e.currentTarget.value
      },
      placeholder: t('settings.wallet-manager.edit-wallet.wallet-name'),
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
    if (!myWallet!.name) {
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
      <Card.Header>{t('settings.wallet-manager.edit-wallet.edit-wallet')}</Card.Header>
      {errorMsg ? <Alert variant="warning">{errorMsg}</Alert> : null}
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
          disabled={password === '' || confirmPassword === '' || password !== confirmPassword}
        >
          {t('common.save')}
        </Button>
      </Card.Body>
    </Card>
  )
}
