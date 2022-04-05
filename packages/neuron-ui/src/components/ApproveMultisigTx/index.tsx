import React, { useMemo } from 'react'
import { useTranslation, Trans } from 'react-i18next'
import { MultisigConfig, OfflineSignJSON } from 'services/remote'
import Button from 'widgets/Button'
import Address from 'widgets/Address'
import { useState as useGlobalState } from 'states'
import { ckbCore } from 'services/chain'
import { shannonToCKBFormatter, getScriptFormat } from 'utils'
import styles from './approveMultisigTx.module.scss'
import { useBroadcast, useSignAndBroadcast, useSignAndExport, useSignedStatus, useTabView } from './hooks'

const Cell = React.memo(
  ({
    cell,
    isMainnet,
  }: {
    cell: {
      lock: CKBComponents.Script
      type?: CKBComponents.Script
      data?: string
      capacity: string
    }
    isMainnet: boolean
  }) => {
    return (
      <div className={styles.cellItem}>
        <div>
          <Address fullPayload={ckbCore.utils.scriptToAddress(cell.lock, isMainnet)} />
          <span className={`${cell.type ? styles.activity : ''} ${styles.tag}`}>Type</span>
          <span className={`${cell.data && cell.data !== '0x' ? styles.activity : ''} ${styles.tag}`}>Data</span>
          <span className={`${styles.activity} ${styles.tag}`}>{getScriptFormat(cell.lock)}</span>
        </div>
        <span className={styles.capacity}>{`${shannonToCKBFormatter(cell.capacity)} CKB`}</span>
      </div>
    )
  }
)
const ApproveMultisigTx = ({
  multisigConfig,
  closeDialog,
  offlineSignJson,
  isMainnet,
}: {
  multisigConfig: MultisigConfig
  closeDialog: () => void
  offlineSignJson: OfflineSignJSON
  isMainnet: boolean
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
  const { tabIdx, onTabClick } = useTabView()
  return (
    <>
      <div className={styles.title}>
        <Trans
          i18nKey="multisig-address.approve-dialog.title"
          values={multisigConfig}
          components={[<Address fullPayload={multisigConfig.fullPayload} />]}
        />
      </div>
      <h4>{t('multisig-address.approve-dialog.transaction')}</h4>
      <section>
        <div>{t('multisig-address.approve-dialog.content')}</div>
        <div role="presentation" className={styles.recordTab} data-idx={tabIdx} onClick={onTabClick}>
          <button type="button" role="tab" data-idx="0">
            {t('multisig-address.approve-dialog.view-raw-data')}
          </button>
          <button type="button" role="tab" data-idx="1">
            {t('multisig-address.approve-dialog.view-concise-data')}
          </button>
          <div className={styles.underline} />
        </div>
        {tabIdx === '0' ? (
          <textarea disabled value={jsonContent} className={styles.textarea} />
        ) : (
          <>
            <h5>Inputs</h5>
            {offlineSignJson.transaction?.inputs?.map(v => (
              <Cell cell={v} isMainnet={isMainnet} key={v.lockHash} />
            ))}
            <h5>Outputs</h5>
            {offlineSignJson.transaction?.outputs?.map(v => (
              <Cell cell={v} isMainnet={isMainnet} key={v.lockHash} />
            ))}
          </>
        )}
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
