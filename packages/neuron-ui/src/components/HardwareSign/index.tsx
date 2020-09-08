import React, { useCallback, useRef, useMemo, useState } from 'react'
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
import { ReactComponent as HardWalletIcon } from 'widgets/Icons/HardWallet.svg'
import { connectDevice } from 'services/remote'
import { isSuccessResponse, useDidMount } from 'utils'
import styles from './hardwareSign.module.scss'

const HardwareSign = () => {
  const [t] = useTranslation()
  const dialogRef = useRef<HTMLDialogElement | null>(null)
  const dispatch = useDispatch()
  const onCancel = useCallback(() => {
    dispatch({
      type: AppActions.DismissPasswordRequest,
    })
    dispatch({
      type: AppActions.UpdateLoadings,
      payload: { sending: false },
    })
  }, [dispatch])
  const connectStatus = t('hardware-sign.status.connect')
  const disconnectStatus = t('hardware-sign.status.disconnect')

  const {
    app: {
      send: { description, generatedTx },
      loadings: { sending: isSending = false },
      passwordRequest: { walletID = '', actionType = null },
    },
    settings: { wallets = [] },
    experimental,
  } = useGlobalState()
  const [status, setStatus] = useState('')
  const [error, setError] = useState('')
  const [isSuccess, setSuccess] = useState(false)

  const wallet = useMemo(() => wallets.find(w => w.id === walletID), [walletID, wallets])!

  const productName = `${wallet.device!.manufacturer} ${wallet.device!.product}`

  useDidMount(() => {
    dialogRef.current!.showModal()
    connectDevice(wallet.device!).then(response => {
      if (isSuccessResponse(response)) {
        setStatus(connectStatus)

        switch (actionType) {
          case 'send': {
            if (isSending) {
              break
            }
            sendTransaction({ walletID, tx: generatedTx, description })(dispatch).then(res => {
              if (isSuccessResponse(res)) {
                setSuccess(true)
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
                setSuccess(true)
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
                setSuccess(true)
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
                setSuccess(true)
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
      } else {
        setStatus(disconnectStatus)
      }
    })
  })

  if (error) {
    return <div />
  }

  if (isSuccess) {
    return <div />
  }

  return (
    <dialog ref={dialogRef} className={styles.dialog}>
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
        </section>
        <footer className={styles.footer}>
          <Button type="cancel" label={t('hardware-sign.cancel')} onClick={onCancel} />
        </footer>
      </div>
    </dialog>
  )
}

HardwareSign.displayName = 'HardwareSign'

export default HardwareSign
