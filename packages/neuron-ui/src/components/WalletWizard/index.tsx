import React, { useState, useCallback, useEffect, useMemo } from 'react'
import { Link, useNavigate, useLocation, useParams, NavigateFunction, useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import Button from 'widgets/Button'
import withWizard, { WizardElementProps, WithWizardState } from 'components/withWizard'
import { createWallet, importMnemonic, generateMnemonic, validateMnemonic, showErrorMessage } from 'services/remote'

import {
  generateWalletName,
  RoutePath,
  MnemonicAction,
  ErrorCode,
  CONSTANTS,
  isSuccessResponse,
  validatePasswordComplexity,
  useDidMount,
  useDialogWrapper,
} from 'utils'
import i18n from 'utils/i18n'
import MnemonicInput from 'widgets/MnemonicInput'
import Alert from 'widgets/Alert'
import { Loading } from 'widgets/Icons/icon'
import TextField from 'widgets/TextField'
import { showAlertDialog, useDispatch } from 'states'
import { useInputWords } from './hooks'
import styles from './walletWizard.module.scss'

const { MAX_WALLET_NAME_LENGTH, MAX_PASSWORD_LENGTH } = CONSTANTS

const createWalletWithMnemonic = (params: Controller.ImportMnemonicParams) => (navigate: NavigateFunction) => {
  return createWallet(params).then(res => {
    if (isSuccessResponse(res)) {
      navigate(window.neuron.role === 'main' ? RoutePath.Overview : RoutePath.SettingsWallets)
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

const importWalletWithMnemonic = (params: Controller.ImportMnemonicParams) => (navigate: NavigateFunction) => {
  return importMnemonic(params).then(res => {
    if (isSuccessResponse(res)) {
      navigate(window.neuron.role === 'main' ? RoutePath.Overview : RoutePath.SettingsWallets)
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
  Welcome = 'welcome',
  Mnemonic = 'mnemonic',
  Submission = 'submission',
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
    hint: 'wizard.repeat-password',
    autoFocus: false,
  },
]

export const CreateFirstWalletNav = ({ className }: { className?: string }) => {
  const [t] = useTranslation()
  return (
    <div className={`${styles.hint} ${className || ''}`}>
      <span>{t('wizard.no-wallet')}&nbsp;</span>
      <Link to={`/wizard/${WalletWizardPath.Mnemonic}/${MnemonicAction.Create}`}>{t('wizard.create-wallet')}</Link>
    </div>
  )
}

export const FinishCreateLoading = ({ dialogRef }: { dialogRef: React.LegacyRef<HTMLDialogElement> }) => {
  const [t] = useTranslation()
  return (
    <dialog ref={dialogRef} className={styles.loadingCreateDialog}>
      <Loading />
      {t('wizard.creating-wallet')}
    </dialog>
  )
}

const Welcome = ({ rootPath = '/wizard/', wallets = [], dispatch }: WizardElementProps) => {
  const [t] = useTranslation()
  const navigate = useNavigate()
  const location = useLocation()
  useEffect(() => {
    if (wallets.length) {
      navigate(RoutePath.Overview)
    }
  }, [wallets, navigate])

  useDidMount(() => {
    dispatch({
      type: 'generated',
      payload: '',
    })
  })

  const next = useCallback(
    (link: string) => () => {
      navigate(link)
    },
    [navigate]
  )

  const importHardware = useCallback(() => {
    navigate(RoutePath.ImportHardware)
  }, [location, navigate])

  return (
    <div className={styles.welcome}>
      <img src={`${process.env.PUBLIC_URL}/icon.png`} width="58px" className={styles.logo} alt="logo" />
      <span className={styles.slogan}>{t('wizard.welcome-to-nervos-neuron')}</span>
      <Button
        type="default"
        label={t('wizard.import-mnemonic')}
        onClick={next(`${rootPath}${WalletWizardPath.Mnemonic}/${MnemonicAction.Import}`)}
      >
        <>{t('wizard.import-mnemonic')}</>
      </Button>
      <Button type="default" label={t('wizard.import-keystore')} onClick={next(RoutePath.ImportKeystore)}>
        <>{t('wizard.import-keystore')}</>
      </Button>
      <Button type="default" label={t('wizard.import-hardware-wallet')} onClick={importHardware}>
        <>{t('wizard.import-hardware-wallet')}</>
      </Button>
      <hr data-content={t('common.or')} className={styles.dividingLine} />
      <Button
        type="primary"
        label={t('wizard.create-new-wallet')}
        onClick={next(`${rootPath}${WalletWizardPath.Mnemonic}/${MnemonicAction.Create}`)}
      >
        <>{t('wizard.create-new-wallet')}</>
      </Button>
    </div>
  )
}

Welcome.displayName = 'Welcome'

const typeHits: Record<MnemonicAction, string> = {
  [MnemonicAction.Create]: 'wizard.write-down-seed',
  [MnemonicAction.Verify]: 'wizard.input-seed-verify',
  [MnemonicAction.Import]: '',
}

const Mnemonic = ({ state = initState, rootPath = '/wizard/', dispatch }: WizardElementProps) => {
  const { generated, imported } = state
  const navigate = useNavigate()
  const { type = MnemonicAction.Create } = useParams<{ type: MnemonicAction }>()
  const [t] = useTranslation()
  const isCreate = type === MnemonicAction.Create
  const message = isCreate ? 'wizard.your-wallet-seed-is' : 'wizard.input-your-seed'
  const { inputsWords, onChangeInput, setInputsWords } = useInputWords()
  const [searchParams] = useSearchParams()
  const disableNext =
    (type === MnemonicAction.Import && inputsWords.some(v => !v)) ||
    (type === MnemonicAction.Verify && generated !== inputsWords.join(' '))

  const [step, changeStep] = useState(0)
  useEffect(() => {
    if (type === MnemonicAction.Create) {
      generateMnemonic().then(res => {
        if (isSuccessResponse(res)) {
          dispatch({
            type: 'generated',
            payload: res.result,
          })
          setInputsWords(new Array(12).fill(''))
        }
      })
    } else {
      dispatch({
        type: 'imported',
        payload: '',
      })
    }
  }, [dispatch, type, navigate])

  const globalDispatch = useDispatch()

  const onNext = useCallback(() => {
    if (disableNext) {
      return
    }
    if (isCreate) {
      navigate(`${rootPath}${WalletWizardPath.Mnemonic}/${MnemonicAction.Verify}`)
      changeStep(v => v + 1)
    } else {
      const trimmedMnemonic = inputsWords
        .join(' ')
        .trim()
        .replace(/(\s+|\n+)/g, ' ')
      dispatch({
        type: 'imported',
        payload: trimmedMnemonic,
      })
      validateMnemonic(trimmedMnemonic).then(res => {
        let isMnemonicValid = false
        if (isSuccessResponse(res)) {
          isMnemonicValid = res.result
        }
        if (isMnemonicValid) {
          navigate(
            `${rootPath}${WalletWizardPath.Submission}/${
              type === MnemonicAction.Verify ? MnemonicAction.Create : MnemonicAction.Import
            }`
          )
        } else {
          showAlertDialog({
            show: true,
            title: t('common.verification-failure'),
            message: t(`messages.codes.${ErrorCode.FieldInvalid}`, {
              fieldName: 'mnemonic',
              fieldValue: trimmedMnemonic,
            }),
            type: 'failed',
          })(globalDispatch)
        }
      })
    }
  }, [isCreate, navigate, rootPath, type, imported, t, dispatch, disableNext, inputsWords, globalDispatch])

  const onBack = useCallback(() => {
    changeStep(v => v - 1)
    const isSettings = searchParams.get('isSettings') === '1'
    if (type === MnemonicAction.Create && !isSettings) {
      navigate(`${rootPath}${WalletWizardPath.Welcome}`)
    } else {
      navigate(-1)
    }
  }, [changeStep, type, searchParams])

  return (
    <div className={styles.mnemonic}>
      {type === MnemonicAction.Import || (
        <div className={styles.steps}>
          {[0, 1, 2].map(v => (
            <div key={v.toString()} className={`${styles.step} ${v <= step ? styles.activity : ''}`} />
          ))}
        </div>
      )}
      <div className={styles.text}>{t(message)}</div>
      {type === MnemonicAction.Import ? (
        <CreateFirstWalletNav />
      ) : (
        <div className={styles.hint}>{t(typeHits[type])}</div>
      )}
      <MnemonicInput
        disabled={isCreate}
        words={generated}
        inputsWords={inputsWords}
        onChangeInputWord={onChangeInput}
      />
      <div className={styles.actions}>
        <Button type="submit" label={t('wizard.next')} onClick={onNext} disabled={disableNext} />
        <Button type="text" label={t('wizard.back')} onClick={onBack} />
      </div>
    </div>
  )
}

Mnemonic.displayName = 'Mnemonic'

export const getAlertStatus = (fieldInit: boolean, success: boolean) => {
  if (fieldInit) {
    return success ? 'success' : 'error'
  }
  return 'init'
}

const Submission = ({ state = initState, wallets = [], dispatch }: WizardElementProps) => {
  const { name, password, confirmPassword, imported } = state
  const navigate = useNavigate()
  const { type = MnemonicAction.Create } = useParams<{ type: MnemonicAction }>()
  const [t] = useTranslation()
  const message = 'wizard.set-wallet-name-and-password'

  const isNameUnused = useMemo(() => name && !wallets.find(w => w.name === name), [name, wallets])
  const isPwdComplex = useMemo(() => {
    try {
      return validatePasswordComplexity(password)
    } catch {
      return false
    }
  }, [password])
  const isPwdSame = useMemo(() => password && password === confirmPassword, [password, confirmPassword])
  const disableNext = !(isNameUnused && isPwdComplex && isPwdSame)

  useEffect(() => {
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
  }, [dispatch, wallets, t])

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

  const { dialogRef, openDialog, closeDialog } = useDialogWrapper()
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
      openDialog()
      setTimeout(() => {
        if (type === MnemonicAction.Create) {
          createWalletWithMnemonic(p)(navigate).finally(() => closeDialog())
        } else {
          importWalletWithMnemonic(p)(navigate).finally(() => closeDialog())
        }
      }, 0)
    },
    [type, name, password, imported, navigate, disableNext, openDialog, closeDialog]
  )

  return (
    <form onSubmit={onNext} className={styles.submission}>
      {type === MnemonicAction.Create && (
        <div className={styles.steps}>
          {[0, 1, 2].map(v => (
            <div key={v.toString()} className={`${styles.step} ${styles.activity}`} />
          ))}
        </div>
      )}
      <div className={styles.title}>{t(message)}</div>
      {submissionInputs.map(input => (
        <div
          key={input.key}
          className={styles.input}
          data-chars={input.type === 'password' ? `${state[input.key].length}/${MAX_PASSWORD_LENGTH}` : ''}
        >
          <TextField
            data-field={input.key}
            type={input.type as 'password' | 'text'}
            value={state[input.key]}
            onChange={onChange}
            maxLength={input.maxLength}
            placeholder={input.hint ? t(input.hint) : undefined}
            required
          />
        </div>
      ))}
      <div className={styles.inputNotice}>
        <Alert status={getAlertStatus(!!state.name, !!isNameUnused)}>
          <span>{t('wizard.new-name')}</span>
        </Alert>
        <Alert status={getAlertStatus(!!state.password, !!isPwdComplex)}>
          <span>{t('wizard.complex-password')}</span>
        </Alert>
        <Alert status={getAlertStatus(!!state.confirmPassword, !!isPwdSame)}>
          <span>{t('wizard.same-password')}</span>
        </Alert>
      </div>
      <div className={`${styles.actions} ${styles.createWallet}`}>
        <Button type="submit" label={t('wizard.finish-create')} disabled={disableNext}>
          {t('wizard.finish-create') as string}
        </Button>
        <Button type="text" onClick={() => navigate(-1)} label={t('wizard.back')} />
      </div>
      <FinishCreateLoading dialogRef={dialogRef} />
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
