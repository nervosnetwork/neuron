import React, { useCallback, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { isSuccessResponse, RoutePath, useDidMount, useGoBack } from 'utils'
import Dialog from 'widgets/Dialog'
import AlertDialog from 'widgets/AlertDialog'
import { useDispatch, useState as useGlobalState } from 'states'
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
  const [errMsg, setErrMsg] = useState('')

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

  const onBack = useGoBack()

  const onSign = useCallback(() => {
    setIsSigning(true)
  }, [setIsSigning])

  const navigate = useNavigate()
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
        setErrMsg(typeof res.message === 'string' ? res.message : res.message.content || '')
      }
    } finally {
      setIsBroadcasting(false)
    }
  }, [wallet, json, navigate, dispatch])

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
    <>
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
      <AlertDialog
        show={!!errMsg}
        title={t('message-types.alert')}
        message={errMsg}
        type="failed"
        onCancel={() => setErrMsg('')}
      />
    </>
  )
}

OfflineSign.displayName = 'OfflineSign'

export default OfflineSign
