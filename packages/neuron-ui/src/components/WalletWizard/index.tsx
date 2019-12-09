import React, { useState, useCallback, useEffect, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Stack,
  Icon,
  Text,
  Label,
  Image,
  PrimaryButton,
  DefaultButton,
  TextField,
  FontSizes,
  Spinner,
} from 'office-ui-fabric-react'

import withWizard, { WizardElementProps, WithWizardState } from 'components/withWizard'
import { generateMnemonic, validateMnemonic, showErrorMessage } from 'services/remote'
import { createWalletWithMnemonic, importWalletWithMnemonic } from 'states/stateProvider/actionCreators'

import { Routes, MnemonicAction, ErrorCode, MAX_WALLET_NAME_LENGTH } from 'utils/const'
import { buttonGrommetIconStyles } from 'utils/icons'
import { verifyPasswordComplexity } from 'utils/validators'
import generateWalletName from 'utils/generateWalletName'

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
  {
    label: 'name',
    key: 'name',
    type: 'text',
    hint: 'wizard.set-wallet-name',
    autoFocus: false,
    maxLength: MAX_WALLET_NAME_LENGTH,
  },
  {
    label: 'password',
    key: 'password',
    type: 'password',
    hint: 'wizard.set-a-strong-password-to-protect-your-wallet',
    autoFocus: true,
  },
  {
    label: 'confirm-password',
    key: 'confirmPassword',
    type: 'password',
    autoFocus: false,
  },
]

