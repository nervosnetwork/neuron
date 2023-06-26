import React, { useCallback, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { isSuccessResponse, RoutePath, useDidMount } from 'utils'
import Dialog from 'widgets/Dialog'
import { addNotification, useDispatch, useState as useGlobalState } from 'states'
import { broadcastTransaction, getCurrentWallet, OfflineSignStatus } from 'services/remote'
import { ReactComponent as HardWalletIcon } from 'widgets/Icons/HardWallet.svg'
import OfflineSignDialog from '../OfflineSignDialog'

import styles from './offlineSign.module.scss'

const OfflineSign = () => {
  const {
    app: { loadedTransaction = {} },
  } = useGlobalState()

  const [wallet, setWallet] = useState<State.Wallet | null>(null)
  const [isSigning, setIsSigning] = useState(false)
  const [isBroadCasting, setIsBroadcasting] = useState(false)
  const [t] = useTranslation()
  const dispatch = useDispatch()

  const { filePath, json } = loadedTransaction

  const jsonContent = useMemo(() => {
    return JSON.stringify(json, null, 2)
  }, [json])

  const signStatus: OfflineSignStatus = json.status

  const status = useMemo(() => {
    switch (signStatus) {
      case OfflineSignStatus.Unsigned:
        return t('offline-sign.status.unsigned')
      case OfflineSignStatus.PartiallySigned:
        return t('offline-sign.status.partially-signed')
      default:
        return t('offline-sign.status.signed')
    }
  }, [signStatus, t])

  const navigate = useNavigate()

  const onBack = useCallback(() => {
    navigate(-1)
  }, [navigate])

  const onSign = useCallback(() => {
    setIsSigning(true)
  }, [setIsSigning])

  const onBroadcast = useCallback(async () => {
    setIsBroadcasting(true)
    try {
      const res = await broadcastTransaction({
        ...json,
        walletID: wallet!.id,
      })
      if (isSuccessResponse(res)) {
        navigate(RoutePath.History)
      } else {
        addNotification({
          type: 'alert',
          timestamp: +new Date(),
          code: res.status,
          content: typeof res.message === 'string' ? res.message : res.message.content,
          meta: typeof res.message === 'string' ? undefined : res.message.meta,
        })(dispatch)
        onBack()
      }
    } finally {
      setIsBroadcasting(false)
    }
  }, [wallet, json, navigate, dispatch, onBack])

  useDidMount(() => {
    getCurrentWallet().then(res => {
      if (isSuccessResponse(res)) {
        setWallet(res.result)
      }
    })
  })

  const signDialogOnDismiss = useCallback(() => {
    setIsSigning(false)
  }, [])

  if (isSigning && wallet) {
    return (
      <OfflineSignDialog isBroadcast={false} wallet={wallet} offlineSignJSON={json} onDismiss={signDialogOnDismiss} />
    )
  }

  return (
    <Dialog
      show={!isSigning}
      title={t('offline-sign.title')}
      cancelText={t('offline-sign.actions.cancel')}
      onCancel={onBack}
      confirmText={
        signStatus === OfflineSignStatus.Signed ? t('offline-sign.actions.broadcast') : t('offline-sign.actions.sign')
      }
      isLoading={signStatus === OfflineSignStatus.Signed && isBroadCasting}
      onConfirm={signStatus === OfflineSignStatus.Signed ? onBroadcast : onSign}
    >
      <div className={styles.main}>
        <table>
          <tbody>
            <tr>
              <td className={styles.first}>{t('offline-sign.json-file')}</td>
              <td>{filePath}</td>
            </tr>
            <tr>
              <td className={styles.first}>{t('offline-sign.status.label')}</td>
              <td>{status}</td>
            </tr>
            <tr>
              <td className={styles.first}>{t('offline-sign.wallet')}</td>
              <td>
                {wallet?.device ? <HardWalletIcon /> : null}
                <span>{wallet?.name ?? ''}</span>
              </td>
            </tr>
            <tr>
              <td className={styles.first}>{t('offline-sign.content')}</td>
            </tr>
          </tbody>
        </table>
        <textarea disabled value={jsonContent} className={styles.textarea} />
      </div>
    </Dialog>
  )
}

OfflineSign.displayName = 'OfflineSign'

export default OfflineSign
