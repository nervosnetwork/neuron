import React, { useState, useReducer, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { ChoiceGroup, IChoiceGroupOption } from 'office-ui-fabric-react'
import TextField from 'widgets/TextField'
import Button from 'widgets/Button'
import { useSUDTAccountInfoErrors } from 'utils/hooks'
import { DEFAULT_SUDT_FIELDS } from 'utils/const'
import styles from './sUDTCreateDialog.module.scss'

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
  existingTokenInfos: Omit<TokenInfo, 'accountName'>[]
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

// TODO: reuse in update dialog
const reducer: React.Reducer<
  TokenInfo,
  | { type: keyof TokenInfo | 'isCKB' | 'resetToken'; payload?: string }
  | { type: 'import'; payload: Omit<TokenInfo, 'accountName'> }
> = (state, action) => {
  switch (action.type) {
    case 'tokenId': {
      return { ...state, tokenId: (action.payload ?? state.tokenId).trim().toLowerCase() }
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
      return {
        accountName: state.accountName,
        tokenId: DEFAULT_SUDT_FIELDS.CKBTokenId,
        tokenName: DEFAULT_SUDT_FIELDS.CKBTokenName,
        symbol: DEFAULT_SUDT_FIELDS.CKBSymbol,
        decimal: DEFAULT_SUDT_FIELDS.CKBDecimal,
      }
    }
    case 'import': {
      return {
        ...state,
        ...action.payload,
      }
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
  existingTokenInfos = [],
}: Partial<Omit<SUDTCreateDialogProps, 'onSubmit' | 'onCancel'>> &
  Pick<SUDTCreateDialogProps, 'onSubmit' | 'onCancel'>) => {
  const [t] = useTranslation()
  const [info, dispatch] = useReducer(reducer, { accountName, tokenId, tokenName, symbol, decimal })
  const [accountType, setAccountType] = useState(AccountType.SUDT)
  const [step, setStep] = useState(DialogSection.Account)

  const tokenInfoFields: (keyof TokenInfo)[] = ['tokenId', 'tokenName', 'symbol', 'decimal']

  const tokenErrors = useSUDTAccountInfoErrors({
    info,
    isCKB: AccountType.CKB === accountType,
    existingAccountNames,
    t,
  })
  const isAccountNameReady = info.accountName.trim() && !tokenErrors.accountName

  const isTokenReady =
    isAccountNameReady && Object.values(info).every(v => v.trim()) && Object.values(tokenErrors).every(e => !e)

  const onInput = useCallback(
    e => {
      const {
        value: payload,
        dataset: { field: type },
      } = e.target
      const existingTokenInfo = existingTokenInfos.find(ti => payload === ti.tokenId)
      if (type === 'tokenId' && existingTokenInfo) {
        dispatch({ type: 'import', payload: existingTokenInfo })
      } else {
        dispatch({ type, payload })
      }
    },
    [dispatch, existingTokenInfos]
  )

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
        if (isAccountNameReady) {
          if (accountType === AccountType.CKB) {
            dispatch({ type: 'isCKB' })
          }
          setStep(s => s + 1)
        }
        break
      }
      case DialogSection.Token: {
        if (isTokenReady) {
          onSubmit({ ...info, accountName: info.accountName.trim(), tokenName: info.tokenName.trim() })
        }
        break
      }
      default: {
        // ignore
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
        // ignore
      }
    }
  }

  return (
    <div className={styles.container}>
      {step === 0 ? (
        <div className={styles.dialogContainer}>
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
                    <span className="ms-ChoiceFieldLabel">
                      {text}
                      <span className={styles.capacityRequired}>
                        {t(
                          `s-udt.create-dialog.${AccountType.CKB === accType.key ? 'occupy-61-ckb' : 'occupy-142-ckb'}`
                        )}
                      </span>
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
        <div className={styles.dialogContainer}>
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
