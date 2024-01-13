import React, { useCallback, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { isSuccessResponse, RoutePath, isMainnet as isMainnetUtil, useGoBack, getExplorerUrl } from 'utils'
import Dialog from 'widgets/Dialog'
import AlertDialog from 'widgets/AlertDialog'
import { useDispatch, useState as useGlobalState } from 'states'
import { broadcastTransactionOnly, OfflineSignStatus, openExternal, getLiveCells } from 'services/remote'
import { ReactComponent as HardWalletIcon } from 'widgets/Icons/HardWallet.svg'

import styles from './broadcastTransaction.module.scss'

const BroadcastTransaction = () => {
  const {
    app: { loadedTransaction = {} },
    chain: { networkID },
    settings: { networks },
    wallet,
  } = useGlobalState()

  const [isBroadcasting, setIsBroadcasting] = useState(false)
  const [broadcastedTxHash, setBroadCastedTxHash] = useState('')
  const [t] = useTranslation()
  const dispatch = useDispatch()
  const [errMsg, setErrMsg] = useState('')
  const isMainnet = isMainnetUtil(networks, networkID)

  const { filePath, json } = loadedTransaction

  const jsonContent = useMemo(() => {
    return JSON.stringify(json, null, 2)
  }, [json])

  const signStatus: OfflineSignStatus = json.status

  const isSigned = useMemo(() => signStatus === OfflineSignStatus.Signed, [signStatus])

  const onBack = useGoBack()

  const navigate = useNavigate()
  const onBroadcast = useCallback(async () => {
    if (broadcastedTxHash) {
      openExternal(`${getExplorerUrl(isMainnet)}/transaction/${broadcastedTxHash}`)
      return
    }

    setIsBroadcasting(true)

    try {
      const res = await broadcastTransactionOnly({
        ...json,
      })
      if (isSuccessResponse(res)) {
        getLiveCells().then(cellRes => {
          if (isSuccessResponse(cellRes) && cellRes.result) {
            const cellWithTransaction = cellRes.result.find(item => item.outPoint.txHash === res.result)

            if (cellWithTransaction) {
              navigate(RoutePath.History)
            }
          }

          if (res.result) {
            setBroadCastedTxHash(res.result)
          }
        })
      } else {
        setErrMsg(typeof res.message === 'string' ? res.message : res.message.content || '')
      }
    } finally {
      setIsBroadcasting(false)
    }
  }, [wallet, json, navigate, dispatch, broadcastedTxHash, setBroadCastedTxHash])

  return (
    <>
      <Dialog
        show={isSigned}
        title={t('offline-sign.broadcast-transaction')}
        cancelText={t('offline-sign.actions.cancel')}
        onCancel={onBack}
        confirmText={
          broadcastedTxHash ? t('offline-sign.actions.view-in-explorer') : t('offline-sign.actions.broadcast')
        }
        isLoading={isBroadcasting}
        onConfirm={onBroadcast}
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
                <td>{t('offline-sign.status.signed')}</td>
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
        show={!isSigned}
        className={styles.warningDialog}
        title={t('offline-sign.import-unsigned-transaction')}
        cancelText={t('offline-sign.actions.cancel')}
        onCancel={onBack}
        onConfirm={onBack}
      >
        <div className={styles.content}>{t('offline-sign.import-unsigned-transaction-detail')}</div>
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

BroadcastTransaction.displayName = 'BroadcastTransaction'

export default BroadcastTransaction
