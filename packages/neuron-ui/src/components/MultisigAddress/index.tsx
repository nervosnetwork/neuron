import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Trans, useTranslation } from 'react-i18next'
import {
  isMainnet as isMainnetUtil,
  shannonToCKBFormatter,
  useExitOnWalletChange,
  useGoBack,
  useOnWindowResize,
} from 'utils'
import { useState as useGlobalState } from 'states'
import MultisigAddressCreateDialog from 'components/MultisigAddressCreateDialog'
import MultisigAddressInfo from 'components/MultisigAddressInfo'
import SendFromMultisigDialog from 'components/SendFromMultisigDialog'
import { MultisigConfig, changeMultisigSyncStatus, openExternal } from 'services/remote'
import ApproveMultisigTxDialog from 'components/ApproveMultisigTxDialog'
import Dialog from 'widgets/Dialog'
import Table from 'widgets/Table'
import Tooltip from 'widgets/Tooltip'
import AlertDialog from 'widgets/AlertDialog'
import {
  Download,
  Search,
  AddSimple,
  Details,
  Delete,
  Confirm,
  Transfer,
  Upload,
  Edit,
  Confirming,
  Question,
  LineDownArrow,
} from 'widgets/Icons/icon'
import AttentionCloseDialog from 'widgets/Icons/Attention.png'
import { HIDE_BALANCE, NetworkType } from 'utils/const'
import { onEnter } from 'utils/inputDevice'
import getMultisigSignStatus from 'utils/getMultisigSignStatus'
import Button from 'widgets/Button'
import SetStartBlockNumberDialog from 'components/SetStartBlockNumberDialog'
import { type TFunction } from 'i18next'
import {
  useSearch,
  useConfigManage,
  useExportConfig,
  useActions,
  useSubscription,
  useCancelWithLightClient,
  useSetStartBlockNumber,
} from './hooks'

import styles from './multisigAddress.module.scss'

const ApproveKey = 'approve'
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
    key: ApproveKey,
    icon: <Confirm />,
  },
]

const LearnMore = React.memo(({ t }: { t: TFunction }) => (
  <button
    type="button"
    onClick={() => {
      openExternal(`https://neuron.magickbase.com/posts/issues/3193`)
    }}
    aria-label={t('multisig-address.learn-more')}
    title={t('multisig-address.learn-more')}
  >
    {t('multisig-address.learn-more')}
  </button>
))

const MultisigAddress = () => {
  const [t] = useTranslation()
  useExitOnWalletChange()
  const {
    wallet: { id: walletId, addresses },
    chain: {
      syncState: { bestKnownBlockNumber },
      networkID,
      connectionStatus,
    },
    settings: { networks = [] },
  } = useGlobalState()
  const isMainnet = isMainnetUtil(networks, networkID)
  const isLightClient = useMemo(
    () => networks.find(n => n.id === networkID)?.type === NetworkType.Light,
    [networks, networkID]
  )
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const {
    allConfigs,
    saveConfig,
    onUpdateConfig,
    onUpdateConfigAlias,
    deleteConfigById,
    onImportConfig,
    configs,
    onFilterConfig,
  } = useConfigManage({
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
  const {
    onCancel: onCancelWithLight,
    isCloseWarningDialogShow,
    onCancelCloseMultisigDialog,
  } = useCancelWithLightClient()
  const {
    isSetStartBlockShown,
    openDialog: openSetStartBlockNumber,
    lastStartBlockNumber,
    address,
    onConfirm,
    onCancel,
  } = useSetStartBlockNumber({ onUpdateConfig })

  useEffect(() => {
    if (isLightClient) {
      changeMultisigSyncStatus(true)
    }
    return () => {
      if (isLightClient) {
        changeMultisigSyncStatus(false)
      }
    }
  }, [isLightClient])
  const titleRef = useRef<HTMLDivElement | null>(null)
  const [tipPosition, setTipPosition] = useState<{ left?: number; top?: number }>({})
  const updateTipPosition = useCallback(() => {
    if (titleRef.current) {
      const boundingClientRect = titleRef.current.getBoundingClientRect()
      setTipPosition({
        left: boundingClientRect.left - 18,
        top: boundingClientRect.top - boundingClientRect.height,
      })
    }
  }, [titleRef.current, setTipPosition])
  useEffect(() => {
    updateTipPosition()
  }, [updateTipPosition])
  useOnWindowResize(updateTipPosition)

  return (
    <div>
      <Dialog
        show
        title={
          <div ref={titleRef} className={styles.title}>
            {t('multisig-address.window-title')}
            <Tooltip
              className={styles.multiGuideTip}
              tip={<Trans i18nKey="multisig-address.guide-tip" components={[<LearnMore t={t} />]} />}
              placement="top"
              showTriangle
              tipClassName={styles.multiGuide}
              tipStyles={tipPosition}
            >
              <Question />
            </Tooltip>
          </div>
        }
        onCancel={isLightClient ? onCancelWithLight : onBack}
        showFooter={false}
      >
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
                                onChange={onUpdateConfigAlias(item.id)}
                                onKeyDown={onUpdateConfigAlias(item.id)}
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
                    return (
                      <div className={styles.syncBlock}>
                        {connectionStatus === 'online' ? <Confirming className={styles.syncing} /> : null}
                        {multisigSyncProgress?.[item.fullPayload] ?? 0}
                        <Button
                          type="text"
                          onClick={openSetStartBlockNumber}
                          data-id={item.id}
                          data-address={item.fullPayload}
                          data-start-block-number={item.startBlockNumber}
                        >
                          <Edit />
                        </Button>
                      </div>
                    )
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
                    const { canSign } = getMultisigSignStatus({ multisigConfig: item, addresses })
                    return (
                      <div className={styles.action}>
                        <Tooltip
                          tipClassName={styles.tip}
                          className={styles.tipContent}
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
                                  disabled={key === ApproveKey ? !canSign || disabled : disabled}
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
                          <div className={styles.hoverBtn}>
                            {t('multisig-address.table.more')}
                            <LineDownArrow className={styles.expand} />
                          </div>
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

      <Dialog
        title={t('multisig-address.multi-details')}
        show={isCloseWarningDialogShow}
        onConfirm={onBack}
        onCancel={onCancelCloseMultisigDialog}
        confirmText={t('multisig-address.ok')}
        contentClassName={styles.closeMutisigContent}
        className={styles.closeMultisigDialog}
        confirmProps={{ type: 'cancel', className: styles.confirmBtn }}
      >
        <img src={AttentionCloseDialog} alt="Synchronization Abort" />
        <h4>{t('multisig-address.synchronization-abort')}</h4>
        <p>{t('multisig-address.synchronization-abort-msg')}</p>
      </Dialog>

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
      {address ? (
        <SetStartBlockNumberDialog
          show={isSetStartBlockShown}
          headerTipNumber={bestKnownBlockNumber}
          initStartBlockNumber={lastStartBlockNumber}
          isMainnet={isMainnet}
          address={address}
          onUpdateStartBlockNumber={onConfirm}
          onCancel={onCancel}
        />
      ) : null}
    </div>
  )
}

MultisigAddress.displayName = 'MultisigAddress'

export default MultisigAddress
