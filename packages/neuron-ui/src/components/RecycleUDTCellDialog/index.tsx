import React, { useCallback, useEffect, useState, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useState as useGlobalState } from 'states'
import { type CKBComponents } from '@ckb-lumos/lumos/rpc'
import { sudtValueToAmount, shannonToCKBFormatter } from 'utils/formatters'
import Dialog from 'widgets/Dialog'
import AlertDialog from 'widgets/AlertDialog'
import Button from 'widgets/Button'
import TextField from 'widgets/TextField'
import { isErrorWithI18n } from 'exceptions'
import Hardware from 'widgets/Icons/Hardware.png'
import Alert from 'widgets/Alert'
import { useHardWallet, usePassword } from 'components/CellManagement/hooks'
import {
  getUDTTokenInfoAndBalance,
  generateRecycleUDTCellTx,
  openExternal,
  sendTx,
  signAndBroadcastTransaction,
  OfflineSignStatus,
  OfflineSignType,
} from 'services/remote'
import {
  addressToScript,
  isSuccessResponse,
  isMainnet as isMainnetUtil,
  validateAddress,
  errorFormatter,
  getExplorerUrl,
} from 'utils'
import styles from './recycleUDTCellDialog.module.scss'

export interface DataProps {
  lockArgs: string
  tokenID: string
  outpoint?: CKBComponents.OutPoint
}

type DialogType = 'ready' | 'inProgress' | 'verify' | 'success'

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
    wallet,
    settings: { networks },
    chain: { networkID },
  } = useGlobalState()
  const [t] = useTranslation()
  const [receiver, setReceiver] = useState('')
  const [isCurrentWallet, setIsCurrentWallet] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [dialogType, setDialogType] = useState<DialogType>('ready')
  const [txHash, setTxHash] = useState('')
  const [info, setInfo] = useState<Controller.GetUDTTokenInfoAndBalance.Response | null>(null)
  const { id: walletID = '', addresses, device } = wallet
  const { password, error, onPasswordChange, setError } = usePassword()
  const {
    isReconnecting,
    isNotAvailable,
    reconnect,
    verifyDeviceStatus,
    errorMessage: hardwalletError,
    setError: setHardwalletError,
  } = useHardWallet({
    wallet,
    t,
  })

  const { lockArgs: holder, tokenID, outpoint } = data

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
      outpoint,
    }).then(res => {
      if (isSuccessResponse(res)) {
        setInfo(res.result)
      }
    })
  }, [])

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

  const handleVerify = useCallback(async () => {
    await verifyDeviceStatus()
    setDialogType('verify')
  }, [setDialogType])

  const onSubmit = useCallback(
    async (e?: React.FormEvent) => {
      if (e) {
        e.preventDefault()
      }
      setIsLoading(true)

      const errFunc = wallet.device ? setHardwalletError : setError

      const txRes = await generateRecycleUDTCellTx({
        walletId: walletID,
        tokenID,
        holder,
        receiver: addressToScript(receiver, { isMainnet }).args,
        outpoint,
      })
      if (!isSuccessResponse(txRes)) {
        errFunc(errorFormatter(txRes.message, t))
        setIsLoading(false)
        return
      }
      const tx = txRes.result

      const res = await (device
        ? signAndBroadcastTransaction({
            transaction: tx,
            status: OfflineSignStatus.Unsigned,
            type: OfflineSignType.Regular,
            walletID,
            password,
          })
        : sendTx({
            walletID,
            tx: txRes.result,
            password,
          }))
      if (!isSuccessResponse(res)) {
        errFunc(errorFormatter(res.message, t))
        setIsLoading(false)
        return
      }

      setIsLoading(false)
      setTxHash(res.result)
      onConfirm?.()
      setDialogType('success')
    },
    [walletID, password, setError, setTxHash, holder, t, receiver]
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

  if (dialogType === 'verify') {
    return (
      <Dialog
        show
        title={t('s-udt.recycle-dialog.title')}
        onCancel={onClose}
        showFooter={false}
        className={styles.verifyDialog}
      >
        <div>
          <img src={Hardware} alt="hard-wallet" className={styles.hardWalletImg} />
        </div>
        <div className={styles.lockActions}>
          <Button onClick={onClose} type="cancel">
            {t('common.cancel')}
          </Button>
          <Button onClick={isNotAvailable ? reconnect : onSubmit} loading={isLoading || isReconnecting} type="primary">
            {isNotAvailable || isReconnecting ? t('s-udt.recycle-dialog.connect-wallet') : t('cell-manage.verify')}
          </Button>
        </div>
        {hardwalletError ? (
          <Alert status="error" className={styles.hardwalletErr}>
            {hardwalletError}
          </Alert>
        ) : null}
      </Dialog>
    )
  }

  return (
    <Dialog
      show
      title={t('s-udt.recycle-dialog.title')}
      onCancel={onClose}
      onConfirm={device ? handleVerify : onSubmit}
      confirmText={t('wizard.next')}
      isLoading={isLoading}
      disabled={(!password && !device) || !receiver || !!receiveAddressError}
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

        {!device && (
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
            error={error}
          />
        )}
      </div>
    </Dialog>
  )
}

RecycleUDTCellDialog.displayName = 'RecycleUDTCellDialog'

export default RecycleUDTCellDialog
