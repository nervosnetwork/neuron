import React, { useCallback, useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Label, PrimaryButton, DefaultButton, TextField, Stack, FontSizes } from 'office-ui-fabric-react'

import withWizard, { WizardElementProps, WithWizardState } from 'components/withWizard'

import { MnemonicAction } from 'utils/const'
import { verifyWalletSubmission } from 'utils/validators'
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
  { label: 'name', key: 'name', type: 'text' },
  { label: 'password', key: 'password', type: 'password', hint: 'wizard.set-a-strong-password-to-protect-your-wallet' },
  { label: 'confirm-password', key: 'confirmPassword', type: 'password' },
]

const Welcome = ({ rootPath = '/wizard' }: { rootPath: string }) => {
  const [t] = useTranslation()
  const message = 'wizard.create-or-import-your-first-wallet'

  const buttons = useMemo(
    () => [
      { label: 'wizard.create-new-wallet', href: `${rootPath}${WalletWizardPath.Mnemonic}/${MnemonicAction.Create}` },
      { label: 'wizard.import-wallet', href: `${rootPath}${WalletWizardPath.Mnemonic}/${MnemonicAction.Import}` },
    ],
    [rootPath]
  )

  return (
    <Stack tokens={{ childrenGap: 15 }}>
      <h1>{t(message)}</h1>
      <Stack horizontal horizontalAlign="start" tokens={{ childrenGap: 20 }}>
        {buttons.map(({ label, href }) => (
          <Link key={label} className="btn btn-primary" to={href}>
            {t(label)}
          </Link>
        ))}
      </Stack>
    </Stack>
  )
}

Welcome.displayName = 'Welcome'

const Mnemonic = ({
  state = initState,
  rootPath = '/wizard',
  match: {
    params: { type = MnemonicAction.Create },
  },
  history,
  dispatch,
}: WizardElementProps<{ type: string }>) => {
  const { generated, imported } = state
  const [t] = useTranslation()
  const isCreate = type === MnemonicAction.Create
  const message = isCreate ? 'wizard.your-wallet-seed-is' : 'wizard.input-your-seed'
  const hint = isCreate ? 'wizard.write-down-seed' : ''
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
        .catch(err => {
          console.error(err)
          history.goBack()
        })
    } else {
      dispatch({
        type: 'imported',
        payload: '',
      })
    }
  }, [dispatch, type, history])

  const onChange = useCallback(
    (_e: React.FormEvent<HTMLInputElement | HTMLTextAreaElement>, value?: string) => {
      if (undefined !== value) {
        dispatch({
          type: 'imported',
          payload: value,
        })
      }
    },
    [dispatch]
  )
  const onNext = useCallback(() => {
    if (isCreate) {
      history.push(`${rootPath}${WalletWizardPath.Mnemonic}/${MnemonicAction.Verify}`)
    } else {
      history.push(
        `${rootPath}${WalletWizardPath.Submission}/${
          type === MnemonicAction.Verify ? MnemonicAction.Create : MnemonicAction.Import
        }`
      )
    }
  }, [isCreate, history, rootPath, type])

  return (
    <Stack tokens={{ childrenGap: 15 }}>
      <h1>{t(message)}</h1>
      <TextField
        multiline
        resizable={false}
        rows={3}
        readOnly={isCreate}
        value={isCreate ? generated : imported}
        onChange={onChange}
        description={t(hint)}
        style={{ fontSize: FontSizes.xLarge }}
      />
      <Stack horizontal horizontalAlign="end" tokens={{ childrenGap: 20 }}>
        <DefaultButton onClick={history.goBack} text={t('wizard.back')} />
        <PrimaryButton onClick={onNext} disabled={disableNext} text={t('wizard.next')} />
      </Stack>
    </Stack>
  )
}

Mnemonic.displayName = 'Mnemonic'

const Submission = ({
  state = initState,
  wallets = [],
  match: {
    params: { type = MnemonicAction.Create },
  },
  history,
  dispatch,
}: WizardElementProps<{ type: string }>) => {
  const { name, password, confirmPassword, imported } = state
  const [t] = useTranslation()
  const message = 'wizard.set-wallet-name-and-password'

  useEffect(() => {
    const genName = (baseNum: number = 0): string => {
      const walletName = t('wizard.wallet-suffix', { suffix: baseNum })
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
  }, [dispatch, wallets, t])

  const onChange = useCallback(
    (field: keyof WithWizardState) => {
      return (_e: React.FormEvent<HTMLInputElement | HTMLTextAreaElement>, value?: string) => {
        if (undefined !== value) {
          dispatch({
            type: field,
            payload: value,
          })
        }
      }
    },
    [dispatch]
  )

  const onNext = useCallback(() => {
    const p = {
      name,
      password,
      mnemonic: imported,
    }
    if (type === MnemonicAction.Create) {
      walletsCall.create(p)
    } else {
      walletsCall.importMnemonic(p)
    }
  }, [type, name, password, imported])

  const disableNext = !verifyWalletSubmission({ name, password, confirmPassword })

  return (
    <Stack tokens={{ childrenGap: 15 }}>
      <h1>{t(message)}</h1>
      {submissionInputs.map(input => (
        <div key={input.key}>
          <Label>{t(`wizard.${input.label}`)}</Label>
          <TextField
            type={input.type}
            value={state[input.key]}
            onChange={onChange(input.key)}
            description={t(input.hint || '')}
          />
        </div>
      ))}

      <Stack horizontal horizontalAlign="start" tokens={{ childrenGap: 20 }}>
        <DefaultButton onClick={history.goBack} text={t('wizard.back')} />
        <PrimaryButton onClick={onNext} disabled={disableNext} text={t('wizard.next')} />
      </Stack>
    </Stack>
  )
}

Submission.displayName = 'Submission'

const elements = [
  {
    path: WalletWizardPath.Welcome,
    comp: Welcome,
  },
  {
    path: WalletWizardPath.Mnemonic,
    params: '/:type',
    comp: Mnemonic,
  },
  {
    path: WalletWizardPath.Submission,
    params: '/:type',
    comp: Submission,
  },
]

export default withWizard(elements, initState)
