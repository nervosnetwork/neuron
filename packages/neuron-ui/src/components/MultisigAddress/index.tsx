import React, { useCallback, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { SearchBox, MessageBar, MessageBarType } from 'office-ui-fabric-react'
import Button from 'widgets/Button'
import { useOnLocaleChange, isMainnet as isMainnetUtil, shannonToCKBFormatter } from 'utils'
import { useState as useGlobalState } from 'states'
import MultisigAddressCreateDialog from 'components/MultisigAddressCreateDialog'
import CopyZone from 'widgets/CopyZone'
import { More } from 'widgets/Icons/icon'
import { CustomizableDropdown } from 'widgets/Dropdown'
import MultisigAddressInfo from 'components/MultisigAddressInfo'
import { EditTextField } from 'widgets/TextField'
import { MultisigConfig } from 'services/remote'
import { useSearch, useDialogWrapper, useConfigManage, useExportConfig, useActions, useSubscription } from './hooks'
import styles from './multisig-address.module.scss'

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

const tableActions = ['info', 'delete']

const MultisigAddress = () => {
  const [t, i18n] = useTranslation()
  useOnLocaleChange(i18n)
  const {
    wallet: { id: walletId },
    chain: { networkID },
    settings: { networks = [] },
  } = useGlobalState()
  const isMainnet = isMainnetUtil(networks, networkID)
  const multisigBanlances = useSubscription({ walletId, isMainnet })
  const { keywords, onKeywordsChange, onSearch, searchKeywords } = useSearch()
  const { openDialog, closeDialog, dialogRef, isDialogOpen } = useDialogWrapper()
  const { configs, saveConfig, updateConfig, deleteConfigById, onImportConfig } = useConfigManage({
    walletId,
    searchKeywords,
    isMainnet,
  })
  const { deleteAction, infoAction } = useActions({ deleteConfigById })
  const onClickItem = useCallback(
    (multisigConfig: MultisigConfig) => (option: { key: string }) => {
      if (option.key === 'info') {
        infoAction.action(multisigConfig)
      } else if (option.key === 'delete') {
        deleteAction.action(multisigConfig)
      }
    },
    [deleteAction, infoAction]
  )
  const listActionOptions = useMemo(
    () => tableActions.map(key => ({ key, label: t(`multisig-address.table.actions.${key}`) })),
    [t]
  )
  const { selectIds, isAllSelected, onChangeChecked, onChangeCheckedAll, exportConfig } = useExportConfig(configs)
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
              <th>
                <input type="checkbox" onChange={onChangeCheckedAll} checked={isAllSelected} />
              </th>
              {['address', 'alias', 'type', 'balance'].map(field => (
                <th key={field}>{t(`multisig-address.table.${field}`)}</th>
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
                    <span className={styles.overflow}>{v.fullPayload.slice(0, -6)}</span>
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
                <td>
                  {shannonToCKBFormatter(multisigBanlances[v.fullPayload])}
                  CKB
                </td>
                <td>
                  <CustomizableDropdown options={listActionOptions} onClickItem={onClickItem(v)}>
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
    </div>
  )
}

MultisigAddress.displayName = 'MultisigAddress'

export default MultisigAddress
