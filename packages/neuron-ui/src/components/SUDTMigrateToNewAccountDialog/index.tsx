import React, { useCallback, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { SpecialAssetCell } from 'components/SpecialAssetList'
import Button from 'widgets/Button'
import TextField from 'widgets/TextField'
import { getSUDTAmount, isSuccessResponse } from 'utils'
import { generateSudtMigrateAcpTx } from 'services/remote'
import { AppActions, useDispatch } from 'states'
import { useTokenInfo, TokenInfoType } from './hooks'
import styles from './sUDTMigrateToNewAccountDialog.module.scss'

const fields: { key: keyof TokenInfoType; label: string }[] = [
  { key: 'accountName', label: 'account-name' },
  { key: 'tokenId', label: 'token-id' },
  { key: 'tokenName', label: 'token-name' },
  { key: 'symbol', label: 'symbol' },
  { key: 'decimal', label: 'decimal' },
]

const SUDTMigrateToNewAccountDialog = ({
  cell,
  closeDialog,
  tokenInfo: findTokenInfo,
  sUDTAccounts,
  walletID,
}: {
  cell: SpecialAssetCell
  closeDialog: () => void
  tokenInfo?: Controller.GetTokenInfoList.TokenInfo
  sUDTAccounts: State.SUDTAccount[]
  walletID: string
}) => {
  const [t] = useTranslation()
  const dispatch = useDispatch()
  const { tokenInfo, tokenInfoErrors, onChangeTokenInfo } = useTokenInfo({
    tokenInfo: findTokenInfo,
    t,
    tokenId: cell.type?.args,
    sUDTAccounts,
  })
  const confirmDisabled = useMemo(
    () => fields.some(v => tokenInfoErrors[v.key] || !tokenInfo[v.key]),
    [tokenInfoErrors, tokenInfo]
  )
  const sudtAmount = getSUDTAmount({ tokenInfo: findTokenInfo, data: cell.data })
  const onSumbit = useCallback(() => {
    generateSudtMigrateAcpTx({
      outPoint: cell.outPoint,
    }).then(res => {
      closeDialog()
      if (isSuccessResponse(res)) {
        if (res.result) {
          dispatch({
            type: AppActions.UpdateExperimentalParams,
            payload: {
              tx: res.result,
              assetAccount: {
                tokenID: tokenInfo.tokenId,
                symbol: tokenInfo.symbol,
                accountName: tokenInfo.accountName,
                tokenName: tokenInfo.tokenName,
                decimal: tokenInfo.decimal,
                balance: sudtAmount.amountToCopy,
                blake160: res.result.outputs[0].lock.args,
              },
            },
          })
          dispatch({
            type: AppActions.RequestPassword,
            payload: {
              walletID,
              actionType: 'create-sudt-account',
            },
          })
        }
      } else {
        dispatch({
          type: AppActions.AddNotification,
          payload: {
            type: 'alert',
            timestamp: +new Date(),
            content: typeof res.message === 'string' ? res.message : res.message.content!,
          },
        })
      }
    })
  }, [cell, t, closeDialog, walletID, tokenInfo, dispatch, sudtAmount])
  return (
    <div>
      <p>{t('migrate-sudt.turn-into-new-account.title')}</p>
      <div>
        {fields.map(field => (
          <TextField
            key={field.key}
            label={t(`s-udt.create-dialog.${field.label}`)}
            onChange={onChangeTokenInfo}
            field={field.key}
            value={tokenInfo[field.key]}
            required
            error={tokenInfoErrors[field.key]}
            disabled={(!!findTokenInfo && field.key !== 'accountName') || field.key === 'tokenId'}
            autoFocus
          />
        ))}
        <TextField label={t(`migrate-sudt.balance`)} field="balance" value={sudtAmount.amount} required disabled />
      </div>
      <div className={styles.actions}>
        <Button label={t('migrate-sudt.cancel')} type="cancel" onClick={closeDialog} />
        <Button label={t('migrate-sudt.confirm')} type="primary" disabled={confirmDisabled} onClick={onSumbit} />
      </div>
    </div>
  )
}

SUDTMigrateToNewAccountDialog.displayName = 'SUDTMigrateToNewAccountDialog'

export default SUDTMigrateToNewAccountDialog
