import React, { useCallback, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { SpecialAssetCell } from 'components/SpecialAssetList/hooks'
import TextField from 'widgets/TextField'
import Dialog from 'widgets/Dialog'
import { getSUDTAmount, getUdtType, isSuccessResponse } from 'utils'
import { generateSudtMigrateAcpTx } from 'services/remote'
import { AppActions, showGlobalAlertDialog, useDispatch } from 'states'
import { useTokenInfo, TokenInfoType } from './hooks'
import styles from './sUDTMigrateToNewAccountDialog.module.scss'

const fields: { key: keyof TokenInfoType; label: string; placeholder: string }[] = [
  { key: 'tokenId', label: 'token-id', placeholder: '' },
  { key: 'balance', label: 'balance', placeholder: '' },
  { key: 'accountName', label: 'account-name', placeholder: 's-udt.create-dialog.input-account-name' },
  { key: 'tokenName', label: 'token-name', placeholder: 'migrate-sudt.input-token' },
  { key: 'symbol', label: 'symbol', placeholder: 'migrate-sudt.input-symbol' },
  { key: 'decimal', label: 'decimal', placeholder: 'migrate-sudt.input-decimal' },
]

const SUDTMigrateToNewAccountDialog = ({
  cell,
  tokenInfo: findTokenInfo,
  sUDTAccounts,
  walletID,
  onCloseDialog,
  onBack,
  onSuccess,
}: {
  cell: SpecialAssetCell
  tokenInfo?: Controller.GetTokenInfoList.TokenInfo
  sUDTAccounts: State.SUDTAccount[]
  walletID: string
  onCloseDialog: () => void
  onBack: () => void
  onSuccess: (text: string) => void
}) => {
  const [t] = useTranslation()
  const dispatch = useDispatch()
  const { tokenInfo, tokenInfoErrors, onChangeTokenInfo } = useTokenInfo({
    tokenInfo: findTokenInfo,
    t,
    tokenId: cell.type?.args,
    sUDTAccounts,
  })
  const udtType = getUdtType(cell.type)

  const confirmDisabled = useMemo(
    () => fields.some(v => (tokenInfoErrors[v.key] || !tokenInfo[v.key]) && v.key !== 'balance'),
    [tokenInfoErrors, tokenInfo]
  )
  const sudtAmount = getSUDTAmount({ tokenInfo: findTokenInfo, data: cell.data })
  const onSubmit = useCallback(() => {
    generateSudtMigrateAcpTx({
      outPoint: cell.outPoint,
    }).then(res => {
      onCloseDialog()
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
                udtType,
              },
            },
          })
          dispatch({
            type: AppActions.RequestPassword,
            payload: {
              walletID,
              actionType: 'create-sudt-account',
              onSuccess: () => {
                onSuccess(t('special-assets.migrate-sudt-success', { udtType }))
              },
            },
          })
        }
      } else {
        showGlobalAlertDialog({
          type: 'failed',
          message: typeof res.message === 'string' ? res.message : res.message.content!,
          action: 'ok',
        })(dispatch)
      }
    })
  }, [cell, t, onCloseDialog, walletID, tokenInfo, dispatch, sudtAmount])

  const renderList = fields.map(field => {
    return field.key === 'balance' ? (
      <TextField
        label={t(`migrate-sudt.balance`)}
        field="balance"
        className={styles.field}
        value={sudtAmount.amount}
        disabled
      />
    ) : (
      <TextField
        key={field.key}
        className={styles.field}
        label={t(`s-udt.create-dialog.${field.label}`)}
        placeholder={t(field.placeholder)}
        onChange={onChangeTokenInfo}
        field={field.key}
        value={tokenInfo[field.key]}
        error={tokenInfoErrors[field.key]}
        disabled={(!!findTokenInfo && field.key !== 'accountName') || field.key === 'tokenId'}
        autoFocus
      />
    )
  })

  return (
    <Dialog
      className={styles.container}
      show
      title={t('migrate-sudt.turn-into-new-account.title', { udtType })}
      onCancel={onBack}
      cancelText={t('migrate-sudt.cancel')}
      confirmText={t('migrate-sudt.confirm')}
      onConfirm={onSubmit}
      disabled={confirmDisabled}
    >
      <div className={styles.filedWrap}>{renderList}</div>
    </Dialog>
  )
}

SUDTMigrateToNewAccountDialog.displayName = 'SUDTMigrateToNewAccountDialog'

export default SUDTMigrateToNewAccountDialog
