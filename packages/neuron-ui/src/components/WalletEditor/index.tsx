import React, { useState } from 'react'
import { RouteComponentProps } from 'react-router-dom'
import { Card, Form, Button, Alert } from 'react-bootstrap'
import { useTranslation } from 'react-i18next'

import { Routes } from '../../utils/const'
import InputWalletPasswordDialog from '../Settings/InputWalletPswDialog'
import { ContentProps } from '../../containers/MainContent'
import InlineInput, { InputProps } from '../../widgets/InlineInput'
import { MainActions } from '../../containers/MainContent/reducer'

export default (props: React.PropsWithoutRef<ContentProps & RouteComponentProps<{ name: string }>>) => {
  const { match } = props
  const { params } = match
  const [t] = useTranslation()

  const [walletName, setWalletName] = useState(params.name)
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [errorMsg, setErrorMsg] = useState('')

  const inputs: InputProps[] = [
    {
      label: t('Wallet Name'),
      value: walletName,
      onChange: e => setWalletName(e.currentTarget.value),
      placeholder: t('Wallet Name'),
      maxLength: 20,
    },
    {
      label: t('Password'),
      value: password,
      onChange: e => setPassword(e.currentTarget.value),
      placeholder: t('Password'),
      inputType: 'password',
    },
    {
      label: t('Confirm Password'),
      value: confirmPassword,
      onChange: e => setConfirmPassword(e.currentTarget.value),
      placeholder: t('Confirm Password'),
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
      props.dispatch({
        type: MainActions.SetDialog,
        payload: (
          <InputWalletPasswordDialog
            walletName={walletName}
            dispatch={props.dispatch}
            handle={() => props.history.push(`${Routes.SettingsWallets}`)}
          />
        ),
      })
    }
  }

  return (
    <Card>
      <Card.Header>{t('Edit Wallet')}</Card.Header>
      {errorMsg ? <Alert variant="warning">{errorMsg}</Alert> : null}
      <Card.Body>
        <Form>
          {inputs.map(inputProps => (
            <InlineInput {...inputProps} key={inputProps.label} />
          ))}
        </Form>
        <Button type="submit" variant="primary" size="lg" block onClick={() => handleSubmit()}>
          {t('Save')}
        </Button>
      </Card.Body>
    </Card>
  )
}
