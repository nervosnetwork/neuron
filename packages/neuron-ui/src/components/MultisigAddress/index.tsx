import React, { useCallback, useMemo, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { SearchBox, MessageBar, MessageBarType } from 'office-ui-fabric-react'
import Button from 'widgets/Button'
import {
  useOnLocaleChange,
  isMainnet as isMainnetUtil,
  shannonToCKBFormatter,
  useExitOnWalletChange,
  useDialogWrapper,
} from 'utils'
import { useState as useGlobalState, withProvider } from 'states'
import MultisigAddressCreateDialog from 'components/MultisigAddressCreateDialog'
import CopyZone from 'widgets/CopyZone'
import { More } from 'widgets/Icons/icon'
import { CustomizableDropdown } from 'widgets/Dropdown'
import MultisigAddressInfo from 'components/MultisigAddressInfo'
import SendFromMultisigDialog from 'components/SendFromMultisigDialog'
import { EditTextField } from 'widgets/TextField'
import { MultisigConfig } from 'services/remote'
import PasswordRequest from 'components/PasswordRequest'
import ApproveMultisigTx from 'components/ApproveMultisigTx'
import { LIGHT_NETWORK_TYPE } from 'utils/const'
import { useSearch, useConfigManage, useExportConfig, useActions, useSubscription } from './hooks'

import styles from './multisigAddress.module.scss'

const searchBoxStyles = {
  root: {
    background: '#e3e3e3',
    borderRadius: 0,
    fontSize: '1rem',
    border: '1px solid rgb(204, 204, 204)',
    borderTopLeftRadius: 2,
    borderBottomLeftRadius: 2,
  },
}
const messageBarStyle = { text: { alignItems: 'center' } }

const tableActions = ['info', 'delete', 'send', 'approve']

const MultisigAddress = () => {
  const [t, i18n] = useTranslation()
  useOnLocaleChange(i18n)
  useExitOnWalletChange()
  const {
    wallet: { id: walletId },
    chain: { networkID },
    settings: { networks = [] },
  } = useGlobalState()
  useEffect(() => {
    window.document.title = i18n.t('multisig-address.window-title')
    // eslint-disable-next-line
  }, [i18n.language])
  const isMainnet = isMainnetUtil(networks, networkID)
  const isLightClient = useMemo(
    () => networks.find(n => n.id === networkID)?.type === LIGHT_NETWORK_TYPE,
    [networks, networkID]
  )
  const { openDialog, closeDialog, dialogRef, isDialogOpen } = useDialogWrapper()
  const { allConfigs, saveConfig, updateConfig, deleteConfigById, onImportConfig, configs, onFilterConfig } =
    useConfigManage({
      walletId,
      isMainnet,
    })
  const { multisigBanlances, multisigSyncProgress } = useSubscription({
    walletId,
    isMainnet,
    configs: allConfigs,
    isLightClient,
  })
  const { deleteAction, infoAction, sendAction, approveAction } = useActions({ deleteConfigById })
  const onClickItem = useCallback(
    (multisigConfig: MultisigConfig) => (option: { key: string }) => {
      switch (option.key) {
        case 'info':
          infoAction.action(multisigConfig)
          break
        case 'delete':
          deleteAction.action(multisigConfig)
          break
        case 'send':
          sendAction.action(multisigConfig)
          break
        case 'approve':
          approveAction.action(multisigConfig)
          break
        default:
          break
      }
    },
    [deleteAction, infoAction, sendAction, approveAction]
  )
  const listActionOptions = useMemo(
    () => tableActions.map(key => ({ key, label: t(`multisig-address.table.actions.${key}`) })),
    [t]
  )
  const listNoBalanceActionOptions = useMemo(
    () =>
      tableActions.map(key => ({ key, label: t(`multisig-address.table.actions.${key}`), disabled: key === 'send' })),
    [t]
  )
  const { selectIds, isAllSelected, onChangeChecked, onChangeCheckedAll, exportConfig, clearSelected } =
    useExportConfig(configs)
  const { keywords, onKeywordsChange, onSearch, onClear } = useSearch(clearSelected, onFilterConfig)
  const sendTotalBalance = useMemo(() => {
    if (sendAction.sendFromMultisig?.fullPayload) {
      return multisigBanlances[sendAction.sendFromMultisig.fullPayload]
    }
    return ''
  }, [multisigBanlances, sendAction.sendFromMultisig])
  return (
    <div>
      <div className={styles.head}>
        <SearchBox
          value={keywords}
          className={styles.searchBox}
          styles={searchBoxStyles}
          placeholder={t('multisig-address.search.placeholder')}
          onChange={onKeywordsChange}
          onSearch={onSearch}
          onClear={onClear}
          iconProps={{ iconName: 'Search', styles: { root: { height: '18px' } } }}
        />
        <div className={styles.actions}>
          <Button label={t('multisig-address.add.label')} type="primary" onClick={openDialog} />
          <Button label={t('multisig-address.import.label')} type="primary" onClick={onImportConfig} />
          <Button label={t('multisig-address.export.label')} type="primary" onClick={exportConfig} />
        </div>
      </div>
      {configs.length ? (
        <table className={styles.multisigConfig}>
          <thead>
            <tr>
              <th className={styles.checkBoxTh}>
                <input type="checkbox" onChange={onChangeCheckedAll} checked={isAllSelected} />
              </th>
              {['address', 'alias', 'type', ...(isLightClient ? ['sync-block'] : []), 'balance'].map(field => (
                <th key={field} data-field={field}>
                  {t(`multisig-address.table.${field}`)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {configs.map(v => (
              <tr key={v.id}>
                <td>
                  <input
                    data-config-id={v.id}
                    type="checkbox"
                    onChange={onChangeChecked}
                    checked={selectIds.includes(v.id)}
                  />
                </td>
                <td>
                  <CopyZone
                    content={v.fullPayload}
                    className={styles.fullPayload}
                    name={t('multisig-address.table.copy-address')}
                  >
                    <span className={styles.overflow}>{v.fullPayload.slice(0, -7)}</span>
                    <span>...</span>
                    <span>{v.fullPayload.slice(-6)}</span>
                  </CopyZone>
                </td>
                <td>
                  <EditTextField field="alias" value={v.alias || ''} onChange={updateConfig(v.id)} />
                </td>
                <td>
                  {v.m}
                  &nbsp;of&nbsp;
                  {v.n}
                </td>
                {isLightClient ? <td>{multisigSyncProgress?.[v.fullPayload] ?? 0}</td> : null}
                <td>
                  {shannonToCKBFormatter(multisigBanlances[v.fullPayload])}
                  &nbsp;CKB
                </td>
                <td>
                  <CustomizableDropdown
                    options={
                      !multisigBanlances[v.fullPayload] || multisigBanlances[v.fullPayload] === '0'
                        ? listNoBalanceActionOptions
                        : listActionOptions
                    }
                    onClickItem={onClickItem(v)}
                  >
                    <More className={styles.more} />
                  </CustomizableDropdown>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <div className={styles.noData}>{t('multisig-address.no-data')}</div>
      )}
      <dialog ref={dialogRef} className={styles.dialog}>
        {isDialogOpen && <MultisigAddressCreateDialog closeDialog={closeDialog} confirm={saveConfig} />}
      </dialog>
      <dialog ref={infoAction.dialogRef} className={styles.dialog}>
        {infoAction.multisigConfig && (
          <MultisigAddressInfo
            m={infoAction.multisigConfig.m.toString()}
            n={infoAction.multisigConfig.n.toString()}
            r={infoAction.multisigConfig.r}
            addresses={infoAction.multisigConfig.addresses || []}
            multisigAddress={infoAction.multisigConfig.fullPayload}
          />
        )}
        <div className={styles.ok}>
          <Button label={t('multisig-address.ok')} type="ok" onClick={infoAction.closeDialog} />
        </div>
      </dialog>
      <dialog ref={deleteAction.dialogRef} className={styles.dialog}>
        <MessageBar messageBarType={MessageBarType.error} styles={messageBarStyle}>
          {t('multisig-address.delete-failed', { reason: deleteAction.deleteErrorMessage })}
        </MessageBar>
        <div className={styles.ok}>
          <Button label={t('multisig-address.ok')} type="cancel" onClick={deleteAction.closeDialog} />
        </div>
      </dialog>
      <dialog ref={sendAction.dialogRef} className={styles.dialog}>
        {sendAction.isDialogOpen && sendAction.sendFromMultisig && (
          <SendFromMultisigDialog
            closeDialog={sendAction.closeDialog}
            multisigConfig={sendAction.sendFromMultisig}
            balance={sendTotalBalance}
          />
        )}
      </dialog>
      <dialog ref={approveAction.dialogRef} className={styles.approveDialog}>
        {approveAction.isDialogOpen && approveAction.multisigConfig && approveAction.offlineSignJson && (
          <ApproveMultisigTx
            closeDialog={approveAction.closeDialog}
            multisigConfig={approveAction.multisigConfig}
            offlineSignJson={approveAction.offlineSignJson}
            isMainnet={isMainnet}
          />
        )}
      </dialog>
      <PasswordRequest />
    </div>
  )
}

MultisigAddress.displayName = 'MultisigAddress'

export default withProvider(MultisigAddress)
