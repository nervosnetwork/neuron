import React, { useCallback, useEffect, useContext } from 'react'
import { RouteComponentProps } from 'react-router-dom'
import { Button, InputGroup, FormControl } from 'react-bootstrap'
import { useTranslation } from 'react-i18next'

import Screen from '../../widgets/Screen'
import ScreenButtonRow from '../../widgets/ScreenButtonRow'

import WalletContext from '../../contexts/Wallet'
import initState from '../../containers/MainContent/state'
import { ContentProps } from '../../containers/MainContent'
import { MainActions } from '../../containers/MainContent/reducer'

import { verifyWalletSubmission } from '../../utils/validators'
import { Routes } from '../../utils/const'

const inptus = [
  { label: 'password', key: 'password' },
  { label: 'confirm-password', key: 'confirmPassword' },
  { label: 'name', key: 'name' },
]

const WalletSubmission = (props: React.PropsWithoutRef<ContentProps & RouteComponentProps>) => {
  const { address } = useContext(WalletContext)
  const [t] = useTranslation()

  const { dispatch, mnemonic, history } = props
  const { name } = mnemonic

  useEffect(() => {
    dispatch({
      type: MainActions.UpdateMnemonic,
      payload: { name: `wallet @${Math.round(Math.random() * 100)}` },
    })
  }, [])

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
    (walletName: string) => () => {
      dispatch({
        type: MainActions.UpdateMnemonic,
        payload: initState.mnemonic,
      })
      // TODO: send message to neuron-wallet and listen to response
      history.push(`${Routes.Prompt}/create-wallet-success?name=${walletName.replace(/\s/g, '%20')}`)
    },
    [],
  )

  const message = 'wizard.set-a-strong-password-to-protect-your-wallet'
  type MnemonicKey = keyof typeof mnemonic
  const disableNext = !verifyWalletSubmission(mnemonic)

  return (
    <Screen full={!address}>
      <div>
        <h1>{t(message)}</h1>
        {inptus.map(input => (
          <InputGroup key={input.key}>
            <InputGroup.Prepend>
              <InputGroup.Text>{t(`wizard.${input.label}`)}</InputGroup.Text>
            </InputGroup.Prepend>
            <FormControl value={mnemonic[input.key as MnemonicKey]} onChange={onChange(input.key as MnemonicKey)} />
          </InputGroup>
        ))}
        <ScreenButtonRow>
          <Button role="button" onClick={onBack} onKeyPress={onBack}>
            {t('wizard.back')}
          </Button>

          <Button role="button" onClick={onNext(name)} onKeyPress={onNext(name)} disabled={disableNext}>
            {t('wizard.next')}
          </Button>
        </ScreenButtonRow>
      </div>
    </Screen>
  )
}

WalletSubmission.displayName = 'WalletSubmission'
export default WalletSubmission
