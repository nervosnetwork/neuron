import React, { useRef, useCallback, useMemo, useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { RouteComponentProps } from 'react-router-dom'
import { isSuccessResponse, RoutePath, useDidMount } from 'utils'
import Button from 'widgets/Button'
import Spinner from 'widgets/Spinner'
import { addNotification, useDispatch, useState as useGlobalState } from 'states'
import { broadcastTransaction, getCurrentWallet, OfflineSignStatus } from 'services/remote'
import { ReactComponent as HardWalletIcon } from 'widgets/Icons/HardWallet.svg'
import SignDialog from './sign-dialog'

import styles from './offlineSign.module.scss'

const OfflineSign = ({ history }: RouteComponentProps) => {
  const dialogRef = useRef<HTMLDialogElement | null>(null)
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

  const onBack = useCallback(() => {
    history.goBack()
  }, [history])

  const onSign = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault()
      setIsSigning(true)
    },
    [setIsSigning]
  )

  const onBroadcast = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault()
      setIsBroadcasting(true)
      try {
        const res = await broadcastTransaction({
          ...json,
          walletID: wallet!.id,
        })
        if (isSuccessResponse(res)) {
          history.push(RoutePath.History)
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
    },
    [wallet, json, history, dispatch, onBack]
  )

  useDidMount(() => {
    getCurrentWallet().then(res => {
      if (isSuccessResponse(res)) {
        setWallet(res.result)
      }
    })
  })

  useEffect(() => {
    if (!isSigning && dialogRef.current && !dialogRef.current.open) {
      dialogRef.current.showModal()
    }
  }, [isSigning])

  const signDialogOnDismiss = useCallback(() => {
    setIsSigning(false)
  }, [])

  if (isSigning && wallet) {
    return <SignDialog isBroadcast={false} wallet={wallet} offlineSignJSON={json} onDismiss={signDialogOnDismiss} />
  }

  return (
    <dialog ref={dialogRef} className={styles.dialog}>
      <form className={styles.container}>
        <header className={styles.title}>{t('offline-sign.title')}</header>
        <section className={styles.main}>
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
            </tbody>
          </table>
          <div className={styles.content}>{t('offline-sign.content')}</div>
          <textarea disabled value={jsonContent} className={styles.textarea} />
        </section>
        <footer className={styles.footer}>
          <Button type="cancel" label={t('offline-sign.actions.cancel')} onClick={onBack} />
          {signStatus === OfflineSignStatus.Signed ? (
            <Button type="submit" label={t('offline-sign.actions.broadcast')} onClick={onBroadcast}>
              {isBroadCasting ? <Spinner /> : (t('offline-sign.actions.broadcast') as string)}
            </Button>
          ) : (
            <Button type="submit" label={t('offline-sign.actions.sign')} onClick={onSign} />
          )}
        </footer>
      </form>
    </dialog>
  )
}

OfflineSign.displayName = 'OfflineSign'

export default OfflineSign
