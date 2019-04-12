import React, { useCallback, useEffect } from 'react'
import { RouteComponentProps } from 'react-router-dom'
import { Button, InputGroup, FormControl } from 'react-bootstrap'
import { useTranslation } from 'react-i18next'

import Screen from '../../widgets/Screen'
import ScreenButtonRow from '../../widgets/ScreenButtonRow'

import { ContentProps } from '../../containers/MainContent'
import { initState } from '../../containers/MainContent/state'
import { MainActions, actionCreators } from '../../containers/MainContent/reducer'

import { Routes } from '../../utils/const'
import { verifyWalletSubmission } from '../../utils/validators'
import { useNeuronWallet } from '../../utils/hooks'

const inptus = [
  { label: 'password', key: 'password', type: 'password' },
  { label: 'confirm-password', key: 'confirmPassword', type: 'password' },
  { label: 'name', key: 'name', type: 'text' },
]

const WalletSubmission = (props: React.PropsWithoutRef<ContentProps & RouteComponentProps>) => {
  const [t] = useTranslation()
  const { messages } = useNeuronWallet()

  const { dispatch, mnemonic, history } = props

  useEffect(() => {
    dispatch({
      type: MainActions.UpdateMnemonic,
      payload: { name: `wallet @${Math.round(Math.random() * 100)}` },
    })
  }, [])

  useEffect(() => {
    const message = messages[messages.length - 1]
    if (message && message.title === 'Wallet Created') {
      dispatch({
        type: MainActions.UpdateMnemonic,
        payload: initState.mnemonic,
      })
      history.push(`${Routes.Prompt}/create-wallet-success?name=${mnemonic.name.replace(/\s/g, '%20')}`)
    }
  }, [messages.length])

  const onChange = useCallback(
    (field: keyof typeof mnemonic) => (e: React.FormEvent<{ value: string }>) => {
      const { value } = e.currentTarget
      dispatch({
        type: MainActions.UpdateMnemonic,
        payload: { [field]: value },
      })
    },
    [],
  )

  const onBack = useCallback(() => {
    history.goBack()
  }, [])

  const onNext = useCallback(
    (params: { name: string; password: string; imported: string }) => () => {
      dispatch(
        actionCreators.importMnemonic({ name: params.name, password: params.password, mnemonic: params.imported }),
      )
    },
    [],
  )

  const message = 'wizard.set-a-strong-password-to-protect-your-wallet'
  type MnemonicKey = keyof typeof mnemonic
  const disableNext = !verifyWalletSubmission(mnemonic)

  return (
    <Screen>
      <div>
        <h1>{t(message)}</h1>
        {inptus.map(input => (
          <InputGroup key={input.key}>
            <InputGroup.Prepend>
              <InputGroup.Text>{t(`wizard.${input.label}`)}</InputGroup.Text>
            </InputGroup.Prepend>
            <FormControl
              type={input.type}
              value={mnemonic[input.key as MnemonicKey]}
              onChange={onChange(input.key as MnemonicKey)}
            />
          </InputGroup>
        ))}
        <ScreenButtonRow>
          <Button role="button" onClick={onBack} onKeyPress={onBack}>
            {t('wizard.back')}
          </Button>
          <Button role="button" onClick={onNext(mnemonic)} onKeyPress={onNext(mnemonic)} disabled={disableNext}>
            {t('wizard.next')}
          </Button>
        </ScreenButtonRow>
      </div>
    </Screen>
  )
}

WalletSubmission.displayName = 'WalletSubmission'

export default WalletSubmission
