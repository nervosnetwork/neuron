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
  isSuccessResponse,
  validatePasswordComplexity,
  useDidMount,
  useDialogWrapper,
} from 'utils'
import { MAX_WALLET_NAME_LENGTH, MAX_PASSWORD_LENGTH } from 'utils/const'
import i18n from 'utils/i18n'
import MnemonicInput from 'widgets/MnemonicInput'
import ReplaceDuplicateWalletDialog, { useReplaceDuplicateWallet } from 'components/ReplaceDuplicateWalletDialog'
import Alert from 'widgets/Alert'
import { Loading, SuccessInfo, Error as ErrorIcon } from 'widgets/Icons/icon'
import TextField from 'widgets/TextField'
import { showGlobalAlertDialog, useDispatch } from 'states'
import { importedWalletDialogShown } from 'services/localCache'
import { useInputWords } from './hooks'
import styles from './walletWizard.module.scss'

const createWalletWithMnemonic = (params: Controller.ImportMnemonicParams) => (navigate: NavigateFunction) => {
  return createWallet(params).then(res => {
    if (isSuccessResponse(res)) {
      navigate(RoutePath.Overview)
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
      importedWalletDialogShown.setStatus(res.result.id, true)
      navigate(RoutePath.Overview)
    } else if (res.status > 0) {
      if (res.status === ErrorCode.DuplicateImportWallet) {
        throw res
      }

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
      <img src="icon.png" width="58px" className={styles.logo} alt="logo" />
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

const Mnemonic = ({ state = initState, rootPath = '/wizard/', dispatch }: WizardElementProps) => {
  const { generated, imported } = state
  const navigate = useNavigate()
  const { type = MnemonicAction.Create } = useParams<{ type: MnemonicAction }>()
  const [t] = useTranslation()
  const isCreate = type === MnemonicAction.Create
  const message = {
    [MnemonicAction.Create]: 'wizard.your-wallet-seed-is',
    [MnemonicAction.Verify]: 'wizard.replenish-your-seed',
    [MnemonicAction.Import]: 'wizard.input-your-seed',
  }[type]
  const { inputsWords, onChangeInput, setInputsWords } = useInputWords()
  const [searchParams] = useSearchParams()
  const disableNext =
    (type === MnemonicAction.Import && inputsWords.some(v => !v)) ||
    (type === MnemonicAction.Verify && generated !== inputsWords.join(' '))

  const [step, changeStep] = useState(0)
  const [blankIndexes, setBlankIndexes] = useState<number[]>([])

  useEffect(() => {
    if (type === MnemonicAction.Create) {
      generateMnemonic().then(res => {
        if (isSuccessResponse(res)) {
          dispatch({
            type: 'generated',
            payload: res.result,
          })
          const uniqueRandomArray = new Set<number>()
          while (uniqueRandomArray.size < 3) {
            const randomInt = Math.floor(Math.random() * 12)
            uniqueRandomArray.add(randomInt)
          }
          const nums = [...uniqueRandomArray]
          const list = res.result.split(' ').map((item: string, index: number) => (nums.includes(index) ? '' : item))
          setBlankIndexes(nums)
          setInputsWords(list)
        }
      })
    } else {
      dispatch({
        type: 'imported',
        payload: '',
      })
    }
  }, [dispatch, type, navigate, setBlankIndexes])

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
          showGlobalAlertDialog({
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
      {type === MnemonicAction.Import && <CreateFirstWalletNav />}
      {type === MnemonicAction.Create && (
        <div className={styles.createCommend}>
          <div className={styles.commendItem}>
            <SuccessInfo type="success" />
            {t('wizard.handwritten-recommended')}
          </div>
          <div className={styles.commendItem}>
            <ErrorIcon />
            {t('wizard.do-not-copy')}
          </div>
          <div className={styles.commendItem}>
            <ErrorIcon />
            {t('wizard.do-not-save-scrrenshots')}
          </div>
        </div>
      )}
      {type === MnemonicAction.Verify && <div className={styles.hint}>{t('wizard.input-seed-verify')}</div>}
      <MnemonicInput
        disabled={isCreate}
        words={generated}
        inputsWords={inputsWords}
        onChangeInputWord={onChangeInput}
        blankIndexes={MnemonicAction.Import ? undefined : blankIndexes}
      />
      {type === MnemonicAction.Import && <div className={styles.tips}>{t('wizard.input-seed-first-empty-space')}</div>}
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

  const { onImportingExitingWalletError, dialogProps } = useReplaceDuplicateWallet()

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
          importWalletWithMnemonic(p)(navigate)
            .catch(error => {
              onImportingExitingWalletError(error.message)
            })
            .finally(() => {
              closeDialog()
            })
        }
      }, 0)
    },
    [type, name, password, imported, navigate, disableNext, openDialog, closeDialog]
  )

  return (
    <>
      <form onSubmit={onNext} className={styles.submission}>
        {type === MnemonicAction.Create && (
          <div className={styles.steps}>
            {[0, 1, 2].map(v => (
              <div key={v.toString()} className={`${styles.step} ${styles.activity}`} />
            ))}
          </div>
        )}
        <div className={styles.title}>{t(message)}</div>
        {submissionInputs.map((input, idx) => (
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
              tabIndex={idx}
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
      <ReplaceDuplicateWalletDialog {...dialogProps} />
    </>
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
