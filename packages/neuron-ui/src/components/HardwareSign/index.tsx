import React, { useCallback, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import Button from 'widgets/Button'
import {
  useState as useGlobalState,
  useDispatch,
  sendTransaction,
  sendCreateSUDTAccountTransaction,
  sendSUDTTransaction,
  AppActions,
} from 'states'
import { useHistory } from 'react-router-dom'
import { ReactComponent as HardWalletIcon } from 'widgets/Icons/HardWallet.svg'
import { connectDevice } from 'services/remote'
import { isSuccessResponse, RoutePath, useDidMount } from 'utils'
import SignError from './error'
import HDWalletSign from './hd-wallet-sign'
import styles from './hardwareSign.module.scss'

export type SignType = 'message' | 'transaction'

export interface HardwareSignProps {
  signType: SignType
  wallet: State.WalletIdentity
  onDismiss: () => void
  signMessage?: (password: string) => Promise<any>
  history?: ReturnType<typeof useHistory>
}

const HardwareSign = ({ signType, signMessage, history, wallet, onDismiss }: HardwareSignProps) => {
  const [t] = useTranslation()
  const dialogRef = useRef<HTMLDialogElement | null>(null)
  const dispatch = useDispatch()
  const onCancel = useCallback(() => {
    if (signType === 'transaction') {
      dispatch({
        type: AppActions.UpdateLoadings,
        payload: { sending: false },
      })
    }
    onDismiss()
  }, [dispatch, signType, onDismiss])
  const connectStatus = t('hardware-sign.status.connect')
  const disconnectStatus = t('hardware-sign.status.disconnect')

  const {
    app: {
      send: { description, generatedTx },
      loadings: { sending: isSending = false },
      passwordRequest: { walletID = '', actionType = null },
    },
    experimental,
  } = useGlobalState()
  const [status, setStatus] = useState('')
  const [error, setError] = useState('')
  const [isSigning, setSigning] = useState(false)

  const productName = `${wallet.device!.manufacturer} ${wallet.device!.product}`

  const signTx = useCallback(async () => {
    try {
      const conectionRes = await connectDevice(wallet.device!)
      if (!isSuccessResponse(conectionRes)) {
        setStatus(disconnectStatus)
        return
      }
      setStatus(connectStatus)

      switch (actionType) {
        case 'send': {
          if (isSending) {
            break
          }
          sendTransaction({ walletID, tx: generatedTx, description })(dispatch).then(res => {
            if (isSuccessResponse(res)) {
              history!.push(RoutePath.History)
            } else {
              setError(res.message)
            }
          })
          break
        }
        case 'unlock': {
          if (isSending) {
            break
          }
          sendTransaction({ walletID, tx: generatedTx, description })(dispatch).then(res => {
            if (isSuccessResponse(res)) {
              history!.push(RoutePath.History)
            } else {
              setError(res.message)
            }
          })
          break
        }
        case 'create-sudt-account': {
          const params: Controller.SendCreateSUDTAccountTransaction.Params = {
            walletID,
            assetAccount: experimental?.assetAccount,
            tx: experimental?.tx,
          }
          sendCreateSUDTAccountTransaction(params)(dispatch).then(res => {
            if (isSuccessResponse(res)) {
              history!.push(RoutePath.History)
            } else {
              setError(res.message)
            }
          })
          break
        }
        case 'send-sudt': {
          const params: Controller.SendSUDTTransaction.Params = {
            walletID,
            tx: experimental?.tx,
          }
          sendSUDTTransaction(params)(dispatch).then(res => {
            if (isSuccessResponse(res)) {
              history!.push(RoutePath.History)
            } else {
              setError(res.message)
            }
          })
          break
        }
        default: {
          break
        }
      }
    } catch (err) {
      setStatus(disconnectStatus)
    }
  }, [
    actionType,
    connectStatus,
    disconnectStatus,
    experimental,
    generatedTx,
    isSending,
    wallet.device,
    walletID,
    description,
    dispatch,
    history,
  ])

  const signMsg = useCallback(async () => {
    const conectionRes = await connectDevice(wallet.device!)
    if (!isSuccessResponse(conectionRes)) {
      setStatus(disconnectStatus)
      return
    }
    setStatus(connectStatus)
    await signMessage?.('')
  }, [connectStatus, wallet.device, disconnectStatus, signMessage])

  const sign = useCallback(async () => {
    setSigning(true)
    try {
      if (signType === 'message') {
        await signMsg()
      } else {
        await signTx()
      }
    } finally {
      setSigning(false)
    }
  }, [signType, signTx, setSigning, signMsg])

  useDidMount(() => {
    // eslint-disable-next-line no-unused-expressions
    dialogRef.current?.showModal()
    sign()
  })

  const dialogClass = `${styles.dialog} ${wallet.isHD ? styles.hd : ''}`

  let container = (
    <div className={styles.container}>
      <header className={styles.title}>{t('hardware-sign.title')}</header>
      <section className={styles.main}>
        <table>
          <tbody>
            <tr>
              <td className={styles.first}>{t('hardware-sign.device')}</td>
              <td>
                <HardWalletIcon />
                <span>{productName}</span>
              </td>
            </tr>
            <tr>
              <td className={styles.first}>{t('hardware-sign.status.label')}</td>
              <td className={status === disconnectStatus ? styles.warning : ''}>{status}</td>
            </tr>
          </tbody>
        </table>
        {wallet.isHD ? <HDWalletSign tx={generatedTx} /> : null}
      </section>
      <footer className={styles.footer}>
        <Button type="cancel" label={t('hardware-sign.cancel')} onClick={onCancel} />
        {status === disconnectStatus ? (
          <Button label={t('common.confirm')} type="submit" disabled={isSigning} onClick={sign}>
            {t('hardware-sign.actions.rescan') as string}
          </Button>
        ) : null}
      </footer>
    </div>
  )

  if (error) {
    container = <SignError onCancel={onCancel} error={error} />
  }

  return (
    <dialog ref={dialogRef} className={dialogClass}>
      {container}
    </dialog>
  )
}

HardwareSign.displayName = 'HardwareSign'

export default HardwareSign
