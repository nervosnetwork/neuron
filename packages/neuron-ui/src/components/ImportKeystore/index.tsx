import React, { useState, useCallback, useMemo, useEffect } from 'react'
import { RouteComponentProps } from 'react-router-dom'
import { Stack, DefaultButton, PrimaryButton, TextField } from 'office-ui-fabric-react'
import { useTranslation } from 'react-i18next'
import { showOpenDialog } from 'services/remote'
import { importWalletWithKeystore } from 'states/stateProvider/actionCreators'
import { StateWithDispatch } from 'states/stateProvider/reducer'
import { useGoBack } from 'utils/hooks'
import generateWalletName from 'utils/generateWalletName'
import { ErrorCode, MAX_WALLET_NAME_LENGTH, MAX_PASSWORD_LENGTH } from 'utils/const'

interface KeystoreFields {
  path: string
  name: string | undefined
  password: string
}

const defaultFields: KeystoreFields = {
  path: '',
  name: undefined,
  password: '',
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

  const exsitingNames = useMemo(() => {
    return wallets.map(w => w.name)
  }, [wallets])

  const isNameUsed = useMemo(() => {
    return exsitingNames.includes(fields.name || '')
  }, [exsitingNames, fields.name])

  const onFileClick = useCallback(() => {
    showOpenDialog({
      title: 'import keystore',
      onUpload: (filePaths: string[]) => {
        if (!filePaths || filePaths.length === 0) {
          return
        }
        const filePath = filePaths[0]
        setFields({
          ...fields,
          path: filePath,
        })
      },
    })
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

  return (
    <Stack verticalFill verticalAlign="center" tokens={{ childrenGap: 15 }}>
      <Stack tokens={{ childrenGap: 15 }}>
        {Object.entries(fields).map(([key, value]) => {
          let maxLength: number | undefined
          if (key === 'name') {
            maxLength = MAX_WALLET_NAME_LENGTH
          } else if (key === 'password') {
            maxLength = MAX_PASSWORD_LENGTH
          }
          return (
            <TextField
              key={key}
              onClick={key === 'path' ? onFileClick : undefined}
              label={t(`import-keystore.label.${key}`)}
              placeholder={t(`import-keystore.placeholder.${key}`)}
              type={key === 'password' ? 'password' : 'text'}
              readOnly={key === 'path'}
              maxLength={maxLength}
              value={value}
              validateOnLoad={false}
              onGetErrorMessage={(text?: string) => {
                if (text === '') {
                  return t(`messages.codes.${ErrorCode.FieldRequired}`, { fieldName: `keystore-${key}` })
                }
                if (key === 'name' && isNameUsed) {
                  return t(`messages.codes.${ErrorCode.FieldUsed}`, { fieldName: `name`, fieldValue: text })
                }
                return ''
              }}
              onChange={(_e: React.FormEvent<HTMLInputElement | HTMLTextAreaElement>, newValue?: string) => {
                if (newValue !== undefined) {
                  setFields({
                    ...fields,
                    [key]: newValue,
                  })
                }
              }}
            />
          )
        })}
      </Stack>
      <Stack horizontal horizontalAlign="end" tokens={{ childrenGap: 15 }}>
        <DefaultButton onClick={goBack}>{t('import-keystore.button.back')}</DefaultButton>
        <PrimaryButton
          disabled={loading || !(fields.name && fields.path && fields.password && !isNameUsed)}
          onClick={onSubmit}
        >
          {t('import-keystore.button.submit')}
        </PrimaryButton>
      </Stack>
    </Stack>
  )
}

ImportKeystore.displayName = 'ImportKeystore'
export default ImportKeystore
