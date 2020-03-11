import React, { useState, useCallback, useEffect, useMemo } from 'react'
import { useHistory, useRouteMatch } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import i18n from 'utils/i18n'
import { Stack, Icon, Text, TextField, FontSizes } from 'office-ui-fabric-react'
import Button from 'widgets/Button'
import CustomTextField from 'widgets/TextField'
import Spinner from 'widgets/Spinner'

import withWizard, { WizardElementProps, WithWizardState } from 'components/withWizard'
import { createWallet, importMnemonic, generateMnemonic, validateMnemonic, showErrorMessage } from 'services/remote'

import { Routes, MnemonicAction, ErrorCode, MAX_WALLET_NAME_LENGTH, MAX_PASSWORD_LENGTH } from 'utils/const'
import { buttonGrommetIconStyles } from 'utils/icons'
import { verifyPasswordComplexity } from 'utils/validators'
import generateWalletName from 'utils/generateWalletName'
import styles from './walletWizard.module.scss'

const createWalletWithMnemonic = (params: Controller.ImportMnemonicParams) => (
  history: ReturnType<typeof useHistory>
) => {
  return createWallet(params).then(res => {
    if (res.status === 1) {
      history.push(Routes.Overview)
    } else if (res.status > 0) {
      showErrorMessage(i18n.t(`messages.error`), i18n.t(`messages.codes.${res.status}`))
    } else if (res.message) {
      const msg = typeof res.message === 'string' ? res.message : res.message.content || ''
      if (msg) {
        showErrorMessage(i18n.t(`messages.error`), msg)
      }
    }
  })
}

const importWalletWithMnemonic = (params: Controller.ImportMnemonicParams) => (
  history: ReturnType<typeof useHistory>
) => {
  return importMnemonic(params).then(res => {
    if (res.status === 1) {
      history.push(Routes.Overview)
    } else if (res.status > 0) {
      showErrorMessage(i18n.t(`messages.error`), i18n.t(`messages.codes.${res.status}`))
    } else if (res.message) {
      const msg = typeof res.message === 'string' ? res.message : res.message.content || ''
      if (msg) {
        showErrorMessage(i18n.t(`messages.error`), msg)
      }
    }
  })
}

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

const Welcome = ({ rootPath = '/wizard', wallets = [] }: WizardElementProps) => {
  const [t] = useTranslation()
  const history = useHistory()
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
    <div className={styles.welcome}>
      <img src={`${process.env.PUBLIC_URL}/icon.png`} width="120px" className={styles.logo} alt="logo" />
      <span className={styles.slogan}>{t('wizard.welcome-to-nervos-neuron')}</span>
      <div className={styles.actions}>
        <Button
          type="primary"
          label={t('wizard.import-mnemonic')}
          onClick={next(`${rootPath}${WalletWizardPath.Mnemonic}/${MnemonicAction.Import}`)}
        >
          <>
            <Icon iconName="Import" styles={buttonGrommetIconStyles} />
            {t('wizard.import-mnemonic')}
          </>
        </Button>
        <span>{t('common.or')}</span>
        <Button type="primary" label={t('wizard.import-keystore')} onClick={next(Routes.ImportKeystore)}>
          <>
            <Icon iconName="Keystore" styles={buttonGrommetIconStyles} />
            {t('wizard.import-keystore')}
          </>
        </Button>
        <span>{t('common.or')}</span>
        <Button
          type="default"
          label={t('wizard.create-new-wallet')}
          onClick={next(`${rootPath}${WalletWizardPath.Mnemonic}/${MnemonicAction.Create}`)}
        >
          <>
            <Icon iconName="Create" styles={buttonGrommetIconStyles} />
            {t('wizard.create-new-wallet')}
          </>
        </Button>
      </div>
    </div>
  )
}

Welcome.displayName = 'Welcome'

const Mnemonic = ({ state = initState, rootPath = '/wizard', dispatch }: WizardElementProps) => {
  const { generated, imported } = state
  const history = useHistory()
  const {
    params: { type = MnemonicAction.Create },
  } = useRouteMatch<{ type: MnemonicAction }>()
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
    if (disableNext) {
      return
    }
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
  }, [isCreate, history, rootPath, type, imported, t, dispatch, disableNext])

  const onKeyPress = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === 'Enter' && !disableNext) {
        e.stopPropagation()
        e.preventDefault()
        onNext()
      }
    },
    [onNext, disableNext]
  )

  return (
    <div className={styles.mnemonic}>
      <Text variant="xLargePlus">{t(message)}</Text>
      <TextField
        autoFocus
        multiline
        resizable={false}
        rows={3}
        readOnly={isCreate}
        value={isCreate ? generated : imported}
        onChange={onChange}
        onKeyPress={onKeyPress}
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
      <div className={styles.actions}>
        <Button type="cancel" label={t('wizard.back')} onClick={history.goBack} />
        <Button type="submit" label={t('wizard.next')} onClick={onNext} disabled={disableNext} />
      </div>
    </div>
  )
}

Mnemonic.displayName = 'Mnemonic'

const Submission = ({ state = initState, wallets = [], dispatch }: WizardElementProps) => {
  const { name, password, confirmPassword, imported } = state
  const history = useHistory()
  const {
    params: { type = MnemonicAction.Create },
  } = useRouteMatch<{ type: MnemonicAction }>()
  const [t] = useTranslation()
  const [loading, setLoading] = useState(false)
  const message = 'wizard.set-wallet-name-and-password'

  const isNameUnused = useMemo(() => name && !wallets.find(w => w.name === name), [name, wallets])
  const isPwdComplex = useMemo(() => verifyPasswordComplexity(password) === true, [password])
  const isPwdSame = useMemo(() => password && password === confirmPassword, [password, confirmPassword])
  const disableNext = !(isNameUnused && isPwdComplex && isPwdSame) || loading

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
    (e: React.SyntheticEvent<HTMLInputElement>) => {
      const {
        value,
        dataset: { field = '' },
      } = e.target as HTMLInputElement
      dispatch({
        type: field,
        payload: value,
      })
    },
    [dispatch]
  )

  const onNext = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault()
      if (disableNext) {
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
          createWalletWithMnemonic(p)(history).finally(() => setLoading(false))
        } else {
          importWalletWithMnemonic(p)(history).finally(() => setLoading(false))
        }
      }, 0)
    },
    [type, name, password, imported, history, disableNext]
  )

  return (
    <form onSubmit={onNext} className={styles.submission}>
      <Text variant="xxLargePlus" styles={{ root: { paddingBottom: '20px' } }}>
        {t(message)}
      </Text>
      {submissionInputs.map(input => (
        <div
          key={input.key}
          className={styles.input}
          data-chars={input.type === 'password' ? `${state[input.key].length}/${MAX_PASSWORD_LENGTH}` : ''}
        >
          <CustomTextField
            label={t(`wizard.${input.label}`)}
            field={input.key}
            autoFocus={input.autoFocus}
            type={input.type as 'password' | 'text'}
            value={state[input.key]}
            onChange={onChange}
            maxLength={input.maxLength}
            hint={input.hint ? t(input.hint) : undefined}
            suffix={input.type === 'password' ? `${state[input.key].length}/${MAX_PASSWORD_LENGTH}` : undefined}
            className={styles.submissionField}
            required
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

      <div className={styles.actions}>
        <Button type="cancel" onClick={history.goBack} label={t('wizard.back')} />
        <Button type="submit" label={loading ? 'loading' : t('wizard.next')} disabled={disableNext}>
          {loading ? <Spinner /> : (t('wizard.next') as string)}
        </Button>
      </div>
    </form>
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
