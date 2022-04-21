import React, { useMemo } from 'react'
import { useTranslation, Trans } from 'react-i18next'
import { MultisigConfig, OfflineSignJSON } from 'services/remote'
import Button from 'widgets/Button'
import CopyZoneAddress from 'widgets/CopyZoneAddress'
import { useState as useGlobalState } from 'states'
import { ckbCore } from 'services/chain'
import { shannonToCKBFormatter } from 'utils'
import ScriptTag from 'components/ScriptTag'
import styles from './approveMultisigTx.module.scss'
import { useBroadcast, useExport, useSignAndBroadcast, useSignAndExport, useSignedStatus, useTabView } from './hooks'

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
          <CopyZoneAddress fullPayload={ckbCore.utils.scriptToAddress(cell.lock, isMainnet)} />
          <span className={`${cell.type ? styles.activity : ''} ${styles.tag}`}>Type</span>
          <span className={`${cell.data && cell.data !== '0x' ? styles.activity : ''} ${styles.tag}`}>Data</span>
          <ScriptTag script={cell.lock} isMainnet={isMainnet} />
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
  const { lackOfRCount, lackOfMCount, canBroadcastAfterSign, canSign } = useSignedStatus({
    multisigConfig,
    signatures: offlineSignJson.transaction.signatures,
    addresses: wallet.addresses,
  })
  const onSignAndExport = useSignAndExport({
    multisigConfig,
    walletID: wallet.id,
    offlineSignJson,
    closeDialog,
  })
  const onBroadcast = useBroadcast({ offlineSignJson, walletID: wallet.id, closeDialog, t })
  const onSignAndBroadcast = useSignAndBroadcast({
    multisigConfig,
    walletID: wallet.id,
    offlineSignJson,
    canBroadcastAfterSign,
    closeDialog,
  })
  const onExport = useExport({ offlineSignJson, closeDialog })
  const { tabIdx, onTabClick } = useTabView()
  const [label, action] = useMemo(() => {
    if (!lackOfMCount && !lackOfRCount) {
      return ['broadcast', onBroadcast]
    }
    if (!canSign) {
      return ['export', onExport]
    }
    if (canBroadcastAfterSign) {
      return ['signAndBroadcast', onSignAndBroadcast]
    }
    return ['signAndExport', onSignAndExport]
  }, [
    lackOfMCount,
    lackOfRCount,
    canSign,
    canBroadcastAfterSign,
    onBroadcast,
    onExport,
    onSignAndBroadcast,
    onSignAndExport,
  ])
  return (
    <>
      <div className={styles.title}>
        <Trans
          i18nKey="multisig-address.approve-dialog.title"
          values={multisigConfig}
          components={[<CopyZoneAddress fullPayload={multisigConfig.fullPayload} />]}
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
        <div className={styles.statusTitle}>{t('multisig-address.approve-dialog.status')}</div>
        {lackOfMCount && lackOfRCount ? (
          <div>{t('multisig-address.approve-dialog.signerApprove', { m: lackOfMCount, r: lackOfRCount })}</div>
        ) : (
          <>
            {!!lackOfRCount && <div>{t('multisig-address.approve-dialog.noRSignerApprove', { m: lackOfMCount })}</div>}
            {!lackOfRCount && <div>{t('multisig-address.approve-dialog.signed')}</div>}
          </>
        )}
      </section>
      <div className={styles.action}>
        <Button label={t('multisig-address.approve-dialog.cancel')} type="cancel" onClick={closeDialog} />
        <Button label={t(`multisig-address.approve-dialog.${label}`)} type="primary" onClick={action} />
      </div>
    </>
  )
}

ApproveMultisigTx.displayName = 'ApproveMultisigTx'

export default ApproveMultisigTx
