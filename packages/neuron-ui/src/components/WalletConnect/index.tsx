import React, { useState, useCallback } from 'react'
import { useState as useGlobalState } from 'states'
import PageContainer from 'components/PageContainer'
import { useTranslation } from 'react-i18next'
import TextField from 'widgets/TextField'
import Button from 'widgets/Button'
import TableNoData from 'widgets/Icons/TableNoData.png'
import Dialog from 'widgets/Dialog'
import AlertDialog from 'widgets/AlertDialog'
import { PasswordDialog } from 'components/SignAndVerify'
import WCSignTransactionDialog from 'components/WCSignTransactionDialog'
import { showErrorMessage, signMessage } from 'services/remote'
import { ControllerResponse } from 'services/remote/remoteApiWrapper'
import { clsx, ErrorCode, isSuccessResponse } from 'utils'
import { Experiment, WalletConnect as WalletConnectIcon, Scan, ScanScreen, NumberScan } from 'widgets/Icons/icon'
import { SessionRequest } from 'ckb-walletconnect-wallet-sdk'
import { useWalletConnect } from './hooks'
import { SessionItem, PrososalItem, MessageItem, TransactionItem } from './ItemComponents'
import styles from './walletConnect.module.scss'

const WalletConnect = () => {
  const { wallet } = useGlobalState()
  const [t] = useTranslation()
  const [uri, setUri] = useState<string>('')
  const [errorMsg, setErrorMsg] = useState('')
  const [dialogType, setDialogType] = useState<'' | 'connecting' | 'uri' | 'pwd' | 'signTransaction'>('')
  const [currentEvent, setCurrentEvent] = useState<SessionRequest>()

  const {
    proposals,
    sessions,
    requests,
    onConnect,
    onDisconnect,
    onRejectRequest,
    onApproveRequest,
    onRejectSession,
    onApproveSession,
    userName,
  } = useWalletConnect()

  const openUriDialog = useCallback(() => {
    setDialogType('uri')
  }, [setDialogType])

  const handleUriChange = useCallback(
    (e: React.SyntheticEvent<HTMLInputElement>) => {
      const { value } = e.target as HTMLInputElement
      setUri(value)
    },
    [setUri]
  )

  const handleConnect = useCallback(
    async e => {
      const { cntype } = e.target.dataset

      if (cntype === 'uri') {
        setDialogType('')
        setUri('')
      }
      const res = await onConnect(cntype, uri)
      if (isSuccessResponse(res)) {
        setDialogType('connecting')
      }
    },
    [uri, uri]
  )

  const hasConnect = proposals.length || sessions.length

  const approveSignMessage = useCallback(
    item => {
      setCurrentEvent(item)
      setDialogType('pwd')
    },
    [setCurrentEvent, setDialogType]
  )

  const approveSignTransaction = useCallback(
    item => {
      setCurrentEvent(item)

      setDialogType('signTransaction')
    },
    [onApproveRequest]
  )

  const handleSignMessage = useCallback(
    async password => {
      if (!currentEvent) return null

      const { address, message } = currentEvent.params.request.params
      const res: ControllerResponse = await signMessage({
        walletID: wallet?.id ?? '',
        address,
        message,
        password,
      })
      if (isSuccessResponse(res)) {
        onApproveRequest(currentEvent, res.result)
        setDialogType('')
      } else if (res.status === ErrorCode.PasswordIncorrect) {
        // pass through this kind of error
      } else if (res.status === ErrorCode.AddressNotFound) {
        setDialogType('')
        showErrorMessage('Error', 'address-not-found')
      } else {
        setDialogType('')
        showErrorMessage('Error', 'Fail to sign the message')
      }
      return res
    },
    [setDialogType, onApproveRequest, currentEvent]
  )

  const onDismiss = useCallback(() => {
    setDialogType('')
    setUri('')
    setCurrentEvent(undefined)
  }, [setDialogType])

  return (
    <PageContainer
      head={
        <div className={styles.pageHeader}>
          <Experiment />
          <p>{t('wallet-connect.title')}</p>
        </div>
      }
    >
      <div className={styles.container}>
        <div className={clsx(styles.connectWrap, styles.panel)} data-empty={!hasConnect}>
          <Button className={styles.numberScan} type="text" onClick={openUriDialog}>
            <NumberScan />
          </Button>
          <div className={styles.content}>
            <p className={styles.title}>{t('wallet-connect.add-title')}</p>
            <WalletConnectIcon className={styles.logo} />
            <div>
              <Button data-cntype="camera" onClick={handleConnect}>
                <Scan />
                {t('wallet-connect.scan-with-camera')}
              </Button>
              <Button type="primary" className={styles.scanBtn} data-cntype="scanQrcode" onClick={handleConnect}>
                <ScanScreen />
                {t('wallet-connect.scan-qrcode')}
              </Button>
              <Button type="text" className={styles.tipBtn} onClick={openUriDialog}>
                {t('wallet-connect.no-camera-tip')}
              </Button>
            </div>
          </div>
        </div>

        <div className={styles.panel}>
          {hasConnect ? (
            <>
              {sessions.length ? (
                <>
                  <p className={styles.title}>{t('wallet-connect.connected-session')}</p>
                  {sessions.map(item => (
                    <SessionItem key={item.topic} data={item} onDisconnect={onDisconnect} userName={userName} />
                  ))}
                </>
              ) : null}

              {proposals.length ? (
                <>
                  <p className={clsx(styles.title, styles.mt24)}>{t('wallet-connect.session-request')}</p>
                  {proposals.map(item => (
                    <PrososalItem
                      key={item.id}
                      data={item}
                      onApproveSession={onApproveSession}
                      onRejectSession={onRejectSession}
                      userName={userName}
                    />
                  ))}
                </>
              ) : null}
            </>
          ) : (
            <div className={styles.noRecords}>
              <p>{t('wallet-connect.session-request')}</p>
              <img src={TableNoData} alt="No Data" />
              {t('wallet-connect.no-session')}
            </div>
          )}
        </div>

        {requests.length ? (
          <div className={styles.panel}>
            <p className={styles.title}>{t('wallet-connect.sign-request')}</p>
            {requests.map(item => (
              <>
                {item.params.request.method === 'ckb_signMessage' ? (
                  <MessageItem
                    key={item.id}
                    data={item}
                    approve={() => approveSignMessage(item)}
                    sessions={sessions}
                    onRejectRequest={onRejectRequest}
                  />
                ) : null}
                {item.params.request.method === 'ckb_signTransaction' ? (
                  <TransactionItem
                    key={item.id}
                    data={item}
                    approve={() => approveSignTransaction(item)}
                    sessions={sessions}
                    onRejectRequest={onRejectRequest}
                  />
                ) : null}
              </>
            ))}
          </div>
        ) : null}
      </div>

      {dialogType === 'uri' ? (
        <Dialog
          show
          title={t('wallet-connect.use-uri')}
          showCancel={false}
          confirmText={t('wallet-connect.connect')}
          onConfirm={handleConnect}
          disabled={!uri}
          confirmProps={{ 'data-cntype': 'uri' }}
          onCancel={onDismiss}
        >
          <div className={styles.uriDialog}>
            <TextField value={uri} placeholder={t('wallet-connect.uri-placeholder')} onChange={handleUriChange} />
          </div>
        </Dialog>
      ) : null}

      <AlertDialog
        show={!!errorMsg}
        title={t('wallet-connect.invalid-qrcode')}
        message={errorMsg}
        type="failed"
        onCancel={() => {
          setErrorMsg('')
        }}
      />

      <PasswordDialog
        show={dialogType === 'pwd' && !!currentEvent}
        walletName={wallet?.name}
        onCancel={onDismiss}
        onSubmit={handleSignMessage}
      />

      {dialogType === 'signTransaction' ? (
        <WCSignTransactionDialog wallet={wallet} onDismiss={onDismiss} data={currentEvent?.params.request.params} />
      ) : null}
    </PageContainer>
  )
}

WalletConnect.displayName = 'WalletConnect'

export default WalletConnect
