import React, { useState, useReducer, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { ChoiceGroup, IChoiceGroupOption } from 'office-ui-fabric-react'
import TextField from 'widgets/TextField'
import Button from 'widgets/Button'
import { ErrorCode } from 'utils/const'
import styles from './sUDTCreateDialog.module.scss'

const MAX_NAME_LENGTH = 16
const MAX_SYMBOL_LENGTH = 8
const MIN_DECIMAL = 0
const MAX_DECIMAL = 32

export interface BasicInfo {
  accountName: string
}

export interface TokenInfo extends BasicInfo {
  tokenId: string
  tokenName: string
  symbol: string
  decimal: string
}

export interface SUDTCreateDialogProps extends TokenInfo {
  onSubmit: (info: TokenInfo) => Promise<boolean>
  onCancel: () => void
  existingAccountNames: string[]
}

export enum AccountType {
  SUDT = 'sudt',
  CKB = 'ckb',
}

enum DialogSection {
  Account,
  Token,
}

const accountTypes: { key: AccountType; label: string }[] = [
  {
    key: AccountType.SUDT,
    label: 's-udt.create-dialog.sudt-account',
  },
  {
    key: AccountType.CKB,
    label: 's-udt.create-dialog.ckb-account',
  },
]

const fields: { key: keyof TokenInfo; label: string }[] = [
  { key: 'accountName', label: 'account-name' },
  { key: 'tokenId', label: 'token-id' },
  { key: 'tokenName', label: 'token-name' },
  { key: 'symbol', label: 'symbol' },
  { key: 'decimal', label: 'decimal' },
]

const reducer: React.Reducer<TokenInfo, { type: keyof TokenInfo | 'isCKB' | 'resetToken'; payload?: string }> = (
  state,
  action
) => {
  switch (action.type) {
    case 'tokenId': {
      return { ...state, tokenId: (action.payload ?? state.tokenId).trim() }
    }
    case 'accountName': {
      return { ...state, accountName: action.payload ?? state.accountName }
    }
    case 'tokenName': {
      return { ...state, tokenName: action.payload ?? state.tokenName }
    }
    case 'symbol': {
      return { ...state, symbol: (action.payload ?? state.symbol).trim() }
    }
    case 'decimal': {
      if (!Number.isNaN(+action.payload!)) {
        return { ...state, decimal: (action.payload ?? state.decimal).trim() }
      }
      return state
    }
    case 'isCKB': {
      return { accountName: state.accountName, tokenId: 'ckb token id', tokenName: 'CKB', symbol: 'CKB', decimal: '8' }
    }
    case 'resetToken': {
      return { accountName: state.accountName, tokenId: '', tokenName: '', symbol: '', decimal: '' }
    }
    default: {
      return state
    }
  }
}

const SUDTCreateDialog = ({
  accountName = '',
  tokenName = '',
  symbol = '',
  decimal = '',
  tokenId = '',
  onSubmit,
  onCancel,
  existingAccountNames = [],
}: SUDTCreateDialogProps) => {
  const [t] = useTranslation()
  const [info, dispatch] = useReducer(reducer, { accountName, tokenId, tokenName, symbol, decimal })
  const [accountType, setAccountType] = useState(AccountType.SUDT)
  const [step, setStep] = useState(DialogSection.Account)

  let accountNameError = ''
  if (info.accountName && info.accountName.length > MAX_NAME_LENGTH) {
    accountNameError = t(`messages.codes.${ErrorCode.FieldTooLong}`, {
      fieldName: 'account-name',
      length: MAX_NAME_LENGTH,
    })
  } else if (existingAccountNames.includes(info.accountName)) {
    accountNameError = t(`messages.codes.${ErrorCode.FieldUsed}`, { fieldName: 'account-name' })
  }

  const tokenErrors = {
    accountName: accountNameError,
    tokenId: '',
    tokenName:
      !info.tokenName || info.tokenName.length <= MAX_NAME_LENGTH
        ? ''
        : t(`messages.codes.${ErrorCode.FieldTooLong}`, { fieldName: 'token-name', length: MAX_NAME_LENGTH }),
    symbol:
      !info.symbol || info.symbol.length <= MAX_SYMBOL_LENGTH
        ? ''
        : t(`messages.codes.${ErrorCode.FieldTooLong}`, { fieldName: 'symbol', length: MAX_SYMBOL_LENGTH }),
    decimal:
      !info.decimal || (+info.decimal >= 0 && +info.decimal <= 32 && Math.floor(+info.decimal) === +info.decimal)
        ? ''
        : t('messages.decimal-range', { range: `${MIN_DECIMAL}-${MAX_DECIMAL}` }),
  }

  const isAccountNameReady = info.accountName && !tokenErrors.accountName

  const isTokenReady =
    isAccountNameReady && Object.values(info).every(v => v) && Object.values(tokenErrors).every(e => !e)

  const tokenInfoFields: (keyof TokenInfo)[] = ['tokenId', 'tokenName', 'symbol', 'decimal']

  const onInput = useCallback(
    e => {
      const {
        value: payload,
        dataset: { field: type },
      } = e.target
      dispatch({ type, payload })
    },
    [dispatch]
  )

  const onDismiss = useCallback(() => {
    onCancel()
  }, [onCancel])

  const onDialogClick = useCallback((e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
    e.stopPropagation()
    e.preventDefault()
  }, [])

  const onAccountTypeSelect = useCallback(
    (_, option?: IChoiceGroupOption) => {
      if (option) {
        setAccountType(option.key as AccountType)
      }
    },
    [setAccountType]
  )

  const onNext = (e: any) => {
    e.stopPropagation()
    e.preventDefault()
    switch (step) {
      case DialogSection.Account: {
        if (!isAccountNameReady) {
          break
        }
        if (accountType === AccountType.CKB) {
          dispatch({ type: 'isCKB' })
        }
        setStep(s => s + 1)
        break
      }
      case DialogSection.Token: {
        if (!isTokenReady) {
          break
        }
        onSubmit({ ...info, accountName: info.accountName.trim(), tokenName: info.tokenName.trim() })
        break
      }
      default: {
        break
      }
    }
  }

  const onBack = () => {
    switch (step) {
      case DialogSection.Account: {
        onCancel()
        break
      }
      case DialogSection.Token: {
        dispatch({ type: 'resetToken' })
        setStep(s => s - 1)
        break
      }
      default: {
        break
      }
    }
  }

  return (
    <div role="presentation" className={styles.container} onClick={onDismiss}>
      {step === 0 ? (
        <div role="presentation" className={styles.dialogContainer} onClick={onDialogClick}>
          <div className={styles.title}>{t('s-udt.create-dialog.create-asset-account')}</div>
          <form onSubmit={onNext}>
            {fields
              .filter(field => !tokenInfoFields.includes(field.key))
              .map(field => (
                <TextField
                  key={field.key}
                  label={t(`s-udt.create-dialog.${field.label}`)}
                  onChange={onInput}
                  field={field.key}
                  value={info[field.key]}
                  required
                  error={tokenErrors.accountName}
                  autoFocus
                />
              ))}
            <ChoiceGroup
              className={styles.accountTypes}
              options={accountTypes.map(accType => ({
                key: accType.key,
                text: t(accType.label),
                checked: accountType === accType.key,
                onRenderLabel: ({ text }: IChoiceGroupOption) => {
                  return (
                    <span className="ms-ChoiceFieldLabel" style={{ pointerEvents: 'none' }}>
                      {text}
                    </span>
                  )
                },
              }))}
              onChange={onAccountTypeSelect}
            />
            <div className={styles.footer}>
              <Button type="cancel" label={t('s-udt.create-dialog.cancel')} onClick={onBack} />
              <Button
                type="submit"
                label={t('s-udt.create-dialog.next')}
                onClick={onNext}
                disabled={!isAccountNameReady}
              />
            </div>
          </form>
        </div>
      ) : (
        <div role="presentation" className={styles.dialogContainer} onClick={onDialogClick}>
          <div className={styles.title}>{t('s-udt.create-dialog.set-token-info')}</div>
          <form onSubmit={onNext}>
            {fields
              .filter(field => tokenInfoFields.includes(field.key))
              .map((field, idx) => (
                <TextField
                  key={field.key}
                  label={t(`s-udt.create-dialog.${field.label}`)}
                  onChange={onInput}
                  field={field.key}
                  value={info[field.key]}
                  required={accountType === AccountType.SUDT}
                  autoFocus={!idx}
                  disabled={accountType === AccountType.CKB}
                  error={tokenErrors[field.key]}
                  className={accountType === AccountType.CKB ? styles.ckbField : undefined}
                />
              ))}
            <div className={styles.footer}>
              <Button type="cancel" label={t('s-udt.create-dialog.back')} onClick={onBack} />
              <Button
                type="submit"
                label={t('s-udt.create-dialog.confirm')}
                onClick={onNext}
                disabled={!isTokenReady}
              />
            </div>
          </form>
        </div>
      )}
    </div>
  )
}

SUDTCreateDialog.displayName = 'SUDTCreateDialog'

export default SUDTCreateDialog
