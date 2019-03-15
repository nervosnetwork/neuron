import React, { useState } from 'react'
import { RouteComponentProps } from 'react-router-dom'
import { Card, Form, Button, Alert } from 'react-bootstrap'

import { Routes } from '../../utils/const'
import InputWalletPswDialog from '../Settings/InputWalletPswDialog'
import { ContentProps } from '../../containers/MainContent'
import InlineInput, { InputProps } from '../../widgets/InlineInput'
import { MainActions } from '../../containers/MainContent/reducer'

enum PlaceHolder {
  Name = 'My Wallet',
  Password = 'Password',
  ConfirmPassword = 'ConfirmPassword',
}

export default (props: React.PropsWithoutRef<ContentProps & RouteComponentProps<{ name: string }>>) => {
  const { match } = props
  const { params } = match

  const [walletName, setWalletName] = useState(params.name)
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [errorMsg, setErrorMsg] = useState('')

  const inputs: InputProps[] = [
    {
      label: 'Wallet Name',
      value: walletName,
      onChange: e => setWalletName(e.currentTarget.value),
      placeholder: PlaceHolder.Name,
      maxLength: 20,
    },
    {
      label: 'Password',
      value: password,
      onChange: e => setPassword(e.currentTarget.value),
      placeholder: PlaceHolder.Password,
      inputtype: 'password',
    },
    {
      label: 'ConfirmPassword',
      value: confirmPassword,
      onChange: e => setConfirmPassword(e.currentTarget.value),
      placeholder: PlaceHolder.ConfirmPassword,
      inputtype: 'password',
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
          <InputWalletPswDialog
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
      <Card.Header>Edit Wallet</Card.Header>
      {errorMsg ? <Alert variant="warning">{errorMsg}</Alert> : null}
      <Card.Body>
        <Form>
          {inputs.map(inputProps => (
            <InlineInput {...inputProps} key={inputProps.label} />
          ))}
        </Form>
        <Button type="submit" variant="primary" size="lg" block onClick={() => handleSubmit()}>
          Save
        </Button>
      </Card.Body>
    </Card>
  )
}
