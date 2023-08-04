import React, { useCallback, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { SpecialAssetCell } from 'components/SpecialAssetList/hooks'
import TextField from 'widgets/TextField'
import Dialog from 'widgets/Dialog'
import { AnyoneCanPayLockInfoOnAggron, getSUDTAmount, isSuccessResponse, validateSpecificAddress } from 'utils'
import InputSelect from 'widgets/InputSelect'
import { generateSudtMigrateAcpTx } from 'services/remote'
import { AppActions, useDispatch } from 'states'
import { isErrorWithI18n } from 'exceptions'
import styles from './sUDTMigrateToExistAccountDialog.module.scss'

const SUDTMigrateToExistAccountDialog = ({
  cell,
  tokenInfo,
  sUDTAccounts,
  isMainnet,
  walletID,
  isLightClient,
  isDialogOpen,
  onCancel,
  onSuccess,
}: {
  cell: SpecialAssetCell
  tokenInfo?: Controller.GetTokenInfoList.TokenInfo
  sUDTAccounts: State.SUDTAccount[]
  isMainnet: boolean
  walletID: string
  isLightClient: boolean
  isDialogOpen: boolean
  onCancel: () => void
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
  const onSubmit = useCallback(() => {
    generateSudtMigrateAcpTx({
      outPoint: cell.outPoint,
      acpAddress: address,
    }).then(res => {
      onCancel()
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
                onSuccess(t('special-assets.send-sudt-success'))
              },
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
  }, [cell.outPoint, address, t, onCancel, dispatch, walletID])

  return (
    <Dialog
      className={styles.container}
      show={isDialogOpen}
      title={t('migrate-sudt.transfer-to-exist-account.title')}
      onCancel={onCancel}
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
