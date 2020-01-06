import React, { useState, useCallback, useEffect } from 'react'
import { RouteComponentProps } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { showOpenDialog } from 'services/remote'
import { importWalletWithKeystore } from 'states/stateProvider/actionCreators'
import { StateWithDispatch } from 'states/stateProvider/reducer'
import { useGoBack } from 'utils/hooks'
import generateWalletName from 'utils/generateWalletName'
import TextField from 'widgets/TextField'
import Button from 'widgets/Button'
import Spinner from 'widgets/Spinner'
import { ErrorCode, MAX_WALLET_NAME_LENGTH, MAX_PASSWORD_LENGTH } from 'utils/const'
import styles from './importKeystore.module.scss'

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

const ImportKeystore = (props: React.PropsWithoutRef<StateWithDispatch & RouteComponentProps>) => {
  const [t] = useTranslation()
  const {
    history,
    dispatch,
    settings: { wallets },
  } = props
  const [fields, setFields] = useState(defaultFields)
  const [loading, setLoading] = useState(false)
  const goBack = useGoBack(history)

  useEffect(() => {
    if (fields.name === undefined) {
      const name = generateWalletName(wallets, wallets.length + 1, t)
      setFields({
        ...fields,
        name,
      })
    }
  }, [wallets, fields, setFields, t])

  const onFileClick = useCallback(() => {
    showOpenDialog({
      title: 'import keystore',
    })
      .then(({ filePaths }: { filePaths: string[] }) => {
        const filePath = filePaths[0]
        if (filePath) {
          setFields({
            ...fields,
            path: filePath,
          })
        }
      })
      .catch((err: Error) => console.error(err))
  }, [fields])

  const onSubmit = useCallback(() => {
    if (loading) {
      return
    }
    setLoading(true)
    setTimeout(() => {
      importWalletWithKeystore({
        name: fields.name || '',
        keystorePath: fields.path,
        password: fields.password,
      })(dispatch, history).finally(() => setLoading(false))
    }, 200)
  }, [fields.name, fields.password, fields.path, history, dispatch, loading])

  const onChange = useCallback(
    (e: React.SyntheticEvent<HTMLInputElement>) => {
      const {
        value,
        dataset: { field },
      } = e.target as HTMLInputElement
      if (field !== undefined && value !== undefined) {
        let maxLength: number | undefined
        if (field === 'name') {
          maxLength = MAX_WALLET_NAME_LENGTH
        } else if (field === 'password') {
          maxLength = MAX_PASSWORD_LENGTH
        }
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
    <div className={styles.container}>
      {Object.entries(fields)
        .filter(([key]) => !key.endsWith('Error'))
        .map(([key, value]) => {
          return (
            <>
              <TextField
                key={key}
                field={key}
                onClick={key === 'path' ? onFileClick : undefined}
                label={t(`import-keystore.label.${key}`)}
                placeholder={t(`import-keystore.placeholder.${key}`)}
                type={key === 'password' ? 'password' : 'text'}
                readOnly={key === 'path'}
                value={value}
                error={fields[`${key}Error` as keyof KeystoreFields]}
                onChange={onChange}
              />
            </>
          )
        })}
      <div className={styles.actions}>
        <Button type="cancel" onClick={goBack} label={t('import-keystore.button.back')} />
        <Button
          type="submit"
          onClick={onSubmit}
          label={t('import-keystore.button.submit')}
          disabled={
            loading ||
            !!(
              !fields.name ||
              !fields.path ||
              !fields.password ||
              fields.nameError ||
              fields.passwordError ||
              fields.passwordError
            )
          }
        >
          {loading ? <Spinner /> : (t('import-keystore.button.submit') as string)}
        </Button>
      </div>
    </div>
  )
}

ImportKeystore.displayName = 'ImportKeystore'
export default ImportKeystore
