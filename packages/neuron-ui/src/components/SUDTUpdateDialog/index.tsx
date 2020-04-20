import React, { useReducer, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import TextField from 'widgets/TextField'
import Button from 'widgets/Button'
import { ErrorCode } from 'utils/const'
import styles from './sUDTUpdateDialog.module.scss'

const MAX_NAME_LENGTH = 16
const MAX_SYMBOL_LENGTH = 8
const MIN_DECIMAL = 0
const MAX_DECIMAL = 32

export interface BasicInfo {
  accountName: string
  accountId: string
  isCKB: boolean
}

export interface TokenInfo extends BasicInfo {
  tokenId: string
  tokenName: string
  symbol: string
  decimal: string
}

export interface SUDTUpdateDialogProps extends TokenInfo {
  onSubmit: (info: Omit<TokenInfo, 'isCKB'>) => Promise<boolean>
  onCancel: () => void
  existingAccountNames: string[]
}

export enum AccountType {
  SUDT = 'sudt',
  CKB = 'ckb',
}

const fields: { key: keyof Omit<TokenInfo, 'accountId' | 'isCKB'>; label: string }[] = [
  { key: 'accountName', label: 'account-name' },
  { key: 'tokenId', label: 'token-id' },
  { key: 'tokenName', label: 'token-name' },
  { key: 'symbol', label: 'symbol' },
  { key: 'decimal', label: 'decimal' },
]

const reducer: React.Reducer<
  Omit<TokenInfo, 'accountId' | 'isCKB'>,
  { type: keyof Omit<TokenInfo, 'accountId'>; payload?: string }
> = (state, action) => {
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
    default: {
      return state
    }
  }
}

const SUDTUpdateDialog = ({
  accountName = '',
  accountId = '',
  tokenName = '',
  symbol = '',
  decimal = '',
  tokenId = '',
  onSubmit,
  onCancel,
  isCKB = false,
  existingAccountNames = [],
}: SUDTUpdateDialogProps) => {
  const [t] = useTranslation()
  const [info, dispatch] = useReducer(reducer, { accountName, tokenId, tokenName, symbol, decimal })

  let accountNameError = ''
  if (info.accountName && info.accountName.length > MAX_NAME_LENGTH) {
    accountNameError = t(`messages.codes.${ErrorCode.FieldTooLong}`, {
      fieldName: 'account-name',
      length: MAX_NAME_LENGTH,
    })
  } else if (existingAccountNames.filter(name => name !== accountName).includes(info.accountName)) {
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

  const isTokenReady = Object.values(info).every(v => v) && Object.values(tokenErrors).every(e => !e)

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

  const onDialogClick = useCallback((e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
    e.stopPropagation()
    e.preventDefault()
  }, [])

  const onConfirm = (e: any) => {
    e.stopPropagation()
    e.preventDefault()

    if (isTokenReady) {
      onSubmit({ ...info, accountName: info.accountName.trim(), tokenName: info.tokenName.trim(), accountId })
    }
  }

  return (
    <div role="presentation" className={styles.container} onClick={onCancel}>
      <div role="presentation" className={styles.dialogContainer} onClick={onDialogClick}>
        <div className={styles.title}>{t('s-udt.update-dialog.update-asset-account')}</div>
        <form onSubmit={onConfirm}>
          {fields.map((field, idx) => {
            const isEditable = isCKB ? field.key === 'accountName' : field.key !== 'tokenId'

            return (
              <TextField
                key={field.key}
                label={t(`s-udt.update-dialog.${field.label}`)}
                onChange={onInput}
                field={field.key}
                value={info[field.key]}
                required={isEditable}
                disabled={!isEditable}
                autoFocus={!idx}
                error={tokenErrors[field.key]}
                className={isCKB || field.key === 'tokenId' ? styles.immutable : undefined}
              />
            )
          })}
          <div className={styles.footer}>
            <Button type="cancel" label={t('s-udt.update-dialog.cancel')} onClick={onCancel} />
            <Button
              type="submit"
              label={t('s-udt.update-dialog.confirm')}
              onClick={onConfirm}
              disabled={!isTokenReady}
            />
          </div>
        </form>
      </div>
    </div>
  )
}

SUDTUpdateDialog.displayName = 'SUDTUpdateDialog'

export default SUDTUpdateDialog
