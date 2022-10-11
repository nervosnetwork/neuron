import React, { useState, useCallback, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { importKeystore, showOpenDialogModal } from 'services/remote'
import { useState as useGlobalState } from 'states'
import Button from 'widgets/Button'
import { PasswordIncorrectException } from 'exceptions'
import {
  generateWalletName,
  RoutePath,
  ErrorCode,
  CONSTANTS,
  useGoBack,
  isSuccessResponse,
  useDialogWrapper,
} from 'utils'

import { FinishCreateLoading, CreateFirstWalletNav } from 'components/WalletWizard'
import TextField from 'widgets/TextField'
import styles from './importKeystore.module.scss'

const { MAX_WALLET_NAME_LENGTH, MAX_PASSWORD_LENGTH } = CONSTANTS

interface KeystoreFields {
  path: string
  pathError: string
  name: string | undefined
  nameError: ''
  password: string
  passwordError: string
}

const defaultFields: KeystoreFields = {
  path: '',
  pathError: '',
  name: undefined,
  nameError: '',
  password: '',
  passwordError: '',
}

const ImportKeystore = () => {
  const [t] = useTranslation()
  const {
    settings: { wallets },
  } = useGlobalState()
  const navigate = useNavigate()
  const [fields, setFields] = useState(defaultFields)
  const [openingFile, setOpeningFile] = useState(false)
  const goBack = useGoBack()

  const disabled = !!(
    !fields.name ||
    !fields.path ||
    !fields.password ||
    fields.nameError ||
    fields.passwordError ||
    fields.pathError
  )

  useEffect(() => {
    if (fields.name === undefined) {
      const name = generateWalletName(wallets, wallets.length + 1, t)
      setFields({
        ...fields,
        name,
      })
    }
  }, [wallets, fields, setFields, t])

  const handleFileClick = useCallback(() => {
    setOpeningFile(true)
    showOpenDialogModal({
      title: 'import keystore',
    })
      .then(res => {
        if (!isSuccessResponse(res)) {
          console.error(res.message)
          return
        }
        const { filePaths } = res.result!
        const filePath = filePaths[0]
        if (filePath) {
          setFields({
            ...fields,
            path: filePath,
            pathError: '',
          })
        }
      })
      .catch((err: Error) => console.error(err))
      .finally(() => {
        setOpeningFile(false)
      })
  }, [fields])
  const { dialogRef, openDialog, closeDialog } = useDialogWrapper()

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault()
      if (disabled) {
        return
      }
      openDialog()
      importKeystore({ name: fields.name!, keystorePath: fields.path, password: fields.password })
        .then(res => {
          if (isSuccessResponse(res)) {
            navigate(window.neuron.role === 'main' ? RoutePath.Overview : RoutePath.SettingsWallets)
            return
          }

          if (res.status === ErrorCode.PasswordIncorrect) {
            throw new PasswordIncorrectException()
          }

          if (res.message) {
            const msg = typeof res.message === 'string' ? res.message : res.message.content || ''
            if (msg) {
              throw new Error(msg)
            }
          }
        })
        .catch(err => {
          if (err.code === ErrorCode.PasswordIncorrect) {
            setFields(state => ({ ...state, passwordError: t(err.message) }))
            return
          }
          setFields(state => ({ ...state, pathError: err.message }))
        })
        .finally(() => {
          closeDialog()
        })
    },
    [fields.name, fields.password, fields.path, navigate, openDialog, closeDialog, disabled, setFields, t]
  )

  const handleChange = useCallback(
    (e: React.SyntheticEvent<HTMLInputElement>) => {
      const {
        value,
        dataset: { field },
      } = e.target as HTMLInputElement
      if (field !== undefined && value !== undefined) {
        if (value === '') {
          setFields(state => ({
            ...state,
            [field]: value,
            [`${field}Error`]: t(`messages.codes.${ErrorCode.FieldRequired}`, { fieldName: `keystore-${field}` }),
          }))
          return
        }

        if (field === 'name' && wallets.find(w => w.name === value)) {
          setFields(state => ({
            ...state,
            name: value,
            nameError: t(`messages.codes.${ErrorCode.FieldUsed}`, { fieldName: `keystore-name`, fieldValue: '' }),
          }))
          return
        }

        let maxLength: number | undefined

        if (field === 'name') {
          maxLength = MAX_WALLET_NAME_LENGTH
        } else if (field === 'password') {
          maxLength = MAX_PASSWORD_LENGTH
        }

        if (maxLength && value.length > maxLength) {
          setFields(state => ({
            ...state,
            [field]: value,
            [`${field}Error`]: t(`messages.codes.${ErrorCode.FieldTooLong}`, {
              fieldName: `keystore-${field}`,
              fieldValue: '',
              length: maxLength,
            }),
          }))
          return
        }

        setFields(state => ({
          ...state,
          [field]: value,
          [`${field}Error`]: '',
        }))
      }
    },
    [setFields, wallets, t]
  )

  return (
    <form className={styles.container} onSubmit={handleSubmit}>
      <div className={styles.title}>{t('import-keystore.title')}</div>
      <CreateFirstWalletNav />
      {Object.entries(fields)
        .filter(([key]) => !key.endsWith('Error'))
        .map(([key, value]) => {
          return (
            <TextField
              className={styles.field}
              key={key}
              field={key}
              onClick={key === 'path' ? handleFileClick : undefined}
              placeholder={t(`import-keystore.placeholder.${key}`)}
              type={key === 'password' ? 'password' : 'text'}
              readOnly={key === 'path'}
              disabled={key === 'path' && openingFile}
              value={value}
              error={fields[`${key}Error` as keyof KeystoreFields]}
              onChange={handleChange}
              suffix={
                key === 'path' ? (
                  <span
                    onClick={handleFileClick}
                    className={styles.chooseFileSuffix}
                    onKeyDown={() => {}}
                    role="button"
                    tabIndex={-1}
                  >
                    {t('import-keystore.select-file')}
                  </span>
                ) : null
              }
              required
            />
          )
        })}
      <div className={styles.actions}>
        <Button type="submit" label={t('import-keystore.button.submit')} disabled={disabled}>
          {t('import-keystore.button.submit') as string}
        </Button>
        <Button type="text" onClick={goBack} label={t('import-keystore.button.back')} />
      </div>
      <FinishCreateLoading dialogRef={dialogRef} />
    </form>
  )
}

ImportKeystore.displayName = 'ImportKeystore'
export default ImportKeystore