const Welcome = ({ rootPath = '/wizard', wallets = [], history }: WizardElementProps<{ rootPath: string }>) => {
  const [t] = useTranslation()
  useEffect(() => {
    if (wallets.length) {
      history.push(Routes.Overview)
    }
  }, [wallets, history])

  const next = useCallback(
    (link: string) => () => {
      history.push(link)
    },
    [history]
  )

  return (
    <Stack verticalFill verticalAlign="center" horizontalAlign="center" tokens={{ childrenGap: 50 }}>
      <Stack.Item>
        <Image src={`${process.env.PUBLIC_URL}/icon.png`} width="120px" />
      </Stack.Item>

      <Stack.Item>
        <Text variant="xLargePlus">{t('wizard.welcome-to-nervos-neuron')}</Text>
      </Stack.Item>

      <Stack horizontal horizontalAlign="center" verticalAlign="center" tokens={{ childrenGap: 40 }}>
        <PrimaryButton
          styles={{ root: [{ height: '60px' }] }}
          text={t('wizard.import-mnemonic')}
          onClick={next(`${rootPath}${WalletWizardPath.Mnemonic}/${MnemonicAction.Import}`)}
          iconProps={{ iconName: 'Import', styles: buttonGrommetIconStyles }}
        />
        <span>{t('common.or')}</span>
        <PrimaryButton
          styles={{ root: [{ height: '60px' }] }}
          text={t('wizard.import-keystore')}
          onClick={next(Routes.ImportKeystore)}
          iconProps={{ iconName: 'Keystore', styles: buttonGrommetIconStyles }}
        />
        <span>{t('common.or')}</span>
        <DefaultButton
          styles={{ root: [{ height: '60px' }] }}
          text={t('wizard.create-new-wallet')}
          onClick={next(`${rootPath}${WalletWizardPath.Mnemonic}/${MnemonicAction.Create}`)}
          iconProps={{ iconName: 'Create', styles: buttonGrommetIconStyles }}
        />
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
  const disableNext =
    (type === MnemonicAction.Import && imported === '') || (type === MnemonicAction.Verify && !(generated === imported))

  useEffect(() => {
    if (type === MnemonicAction.Create) {
      generateMnemonic().then(res => {
        // Should always succeed
        if (res.status === 1) {
          dispatch({
            type: 'generated',
            payload: res.result,
          })
        }
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
      const trimmedMnemonic = imported.trim().replace(/(\s+|\n+)/g, ' ')
      dispatch({
        type: 'imported',
        payload: trimmedMnemonic,
      })
      validateMnemonic(trimmedMnemonic).then(res => {
        let isMnemonicValid = false
        if (res.status === 1) {
          isMnemonicValid = res.result
        }
        if (isMnemonicValid) {
          history.push(
            `${rootPath}${WalletWizardPath.Submission}/${
              type === MnemonicAction.Verify ? MnemonicAction.Create : MnemonicAction.Import
            }`
          )
        } else {
          showErrorMessage(
            t(`messages.error`),
            t(`messages.codes.${ErrorCode.FieldInvalid}`, { fieldName: 'mnemonic' })
          )
        }
      })
    }
  }, [isCreate, history, rootPath, type, imported, t, dispatch])

  return (
    <Stack verticalFill verticalAlign="center" horizontalAlign="stretch" tokens={{ childrenGap: 15 }}>
      <Text variant="xLargePlus">{t(message)}</Text>
      <TextField
        autoFocus
        multiline
        resizable={false}
        rows={3}
        readOnly={isCreate}
        value={isCreate ? generated : imported}
        onChange={onChange}
        description={t(hint)}
        styles={{
          field: {
            fontSize: FontSizes.xLarge,
          },
          description: {
            top: '110%',
            left: 0,
            position: 'absolute',
            fontSize: FontSizes.medium,
          },
        }}
      />
      <Stack horizontal horizontalAlign="end" tokens={{ childrenGap: 10 }}>
        <DefaultButton onClick={history.goBack} text={t('wizard.back')} />
        <PrimaryButton type="submit" onClick={onNext} disabled={disableNext} text={t('wizard.next')} />
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
  const [loading, setLoading] = useState(false)
  const message = 'wizard.set-wallet-name-and-password'

  useEffect(() => {
    if (loading) {
      return
    }
    dispatch({
      type: 'name',
      payload: generateWalletName(wallets, wallets.length + 1, t),
    })
    dispatch({
      type: 'password',
      payload: '',
    })
    dispatch({
      type: 'confirmPassword',
      payload: '',
    })
  }, [loading, dispatch, wallets, t])

  const onChange = useCallback(
    (e: any, value?: string) => {
      const { field } = e.target.dataset
      if (undefined !== value) {
        if (['password', 'confirmPassword'].includes(field) && /\s/.test(value)) {
          return
        }
        dispatch({
          type: field,
          payload: value,
        })
      }
    },
    [dispatch]
  )

  const onNext = useCallback(() => {
    if (loading) {
      return
    }
    const p = {
      name,
      password,
      mnemonic: imported,
    }
    setLoading(true)
    setTimeout(() => {
      if (type === MnemonicAction.Create) {
        createWalletWithMnemonic(p)(dispatch, history).finally(() => setLoading(false))
      } else {
        importWalletWithMnemonic(p)(dispatch, history).finally(() => setLoading(false))
      }
    }, 0)
  }, [type, name, password, imported, history, dispatch, loading])

  const isNameUnused = useMemo(() => name && !wallets.find(w => w.name === name), [name, wallets])
  const isPwdComplex = useMemo(() => verifyPasswordComplexity(password) === true, [password])
  const isPwdSame = useMemo(() => password && password === confirmPassword, [password, confirmPassword])
  const disableNext = !(isNameUnused && isPwdComplex && isPwdSame)

  return (
    <Stack verticalFill verticalAlign="center" horizontalAlign="stretch" tokens={{ childrenGap: 15 }}>
      <Text variant="xxLargePlus">{t(message)}</Text>
      {submissionInputs.map(input => (
        <div key={input.key}>
          <Label required>{t(`wizard.${input.label}`)}</Label>
          <TextField
            data-field={input.key}
            autoFocus={input.autoFocus}
            type={input.type}
            value={state[input.key]}
            onChange={onChange}
            description={t(input.hint || '')}
            maxLength={input.maxLength}
          />
        </div>
      ))}

      <Stack>
        <Stack horizontal tokens={{ childrenGap: 3 }}>
          {isNameUnused ? <Icon iconName="Matched" /> : <Icon iconName="Unmatched" />}
          <Text variant="xSmall">{t('wizard.new-name')}</Text>
        </Stack>
        <Stack horizontal tokens={{ childrenGap: 3 }}>
          {isPwdComplex ? <Icon iconName="Matched" /> : <Icon iconName="Unmatched" />}
          <Text variant="xSmall">{t('wizard.complex-password')}</Text>
        </Stack>
        <Stack horizontal tokens={{ childrenGap: 3 }}>
          {isPwdSame ? <Icon iconName="Matched" /> : <Icon iconName="Unmatched" />}
          <Text variant="xSmall">{t('wizard.same-password')}</Text>
        </Stack>
      </Stack>

      <Stack horizontal horizontalAlign="end" tokens={{ childrenGap: 10 }}>
        <DefaultButton onClick={history.goBack} text={t('wizard.back')} />
        {loading ? (
          <PrimaryButton disabled>
            <Spinner />
          </PrimaryButton>
        ) : (
          <PrimaryButton type="submit" onClick={onNext} disabled={disableNext} text={t('wizard.next')} />
        )}
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
