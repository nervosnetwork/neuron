import React, { useMemo } from 'react'
import { useTranslation, Trans } from 'react-i18next'
import { MultisigConfig, OfflineSignJSON } from 'services/remote'
import Button from 'widgets/Button'
import MultisigAddress from 'widgets/MultisigAddress'
import { useState as useGlobalState } from 'states'
import styles from './approveMultisigTx.module.scss'
import { useBroadcast, useSignAndBroadcast, useSignAndExport, useSignedStatus } from './hooks'

const ApproveMultisigTx = ({
  multisigConfig,
  closeDialog,
  offlineSignJson,
}: {
  multisigConfig: MultisigConfig
  closeDialog: () => void
  offlineSignJson: OfflineSignJSON
}) => {
  const [t] = useTranslation()
  const { wallet } = useGlobalState()
  const jsonContent = useMemo(() => {
    return JSON.stringify(offlineSignJson, null, 2)
  }, [offlineSignJson])
  const [requiredSignCount, needSignCount] = useSignedStatus({
    multisigConfig,
    signatures: offlineSignJson.transaction.signatures,
  })
  const onSignAndExport = useSignAndExport({
    multisigConfig,
    walletID: wallet.id,
    offlineSignJson,
    onlyNeedOne: needSignCount === 1,
  })
  const onBroadcast = useBroadcast({ offlineSignJson, walletID: wallet.id, closeDialog, t })
  const onSignAndBroadcast = useSignAndBroadcast({
    multisigConfig,
    walletID: wallet.id,
    offlineSignJson,
    onlyNeedOne: needSignCount === 1,
  })
  return (
    <>
      <div className={styles.title}>
        <Trans
          i18nKey="multisig-address.approve-dialog.title"
          values={multisigConfig}
          components={[<MultisigAddress fullPayload={multisigConfig.fullPayload} />]}
        />
      </div>
      <h4>{t('multisig-address.approve-dialog.transaction')}</h4>
      <section>
        <div>{t('multisig-address.approve-dialog.content')}</div>
        <textarea disabled value={jsonContent} className={styles.textarea} />
        <div>{t('multisig-address.approve-dialog.status')}</div>
        {!needSignCount && !requiredSignCount && <div>{t('multisig-address.approve-dialog.signed')}</div>}
        {!!needSignCount && <div>{`-${t('multisig-address.approve-dialog.signerApprove', { m: needSignCount })}`}</div>}
        {!!requiredSignCount && (
          <div>{`-${t('multisig-address.approve-dialog.requiredSigner', { r: requiredSignCount })}`}</div>
        )}
      </section>
      <div className={styles.action}>
        <Button label={t('multisig-address.approve-dialog.cancel')} type="cancel" onClick={closeDialog} />
        {!needSignCount && !requiredSignCount && (
          <Button label={t('multisig-address.approve-dialog.broadcast')} type="primary" onClick={onBroadcast} />
        )}
        {needSignCount === 1 && (
          <Button
            label={t('multisig-address.approve-dialog.signAndBroadcast')}
            type="primary"
            onClick={onSignAndBroadcast}
          />
        )}
        {needSignCount > 1 && (
          <Button label={t('multisig-address.approve-dialog.signAndExport')} type="primary" onClick={onSignAndExport} />
        )}
      </div>
    </>
  )
}

ApproveMultisigTx.displayName = 'ApproveMultisigTx'

export default ApproveMultisigTx
