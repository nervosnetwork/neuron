import React, { useState, useCallback, useEffect } from 'react'
import { useHistory } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import i18n from 'i18next'
import { importKeystore, showOpenDialogModal, showErrorMessage } from 'services/remote'
import { useState as useGlobalState } from 'states'
import TextField from 'widgets/TextField'
import Button from 'widgets/Button'
import Spinner from 'widgets/Spinner'
import { PasswordIncorrectException } from 'exceptions'
import { generateWalletName, RoutePath, ErrorCode, CONSTANTS, useGoBack, isSuccessResponse } from 'utils'

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
  const history = useHistory()
  const [fields, setFields] = useState(defaultFields)
  const [loading, setLoading] = useState(false)
  const [openingFile, setOpeningFile] = useState(false)
  const goBack = useGoBack(history)

  const disabled =
    loading ||
    !!(
      !fields.name ||
      !fields.path ||
      !fields.password ||
      fields.nameError ||
      fields.passwordError ||
      fields.passwordError
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
          })
        }
      })
      .catch((err: Error) => console.error(err))
      .finally(() => {
        setOpeningFile(false)
      })
  }, [fields])

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault()
      if (loading || disabled) {
        return
      }
      setLoading(true)
      importKeystore({ name: fields.name!, keystorePath: fields.path, password: fields.password })
        .then(res => {
          if (isSuccessResponse(res)) {
            history.push(window.neuron.role === 'main' ? RoutePath.Overview : RoutePath.SettingsWallets)
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
          showErrorMessage(i18n.t(`messages.error`), err.message)
        })
        .finally(() => {
          setLoading(false)
        })
    },
    [fields.name, fields.password, fields.path, history, loading, disabled, setFields, t]
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
      {Object.entries(fields)
        .filter(([key]) => !key.endsWith('Error'))
        .map(([key, value]) => {
          return (
            <>
              <TextField
                key={key}
                field={key}
                onClick={key === 'path' ? handleFileClick : undefined}
                label={t(`import-keystore.label.${key}`)}
                placeholder={t(`import-keystore.placeholder.${key}`)}
                type={key === 'password' ? 'password' : 'text'}
                readOnly={key === 'path'}
                disabled={key === 'path' && openingFile}
                value={value}
                error={fields[`${key}Error` as keyof KeystoreFields]}
                onChange={handleChange}
                required
              />
            </>
          )
        })}
      <div className={styles.actions}>
        <Button type="cancel" onClick={goBack} label={t('import-keystore.button.back')} />
        <Button type="submit" label={t('import-keystore.button.submit')} disabled={disabled}>
          {loading ? <Spinner /> : (t('import-keystore.button.submit') as string)}
        </Button>
      </div>
    </form>
  )
}

ImportKeystore.displayName = 'ImportKeystore'
export default ImportKeystore
