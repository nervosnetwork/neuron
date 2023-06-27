import React, { useReducer, useMemo, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { destoryAssetAccount } from 'services/remote'
import { useState as useGlobalState, useDispatch, AppActions } from 'states'
import { isSuccessResponse } from 'utils'
import TextField from 'widgets/TextField'
import Dialog from 'widgets/Dialog'
import Tooltip from 'widgets/Tooltip'
import { ReactComponent as Delete } from 'widgets/Icons/Delete.svg'
import { ReactComponent as ExplorerIcon } from 'widgets/Icons/ExplorerIcon.svg'
import { useSUDTAccountInfoErrors, useOpenSUDTTokenUrl } from 'utils/hooks'
import styles from './sUDTUpdateDialog.module.scss'

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
  isMainnet: boolean
  onSubmit: (info: Omit<TokenInfo, 'isCKB'>) => Promise<boolean>
  onCancel: () => void
  existingAccountNames: string[]
  balance: string
}

const fields: { key: keyof Omit<TokenInfo, 'accountId' | 'isCKB'>; label: string }[] = [
  { key: 'accountName', label: 'account-name' },
  { key: 'tokenName', label: 'token-name' },
  { key: 'symbol', label: 'symbol' },
  { key: 'decimal', label: 'decimal' },
]

const reducer: React.Reducer<
  Omit<TokenInfo, 'accountId' | 'isCKB'>,
  { type: keyof Omit<TokenInfo, 'accountId'>; payload?: string }
> = (state, action) => {
  switch (action.type) {
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
  isMainnet,
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
  balance,
}: SUDTUpdateDialogProps) => {
  const {
    wallet: { id: walletId },
  } = useGlobalState()
  const globalDispatch = useDispatch()
  const [t] = useTranslation()
  const [info, dispatch] = useReducer(reducer, { accountName, tokenId, tokenName, symbol, decimal })

  const tokenErrors = useSUDTAccountInfoErrors({ info, isCKB, existingAccountNames, t })

  const isTokenReady = Object.values(info).every(v => v.trim()) && Object.values(tokenErrors).every(e => !e)

  const onInput = useCallback(
    (e: any) => {
      const {
        value: payload,
        dataset: { field: type },
      } = e.target
      dispatch({ type, payload })
    },
    [dispatch]
  )

  const onConfirm = () => {
    if (isTokenReady) {
      onSubmit({ ...info, accountName: info.accountName.trim(), tokenName: info.tokenName.trim(), accountId })
    }
  }
  const openSUDTTokenUrl = useOpenSUDTTokenUrl(info.tokenId, isMainnet)

  const onDestroy = useCallback(() => {
    destoryAssetAccount({ walletID: walletId, id: accountId! }).then(res => {
      if (isSuccessResponse(res)) {
        const tx = res.result
        globalDispatch({ type: AppActions.UpdateExperimentalParams, payload: { tx } })
        globalDispatch({
          type: AppActions.RequestPassword,
          payload: {
            walletID: walletId,
            actionType: 'destroy-asset-account',
          },
        })
      } else {
        globalDispatch({
          type: AppActions.AddNotification,
          payload: {
            type: 'alert',
            timestamp: +new Date(),
            content: typeof res.message === 'string' ? res.message : res.message.content!,
          },
        })
      }
    })
  }, [globalDispatch, walletId, accountId])

  const showDestory = useMemo(
    () => accountId && (isCKB || BigInt(balance || 0) === BigInt(0)),
    [isCKB, balance, accountId]
  )

  return (
    <Dialog
      show
      title={t('s-udt.update-dialog.update-asset-account')}
      onCancel={onCancel}
      onConfirm={onConfirm}
      disabled={!isTokenReady}
    >
      <div className={styles.container}>
        <p className={styles.label}>{t(`s-udt.update-dialog.token-id`)}</p>
        <div className={styles.tokenId}>
          <p>{tokenId}</p>
          {showDestory ? (
            <Tooltip
              tip={t(isCKB ? 's-udt.send.destroy-ckb-desc' : 's-udt.send.destroy-sudt-desc')}
              type="always-dark"
              placement="left-bottom"
            >
              <button type="button" onClick={onDestroy}>
                <Delete />
              </button>
            </Tooltip>
          ) : null}
        </div>

        <div className={styles.fieldContainer}>
          {fields.map((field, idx) => {
            const isEditable = !isCKB || field.key === 'accountName'

            return (
              <TextField
                key={field.key}
                label={t(`s-udt.update-dialog.${field.label}`)}
                onChange={onInput}
                field={field.key}
                value={info[field.key]}
                disabled={!isEditable}
                autoFocus={!idx}
                error={tokenErrors[field.key]}
                className={styles.fieldItem}
              />
            )
          })}
        </div>
        {!isCKB && !tokenErrors.tokenId && info.tokenId && (
          <button type="button" className={styles.explorerNavButton} onClick={openSUDTTokenUrl}>
            <ExplorerIcon /> {t('history.view-in-explorer-button-title')}
          </button>
        )}
      </div>
    </Dialog>
  )
}

SUDTUpdateDialog.displayName = 'SUDTUpdateDialog'

export default SUDTUpdateDialog
