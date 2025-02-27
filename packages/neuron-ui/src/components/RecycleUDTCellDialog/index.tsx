import React, { useCallback, useEffect, useState, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useState as useGlobalState } from 'states'
import { sudtValueToAmount, shannonToCKBFormatter } from 'utils/formatters'
import Dialog from 'widgets/Dialog'
import AlertDialog from 'widgets/AlertDialog'
import TextField from 'widgets/TextField'
import { isErrorWithI18n } from 'exceptions'
import { getUDTTokenInfoAndBalance, generateRecycleUDTCellTx, openExternal, sendTx } from 'services/remote'
import {
  UDTType,
  addressToScript,
  isSuccessResponse,
  isMainnet as isMainnetUtil,
  validateAddress,
  errorFormatter,
  getExplorerUrl,
} from 'utils'
import styles from './recycleUDTCellDialog.module.scss'

export interface DataProps {
  address: string
  tokenID: string
  udtType: UDTType
}

type DialogType = 'ready' | 'inProgress' | 'success'

const RecycleUDTCellDialog = ({
  data,
  onClose,
  onConfirm,
}: {
  data: DataProps
  onClose: () => void
  onConfirm?: () => void
}) => {
  const {
    wallet: { id: walletID = '', addresses },
    settings: { networks },
    chain: { networkID },
  } = useGlobalState()
  const [t] = useTranslation()
  const [password, setPassword] = useState('')
  const [passwordError, setPasswordError] = useState('')
  const [receiver, setReceiver] = useState('')
  const [isCurrentWallet, setIsCurrentWallet] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [dialogType, setDialogType] = useState<DialogType>('ready')
  const [txHash, setTxHash] = useState('')
  const [info, setInfo] = useState<Controller.GetUDTTokenInfoAndBalance.Response | null>(null)

  const { address: holder, tokenID, udtType } = data

  const isMainnet = isMainnetUtil(networks, networkID)

  const receiveAddressError = useMemo(() => {
    if (!receiver) {
      return undefined
    }
    try {
      validateAddress(receiver, isMainnet)
    } catch (err) {
      if (isErrorWithI18n(err)) {
        return t(err.message, err.i18n)
      }
    }
    return undefined
  }, [t, receiver, isMainnet])

  useEffect(() => {
    getUDTTokenInfoAndBalance({
      tokenID,
      holder,
      udtType,
    }).then(res => {
      if (isSuccessResponse(res)) {
        setInfo(res.result)
      }
    })
  }, [])

  const onPasswordChange = useCallback(
    (e: React.SyntheticEvent<HTMLInputElement>) => {
      const { value } = e.target as HTMLInputElement
      setPassword(value)
      setPasswordError('')
    },
    [setPassword, setPasswordError]
  )

  const onAddressChange = useCallback(
    (e: React.SyntheticEvent<HTMLInputElement>) => {
      const { value } = e.target as HTMLInputElement
      setReceiver(value)
    },
    [setReceiver]
  )

  const getWalletAddress = useCallback(() => {
    if (addresses.length === 1) {
      return addresses[0].address
    }
    return addresses.find(a => a.type === 0 && a.txCount === 0)?.address ?? ''
  }, [addresses])

  const handleCheckbox = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const { checked } = e.target
      setIsCurrentWallet(checked)

      setReceiver(checked ? getWalletAddress() : '')
    },
    [setIsCurrentWallet, getWalletAddress]
  )

  const onViewDetail = useCallback(() => {
    const explorerUrl = getExplorerUrl(isMainnet)
    openExternal(`${explorerUrl}/transaction/${txHash}`)
  }, [isMainnet, txHash])

  const onSubmit = useCallback(
    (e?: React.FormEvent) => {
      if (e) {
        e.preventDefault()
      }
      if (!password) {
        return
      }
      setIsLoading(true)
      generateRecycleUDTCellTx({
        walletId: walletID,
        tokenID,
        holder,
        receiver: addressToScript(receiver, { isMainnet }).args,
        udtType,
      }).then(txRes => {
        if (!isSuccessResponse(txRes)) {
          setPasswordError(errorFormatter(txRes.message, t))
          setIsLoading(false)
          return
        }
        sendTx({
          walletID,
          tx: txRes.result,
          password,
        }).then(res => {
          if (!isSuccessResponse(res)) {
            setPasswordError(errorFormatter(res.message, t))
            setIsLoading(false)
            return
          }
          setIsLoading(false)
          onConfirm?.()
          setTxHash(res.result)
          setDialogType('success')
        })
      })
    },
    [walletID, password, setPasswordError, setTxHash, holder, t]
  )

  if (dialogType === 'ready' || !info) {
    return (
      <AlertDialog
        show
        message={t('s-udt.recycle-dialog.notation')}
        type="warning"
        onCancel={onClose}
        okText={t('wizard.next')}
        disabled={!info}
        onOk={() => {
          setDialogType('inProgress')
        }}
      />
    )
  }

  if (dialogType === 'success') {
    return (
      <AlertDialog
        show
        message={t('s-udt.recycle-dialog.notation')}
        type="success"
        onCancel={onClose}
        okText={t('s-udt.recycle-dialog.view-details')}
        onOk={onViewDetail}
      />
    )
  }

  return (
    <Dialog
      show
      title={t('s-udt.recycle-dialog.title')}
      onCancel={onClose}
      onConfirm={onSubmit}
      confirmText={t('wizard.next')}
      isLoading={isLoading}
      disabled={!password || !receiver || !!receiveAddressError || isLoading}
      className={styles.dialog}
    >
      <div>
        <div className={styles.tip}>
          <div>
            {t('s-udt.recycle-dialog.destroy')}: {sudtValueToAmount(info.balance, info.decimal)} {info.symbol}
          </div>
          <div>
            {t('s-udt.recycle-dialog.release')} CKB: {shannonToCKBFormatter(info.capacity)}
          </div>
        </div>
        <div className={styles.addressWrap}>
          <label htmlFor="receiver" className={styles.checkboxWrap}>
            <input type="checkbox" id="receiver" onChange={handleCheckbox} checked={isCurrentWallet} />
            <span>{t('s-udt.recycle-dialog.current-wallet')}</span>
          </label>
          <TextField
            className={styles.inputField}
            placeholder={t('s-udt.recycle-dialog.receive-address-placeholder')}
            rows={receiver ? 2 : 1}
            width="100%"
            label={t('s-udt.recycle-dialog.receive-address')}
            value={receiver}
            onChange={onAddressChange}
            autoFocus
            error={receiveAddressError}
            disabled={isCurrentWallet}
          />
        </div>

        <TextField
          className={styles.inputField}
          placeholder={t('password-request.placeholder')}
          width="100%"
          label={t('wizard.password')}
          value={password}
          field="password"
          type="password"
          onChange={onPasswordChange}
          autoFocus
          error={passwordError}
        />
      </div>
    </Dialog>
  )
}

RecycleUDTCellDialog.displayName = 'RecycleUDTCellDialog'

export default RecycleUDTCellDialog
