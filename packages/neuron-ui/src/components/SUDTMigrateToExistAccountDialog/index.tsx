import React, { useCallback, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { SpecialAssetCell } from 'components/SpecialAssetList'
import Button from 'widgets/Button'
import TextField from 'widgets/TextField'
import { AnyoneCanPayLockInfoOnAggron, getSUDTAmount, isSuccessResponse, validateSpecificAddress } from 'utils'
import InputSelect from 'widgets/InputSelect'
import { generateSudtMigrateAcpTx } from 'services/remote'
import { AppActions, useDispatch } from 'states'
import { isErrorWithI18n } from 'exceptions'
import styles from './sUDTMigrateToExistAccountDialog.module.scss'

const SUDTMigrateToExistAccountDialog = ({
  cell,
  closeDialog,
  tokenInfo,
  sUDTAccounts,
  isMainnet,
  walletID,
  isLightClient,
}: {
  cell: SpecialAssetCell
  closeDialog: () => void
  tokenInfo?: Controller.GetTokenInfoList.TokenInfo
  sUDTAccounts: State.SUDTAccount[]
  isMainnet: boolean
  walletID: string
  isLightClient: boolean
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
      closeDialog()
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
              actionType: 'send-sudt',
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
  }, [cell.outPoint, address, t, closeDialog, dispatch, walletID])
  return (
    <div>
      <p>{t('migrate-sudt.transfer-to-exist-account.title')}</p>
      <div>
        <div className={styles.addressContainer}>
          <div>{`${t('migrate-sudt.address')} *`}</div>
          <InputSelect
            options={sUDTAddresses.map(v => ({ label: v, value: v }))}
            onChange={onAddressChange}
            value={address}
            className={styles.addressInputSelect}
            inputDisabled={isLightClient}
          />
          {addressError && <div className={styles.error}>{addressError}</div>}
        </div>
        <TextField
          label={t('migrate-sudt.amount')}
          field="amount"
          value={getSUDTAmount({ tokenInfo, data: cell.data }).amount}
          required
          disabled
        />
      </div>
      <div className={styles.actions}>
        <Button label={t('migrate-sudt.cancel')} type="cancel" onClick={closeDialog} />
        <Button
          label={t('migrate-sudt.confirm')}
          type="primary"
          onClick={onSubmit}
          disabled={!address || !!addressError}
        />
      </div>
    </div>
  )
}

SUDTMigrateToExistAccountDialog.displayName = 'SUDTMigrateToNewAccountDialog'

export default SUDTMigrateToExistAccountDialog
