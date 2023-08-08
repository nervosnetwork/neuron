import React, { useCallback, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  useOnLocaleChange,
  isMainnet as isMainnetUtil,
  shannonToCKBFormatter,
  useExitOnWalletChange,
  useGoBack,
} from 'utils'
import { useState as useGlobalState, withProvider } from 'states'
import MultisigAddressCreateDialog from 'components/MultisigAddressCreateDialog'
import MultisigAddressInfo from 'components/MultisigAddressInfo'
import SendFromMultisigDialog from 'components/SendFromMultisigDialog'
import { MultisigConfig } from 'services/remote'
import PasswordRequest from 'components/PasswordRequest'
import ApproveMultisigTxDialog from 'components/ApproveMultisigTxDialog'
import Dialog from 'widgets/Dialog'
import Table from 'widgets/Table'
import Tooltip from 'widgets/Tooltip'
import AlertDialog from 'widgets/AlertDialog'
import { ReactComponent as AddSimple } from 'widgets/Icons/AddSimple.svg'
import { ReactComponent as Details } from 'widgets/Icons/Details.svg'
import { ReactComponent as Delete } from 'widgets/Icons/Delete.svg'
import { ReactComponent as Confirm } from 'widgets/Icons/Confirm.svg'
import { ReactComponent as Transfer } from 'widgets/Icons/Transfer.svg'
import { ReactComponent as Search } from 'widgets/Icons/Search.svg'
import { ReactComponent as Upload } from 'widgets/Icons/Upload.svg'
import { ReactComponent as Download } from 'widgets/Icons/Download.svg'
import { ReactComponent as Edit } from 'widgets/Icons/Edit.svg'
import { HIDE_BALANCE, LIGHT_NETWORK_TYPE } from 'utils/const'
import { onEnter } from 'utils/inputDevice'
import { useSearch, useConfigManage, useExportConfig, useActions, useSubscription } from './hooks'

import styles from './multisigAddress.module.scss'

const tableActions = [
  {
    key: 'info',
    icon: <Details />,
  },
  {
    key: 'delete',
    icon: <Delete />,
  },
  {
    key: 'send',
    icon: <Transfer />,
  },
  {
    key: 'approve',
    icon: <Confirm />,
  },
]

