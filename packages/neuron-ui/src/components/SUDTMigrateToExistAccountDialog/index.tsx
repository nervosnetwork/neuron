import React, { useCallback, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { SpecialAssetCell } from 'components/SpecialAssetList/hooks'
import TextField from 'widgets/TextField'
import Dialog from 'widgets/Dialog'
import {
  AnyoneCanPayLockInfoOnAggron,
  getSUDTAmount,
  getUdtType,
  isSuccessResponse,
  validateSpecificAddress,
} from 'utils'
import InputSelect from 'widgets/InputSelect'
import { generateSudtMigrateAcpTx } from 'services/remote'
import { AppActions, showGlobalAlertDialog, useDispatch } from 'states'
import { isErrorWithI18n } from 'exceptions'
import styles from './sUDTMigrateToExistAccountDialog.module.scss'

const SUDTMigrateToExistAccountDialog = ({
  cell,
  tokenInfo,
  sUDTAccounts,
  isMainnet,
  walletID,
  isLightClient,
  onCloseDialog,
  onBack,
  onSuccess,
}: {
  cell: SpecialAssetCell
  tokenInfo?: Controller.GetTokenInfoList.TokenInfo
  sUDTAccounts: State.SUDTAccount[]
  isMainnet: boolean
  walletID: string
  isLightClient: boolean
  onCloseDialog: () => void
  onBack: () => void
  onSuccess: (text: string) => void
}) => {
  const [t] = useTranslation()
  const [address, setAddress] = useState('')
  const [addressError, setAddressError] = useState('')
  const onAddressChange = useCallback(
    (value: string) => {
      try {
        validateSpecificAddress(value, isMainnet, AnyoneCanPayLockInfoOnAggron.TagName)
        setAddressError('')
      } catch (error) {
        if (isErrorWithI18n(error)) {
          setAddressError(t(error.message, error.i18n))
        }
      }
      setAddress(value)
    },
    [setAddressError, setAddress, isMainnet, t]
  )
  const sUDTAddresses = useMemo(
    () => (tokenInfo ? sUDTAccounts.filter(v => v.tokenId === tokenInfo.tokenID).map(v => v.address) : []),
    [sUDTAccounts, tokenInfo]
  )
  const dispatch = useDispatch()
  const udtType = getUdtType(cell.type)
  const onSubmit = useCallback(() => {
    generateSudtMigrateAcpTx({
      outPoint: cell.outPoint,
      acpAddress: address,
    }).then(res => {
      onCloseDialog()
      if (isSuccessResponse(res)) {
        if (res.result) {
          dispatch({
            type: AppActions.UpdateExperimentalParams,
            payload: {
              tx: res.result,
            },
          })
          dispatch({
            type: AppActions.RequestPassword,
            payload: {
              walletID,
              actionType: 'transfer-to-sudt',
              onSuccess: () => {
                onSuccess(t('special-assets.send-sudt-success', { udtType }))
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
  }, [cell.outPoint, address, t, onCloseDialog, dispatch, walletID])

  return (
    <Dialog
      className={styles.container}
      show
      title={t('migrate-sudt.transfer-to-exist-account.title', { udtType })}
      onCancel={onBack}
      cancelText={t('migrate-sudt.back')}
      confirmText={t('migrate-sudt.next')}
      onConfirm={onSubmit}
      disabled={!address || !!addressError}
    >
      <>
        <div className={styles.addressContainer}>
          <div className={styles.addressLabel}>{t('migrate-sudt.address')}</div>
          <InputSelect
            options={sUDTAddresses.map(v => ({ label: v, value: v }))}
            placeholder={t('sign-and-verify.input-choose-address')}
            onChange={onAddressChange}
            value={address}
            className={styles.addressInputSelect}
            inputDisabled={isLightClient}
            error={addressError}
          />
          {addressError && <div className={styles.error}>{addressError}</div>}
        </div>
        <TextField
          label={t('migrate-sudt.amount')}
          field="amount"
          value={getSUDTAmount({ tokenInfo, data: cell.data }).amount}
          disabled
        />
      </>
    </Dialog>
  )
}

SUDTMigrateToExistAccountDialog.displayName = 'SUDTMigrateToNewAccountDialog'

export default SUDTMigrateToExistAccountDialog
