import React, { useCallback, useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Container, Button, FormControl, InputGroup } from 'react-bootstrap'

import withWizard, { WizardElementProps, WithWizardState } from 'components/withWizard'
import ScreenButtonRow from 'widgets/ScreenButtonRow'
import { MnemonicAction } from 'utils/const'
import { verifyWalletSubmission } from 'utils/validators'
import { useNeuronWallet } from 'utils/hooks'
import { helpersCall, walletsCall } from 'services/UILayer'

export enum WalletWizardPath {
  Welcome = '/welcome',
  Mnemonic = '/mnemonic',
  Submission = '/submission',
}

const initState: WithWizardState = {
  generated: '',
  imported: '',
  password: '',
  confirmPassword: '',
  name: '',
}

const submissionInputs = [
  { label: 'password', key: 'password', type: 'password' },
  { label: 'confirm-password', key: 'confirmPassword', type: 'password' },
  { label: 'name', key: 'name', type: 'text' },
]

const Welcome = ({ rootPath }: { rootPath: string }) => {
  const [t] = useTranslation()
  const message = 'wizard.create-or-import-your-first-wallet'

  const buttons = useMemo(
    () => [
      { label: 'wizard.create-new-wallet', href: `${rootPath}${WalletWizardPath.Mnemonic}/${MnemonicAction.Create}` },
      { label: 'wizard.import-wallet', href: `${rootPath}${WalletWizardPath.Mnemonic}/${MnemonicAction.Import}` },
    ],
    [rootPath],
  )

  return (
    <div>
      <h1>{t(message)}</h1>
      <ScreenButtonRow>
        {buttons.map(({ label, href }) => (
          <Link key={label} className="btn btn-primary" to={href}>
            {t(label)}
          </Link>
        ))}
      </ScreenButtonRow>
    </div>
  )
}

Welcome.displayName = 'Welcome'

const Mnemonic = ({
  rootPath,
  match: {
    params: { type },
  },
  history,
  state,
  dispatch,
}: WizardElementProps<{ type: string }>) => {
  const { generated, imported } = state
  const [t] = useTranslation()
  const isCreate = type === MnemonicAction.Create
  const message = isCreate ? 'wizard.your-wallet-seed-is' : 'wizard.input-your-seed'
  const disableNext = type === MnemonicAction.Verify && !(generated === imported)

  useEffect(() => {
    if (type === MnemonicAction.Create) {
      helpersCall
        .generateMnemonic()
        .then((res: string) => {
          dispatch({
            type: 'generated',
            payload: res,
          })
        })
        // TODO: Better Error Handle
        .catch(err => console.error(err))
    } else {
      dispatch({
        type: 'imported',
        payload: '',
      })
    }
  }, [dispatch, type])

  const onChange = useCallback(
    e => {
      dispatch({
        type: 'imported',
        payload: e.target.value,
      })
    },
    [dispatch],
  )
  const onNext = useCallback(() => {
    if (isCreate) {
      history.push(`${rootPath}${WalletWizardPath.Mnemonic}/${MnemonicAction.Verify}`)
    } else {
      history.push(`${rootPath}${WalletWizardPath.Submission}/${type === MnemonicAction.Verify ? 'create' : 'import'}`)
    }
  }, [isCreate, history, rootPath, type])

  return (
    <Container>
      <h1>{t(message)}</h1>
      <FormControl
        style={{
          resize: 'none',
        }}
        as="textarea"
        rows="3"
        disabled={isCreate}
        value={isCreate ? generated : imported}
        onChange={onChange}
      />
      <ScreenButtonRow>
        <Button role="button" onClick={history.goBack}>
          {t('wizard.back')}
        </Button>
        <Button role="button" onClick={onNext} disabled={disableNext}>
          {t('wizard.next')}
        </Button>
      </ScreenButtonRow>
    </Container>
  )
}

Mnemonic.displayName = 'Mnemonic'

const Submission = ({
  match: {
    params: { type },
  },
  history,
  state,
  dispatch,
}: WizardElementProps<{ type: string }>) => {
  const {
    settings: { wallets },
  } = useNeuronWallet()
  const { name, password, confirmPassword, imported } = state
  const [t] = useTranslation()
  const message = 'wizard.set-a-strong-password-to-protect-your-wallet'

  useEffect(() => {
    const genName = (baseNum: number = 0): string => {
      const walletName = `wallet ${baseNum}`
      if (wallets.some(wallet => wallet.name === walletName)) {
        return genName(baseNum + 1)
      }
      return walletName
    }
    dispatch({
      type: 'name',
      payload: genName(wallets.length + 1),
    })
    dispatch({
      type: 'password',
      payload: '',
    })
    dispatch({
      type: 'confirmPassword',
      payload: '',
    })
  }, [dispatch, wallets])

  const onChange = useCallback(
    (field: keyof WithWizardState) => {
      return ({ currentTarget: { value } }: React.FormEvent<{ value: string }>) => {
        dispatch({
          type: field,
          payload: value,
        })
      }
    },
    [dispatch],
  )

  const onNext = useCallback(() => {
    const p = {
      name,
      password,
      mnemonic: imported,
    }
    if (type === 'create') {
      walletsCall.create(p)
    } else {
      walletsCall.importMnemonic(p)
    }
  }, [type, name, password, imported])

  const disableNext = !verifyWalletSubmission({ name, password, confirmPassword })

  return (
    <div>
      <h1>{t(message)}</h1>
      {submissionInputs.map(input => (
        <InputGroup key={input.key}>
          <InputGroup.Prepend>
            <InputGroup.Text>{t(`wizard.${input.label}`)}</InputGroup.Text>
          </InputGroup.Prepend>
          <FormControl type={input.type} value={state[input.key]} onChange={onChange(input.key)} />
        </InputGroup>
      ))}
      <ScreenButtonRow>
        <Button role="button" onClick={history.goBack} onKeyPress={history.goBack}>
          {t('wizard.back')}
        </Button>
        <Button role="button" onClick={onNext} disabled={disableNext}>
          {t('wizard.next')}
        </Button>
      </ScreenButtonRow>
    </div>
  )
}

Submission.displayName = 'Submission'

const elements = [
  {
    path: WalletWizardPath.Welcome,
    Component: Welcome,
  },
  {
    path: WalletWizardPath.Mnemonic,
    params: '/:type',
    Component: Mnemonic,
  },
  {
    path: WalletWizardPath.Submission,
    params: '/:type',
    Component: Submission,
  },
]

export default withWizard(elements, initState)