const MultisigAddress = () => {
  const [t, i18n] = useTranslation()
  useOnLocaleChange(i18n)
  useExitOnWalletChange()
  const {
    wallet: { id: walletId },
    chain: { networkID },
    settings: { networks = [] },
  } = useGlobalState()
  const isMainnet = isMainnetUtil(networks, networkID)
  const isLightClient = useMemo(
    () => networks.find(n => n.id === networkID)?.type === LIGHT_NETWORK_TYPE,
    [networks, networkID]
  )
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
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
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)

  const showMainDialog = useMemo(
    () => !(infoAction.isDialogOpen || sendAction.isDialogOpen || approveAction.isDialogOpen || isCreateDialogOpen),
    [infoAction.isDialogOpen, sendAction.isDialogOpen, approveAction.isDialogOpen, isCreateDialogOpen]
  )
  const onClickItem = useCallback(
    (multisigConfig: MultisigConfig) => (e: React.SyntheticEvent<HTMLButtonElement>) => {
      const {
        dataset: { key },
      } = e.currentTarget
      switch (key) {
        case 'info':
          infoAction.action(multisigConfig)
          break
        case 'delete':
          deleteAction.setConfig(multisigConfig)
          setShowDeleteDialog(true)
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
  const { selectIds, isAllSelected, onChangeChecked, onChangeCheckedAll, exportConfig, clearSelected } =
    useExportConfig(configs)

  const listActionOptions = useMemo(
    () =>
      tableActions.map(item => ({
        ...item,
        label: t(`multisig-address.table.actions.${item.key}`),
        disabled: selectIds.length > 1 && item.key !== 'delete',
      })),
    [t, selectIds]
  )
  const listNoBalanceActionOptions = useMemo(
    () =>
      listActionOptions.map(item => ({
        ...item,
        disabled: item.disabled || item.key === 'send',
      })),
    [listActionOptions]
  )

  const { keywords, onChange, onBlur } = useSearch(clearSelected, onFilterConfig)

  const sendTotalBalance = useMemo(() => {
    if (sendAction.sendFromMultisig?.fullPayload) {
      return multisigBanlances[sendAction.sendFromMultisig.fullPayload]
    }
    return ''
  }, [multisigBanlances, sendAction.sendFromMultisig])

  const onBack = useGoBack()

  return (
    <div>
      <Dialog show={showMainDialog} title={t('multisig-address.window-title')} onCancel={onBack} showFooter={false}>
        <div className={styles.container}>
          <div className={styles.head}>
            <div className={styles.searchBox}>
              <Search />
              <input
                value={keywords}
                placeholder={t('multisig-address.search.placeholder')}
                onBlur={onBlur}
                onChange={onChange}
                onKeyDown={onEnter(onBlur)}
              />
            </div>
            <div className={styles.actions}>
              <button type="button" onClick={() => setIsCreateDialogOpen(true)} className={styles.addBtn}>
                <AddSimple /> {t('multisig-address.add.label')}
              </button>
              <button type="button" onClick={exportConfig} className={styles.iconBtn}>
                <Download />
              </button>
              <button type="button" onClick={onImportConfig} className={styles.iconBtn}>
                <Upload />
              </button>
            </div>
          </div>

          <div className={styles.tableWrap}>
            <Table
              columns={[
                {
                  title: (
                    <label htmlFor="all">
                      <input type="checkbox" id="all" onChange={onChangeCheckedAll} checked={isAllSelected} />
                      <span />
                    </label>
                  ),
                  dataIndex: 'id',
                  render(_, __, item) {
                    return (
                      <label htmlFor={`${item.id}`}>
                        <input
                          id={`${item.id}`}
                          data-config-id={item.id}
                          type="checkbox"
                          onChange={onChangeChecked}
                          checked={selectIds.includes(item.id)}
                        />
                        <span />
                      </label>
                    )
                  },
                },
                {
                  title: t('multisig-address.table.address'),
                  dataIndex: 'address',
                  align: 'left',
                  render(_, __, item) {
                    return (
                      <div className={styles.address}>
                        {item.fullPayload.slice(0, 5)}...{item.fullPayload.slice(-5)}
                      </div>
                    )
                  },
                },
                {
                  title: t('multisig-address.table.alias'),
                  dataIndex: 'alias',
                  align: 'left',
                  render(_, __, item) {
                    return (
                      <Tooltip
                        tip={
                          <div className={styles.descTipRoot}>
                            <div className={styles.autoHeight}>
                              <textarea
                                className={styles.descInput}
                                value={item.alias || ''}
                                onChange={updateConfig(item.id)}
                                onKeyDown={updateConfig(item.id)}
                              />
                              <Edit />
                            </div>
                            <div className={styles.hidden}>
                              {item.alias}
                              <Edit />
                            </div>
                          </div>
                        }
                        showTriangle
                        isTriggerNextToChild
                        className={styles.description}
                      >
                        <div className={styles.descText}>
                          {item.alias && item.alias.length > 6 ? `${item.alias.slice(0, 6)}...` : item.alias || '-'}
                        </div>
                      </Tooltip>
                    )
                  },
                },
                {
                  title: t('multisig-address.table.type'),
                  dataIndex: 'type',
                  align: 'left',
                  render(_, __, item) {
                    return (
                      <div>
                        {item.m} of {item.n}
                      </div>
                    )
                  },
                },
                {
                  title: t('multisig-address.table.sync-block'),
                  dataIndex: 'sync-block',
                  align: 'left',
                  hidden: !isLightClient,
                  render(_, __, item) {
                    return <div>{multisigSyncProgress?.[item.fullPayload] ?? 0}</div>
                  },
                },
                {
                  title: t('multisig-address.table.balance'),
                  dataIndex: 'balance',
                  align: 'left',
                  isBalance: true,
                  render(_, __, item, show) {
                    return (
                      <div>
                        {show ? shannonToCKBFormatter(multisigBanlances[item.fullPayload] || '0') : HIDE_BALANCE} CKB
                      </div>
                    )
                  },
                },
                {
                  title: t('multisig-address.table.action'),
                  dataIndex: 'action',
                  align: 'left',
                  render(_, __, item) {
                    return (
                      <div className={styles.action}>
                        <Tooltip
                          tipClassName={styles.tip}
                          tip={
                            <div className={styles.actionOptions}>
                              {(!multisigBanlances[item.fullPayload] || multisigBanlances[item.fullPayload] === '0'
                                ? listNoBalanceActionOptions
                                : listActionOptions
                              ).map(({ key, label, icon, disabled }) => (
                                <button
                                  type="button"
                                  key={key}
                                  data-key={key}
                                  onClick={onClickItem(item)}
                                  disabled={disabled}
                                >
                                  {icon}
                                  <span>{t(label)}</span>
                                </button>
                              ))}
                            </div>
                          }
                          trigger="click"
                          showTriangle
                        >
                          <div className={styles.hoverBtn}>{t('multisig-address.table.more')}</div>
                        </Tooltip>
                      </div>
                    )
                  },
                },
              ]}
              dataSource={configs}
              noDataContent={t('multisig-address.no-data')}
            />
          </div>
        </div>
      </Dialog>

      {isCreateDialogOpen ? (
        <MultisigAddressCreateDialog closeDialog={() => setIsCreateDialogOpen(false)} confirm={saveConfig} />
      ) : null}

      {infoAction.multisigConfig ? (
        <Dialog
          title={t('multisig-address.multi-details')}
          show={infoAction.isDialogOpen}
          onConfirm={infoAction.closeDialog}
          onCancel={infoAction.closeDialog}
          showCancel={false}
          confirmText={t('multisig-address.ok')}
        >
          <MultisigAddressInfo
            m={infoAction.multisigConfig.m.toString()}
            n={infoAction.multisigConfig.n.toString()}
            r={infoAction.multisigConfig.r}
            addresses={infoAction.multisigConfig.addresses || []}
            multisigAddress={infoAction.multisigConfig.fullPayload}
          />
        </Dialog>
      ) : null}

      <AlertDialog
        show={deleteAction.isDialogOpen}
        title={t('multisig-address.delete-failed')}
        message={deleteAction.deleteErrorMessage}
        type="failed"
        onCancel={deleteAction.closeDialog}
      />

      <AlertDialog
        show={showDeleteDialog}
        title={t('multisig-address.remove-multisig-address')}
        message={t('multisig-address.remove-multisig-address-msg')}
        type="warning"
        onCancel={() => setShowDeleteDialog(false)}
        onOk={() => {
          deleteAction.action()
          setShowDeleteDialog(false)
        }}
      />

      {sendAction.sendFromMultisig && sendAction.isDialogOpen ? (
        <SendFromMultisigDialog
          closeDialog={sendAction.closeDialog}
          multisigConfig={sendAction.sendFromMultisig}
          balance={sendTotalBalance}
        />
      ) : null}

      {approveAction.isDialogOpen && approveAction.multisigConfig && approveAction.offlineSignJson ? (
        <ApproveMultisigTxDialog
          closeDialog={approveAction.closeDialog}
          multisigConfig={approveAction.multisigConfig}
          offlineSignJson={approveAction.offlineSignJson}
          isMainnet={isMainnet}
        />
      ) : null}
      <PasswordRequest />
    </div>
  )
}

MultisigAddress.displayName = 'MultisigAddress'

export default withProvider(MultisigAddress)
