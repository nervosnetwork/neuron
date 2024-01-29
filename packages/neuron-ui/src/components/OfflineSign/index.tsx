import React, { useCallback, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { isSuccessResponse, useDidMount, useGoBack } from 'utils'
import Dialog from 'widgets/Dialog'
import AlertDialog from 'widgets/AlertDialog'
import { useState as useGlobalState } from 'states'
import { getCurrentWallet, OfflineSignStatus } from 'services/remote'
import { ReactComponent as HardWalletIcon } from 'widgets/Icons/HardWallet.svg'
import OfflineSignDialog from '../OfflineSignDialog'

import styles from './offlineSign.module.scss'

const OfflineSign = () => {
  const {
    app: { loadedTransaction = {} },
  } = useGlobalState()

  const [wallet, setWallet] = useState<State.Wallet | null>(null)
  const [isSigning, setIsSigning] = useState(false)
  const [t] = useTranslation()
  const [errMsg, setErrMsg] = useState('')

  const { filePath, json } = loadedTransaction

  const jsonContent = useMemo(() => {
    return JSON.stringify(json, null, 2)
  }, [json])

  const signStatus: OfflineSignStatus = json.status

  const isSigned = useMemo(() => signStatus === OfflineSignStatus.Signed, [signStatus])

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

  useDidMount(() => {
    getCurrentWallet().then(res => {
      if (isSuccessResponse(res)) {
        setWallet(res.result)
      }
    })
  })

  const signDialogOnDismiss = useCallback(() => {
    setIsSigning(false)
  }, [setIsSigning])

  if (isSigning && wallet) {
    return (
      <OfflineSignDialog
        isBroadcast={false}
        wallet={wallet}
        offlineSignJSON={json}
        onDismiss={signDialogOnDismiss}
        onCompleted={onBack}
      />
    )
  }

  return (
    <>
      <Dialog
        show={!isSigned}
        title={t('offline-sign.title')}
        cancelText={t('offline-sign.actions.cancel')}
        onCancel={onBack}
        confirmText={t('offline-sign.actions.sign')}
        onConfirm={onSign}
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

      <Dialog
        show={isSigned}
        className={styles.warningDialog}
        title={t('offline-sign.import-signed-transaction')}
        cancelText={t('offline-sign.actions.cancel')}
        onCancel={onBack}
        onConfirm={onBack}
      >
        <div className={styles.content}>{t('offline-sign.import-signed-transaction-detail')}</div>
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
