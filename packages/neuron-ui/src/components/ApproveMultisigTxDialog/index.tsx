import React, { useMemo } from 'react'
import { useTranslation, Trans } from 'react-i18next'
import { MultisigConfig, OfflineSignJSON } from 'services/remote'
import { useState as useGlobalState } from 'states'
import { ckbCore } from 'services/chain'
import Tooltip from 'widgets/Tooltip'
import { Copy } from 'widgets/Icons/icon'
import CopyZone from 'widgets/CopyZone'
import { shannonToCKBFormatter } from 'utils'
import ScriptTag from 'components/ScriptTag'
import Dialog from 'widgets/Dialog'
import getMultisigSignStatus from 'utils/getMultisigSignStatus'
import { useBroadcast, useExport, useSignAndBroadcast, useSignAndExport, useTabView } from './hooks'
import styles from './approveMultisigTx.module.scss'

const Cell = React.memo(
  ({ cell, isMainnet }: { cell: State.DetailedInput | State.DetailedOutput; isMainnet: boolean }) => {
    const address = useMemo(
      () => (cell.lock ? ckbCore.utils.scriptToAddress(cell.lock, isMainnet) : ''),
      [cell, isMainnet]
    )
    return (
      <div className={styles.cellItem}>
        <div>
          {address.slice(0, 6)}...{address.slice(-6)}
          <span className={`${cell.type ? styles.activity : ''} ${styles.tag}`}>Type</span>
          <span className={`${cell.data && cell.data !== '0x' ? styles.activity : ''} ${styles.tag}`}>Data</span>
          <ScriptTag className={styles.scriptTag} script={cell.lock} isMainnet={isMainnet} />
        </div>
        <div>{`${shannonToCKBFormatter(cell.capacity ?? '0')} CKB`}</div>
      </div>
    )
  }
)
const ApproveMultisigTxDialog = ({
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
  const { lackOfRCount, lackOfMCount, canBroadcastAfterSign, canSign } = useMemo(
    () =>
      getMultisigSignStatus({
        multisigConfig,
        signatures: offlineSignJson.transaction.signatures,
        addresses: wallet.addresses,
      }),
    [multisigConfig, offlineSignJson.transaction.signatures, wallet.addresses]
  )
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
    <Dialog
      show
      title={t('multisig-address.approve-dialog.title')}
      onCancel={closeDialog}
      onConfirm={action}
      confirmText={t(`multisig-address.approve-dialog.${label}`)}
      contentClassName={styles.dialogContainer}
    >
      <div className={styles.container}>
        <div className={styles.header}>
          <Tooltip
            tipClassName={styles.tip}
            placement="right-bottom"
            tip={
              <CopyZone content={multisigConfig.fullPayload} className={styles.copyTableAddress}>
                {multisigConfig.fullPayload}
                <Copy />
              </CopyZone>
            }
            showTriangle
            isTriggerNextToChild
          >
            <div>
              <Trans
                i18nKey="multisig-address.approve-dialog.detail"
                values={multisigConfig}
                components={[
                  <span className={styles.address}>
                    <span>{multisigConfig.fullPayload.slice(0, 6)}</span>
                    <span>...</span>
                    <span>{multisigConfig.fullPayload.slice(-6)}</span>
                  </span>,
                ]}
              />
            </div>
          </Tooltip>
        </div>

        <div className={styles.content}>
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
            <div className={styles.conciseData}>
              <div className={styles.inputWrap}>
                <h2>Inputs</h2>
                {offlineSignJson.transaction?.inputs?.map(input => (
                  <Cell cell={input} isMainnet={isMainnet} key={input.lockHash} />
                ))}
              </div>
              <h2>Outputs</h2>
              {offlineSignJson.transaction?.outputs?.map(output => (
                <Cell cell={output} isMainnet={isMainnet} key={output.lockHash} />
              ))}
            </div>
          )}
        </div>

        <div className={styles.statusTitle}>
          <span>{t('multisig-address.approve-dialog.status')}: &nbsp;</span>
          {lackOfMCount && lackOfRCount ? (
            <span>{t('multisig-address.approve-dialog.signerApprove', { m: lackOfMCount, r: lackOfRCount })}</span>
          ) : (
            <>
              {!!lackOfMCount && (
                <span>{t('multisig-address.approve-dialog.noRSignerApprove', { m: lackOfMCount })}</span>
              )}
              {!lackOfMCount && <span>{t('multisig-address.approve-dialog.signed')}</span>}
            </>
          )}
        </div>
      </div>
    </Dialog>
  )
}

ApproveMultisigTxDialog.displayName = 'ApproveMultisigTxDialog'

export default ApproveMultisigTxDialog
