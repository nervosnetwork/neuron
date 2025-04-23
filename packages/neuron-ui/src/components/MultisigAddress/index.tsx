import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Trans, useTranslation } from 'react-i18next'
import {
  isMainnet as isMainnetUtil,
  shannonToCKBFormatter,
  useExitOnWalletChange,
  useGoBack,
  useOnWindowResize,
  calculateFee,
} from 'utils'
import appState from 'states/init/app'
import { useState as useGlobalState } from 'states'
import MultisigAddressCreateDialog from 'components/MultisigAddressCreateDialog'
import MultisigAddressInfo from 'components/MultisigAddressInfo'
import SendFromMultisigDialog from 'components/SendFromMultisigDialog'
import { MultisigConfig, changeMultisigSyncStatus, openExternal } from 'services/remote'
import ApproveMultisigTxDialog from 'components/ApproveMultisigTxDialog'
import DepositDialog from 'components/DepositDialog'
import MultisigAddressNervosDAODialog from 'components/MultisigAddressNervosDAODialog'
import Dialog from 'widgets/Dialog'
import Table from 'widgets/Table'
import Tooltip from 'widgets/Tooltip'
import Toast from 'widgets/Toast'
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
  DAODeposit,
  DAOWithdrawal,
  Attention,
  Regenerate,
} from 'widgets/Icons/icon'
import { getHeader } from 'services/chain'
import AttentionCloseDialog from 'widgets/Icons/Attention.png'
import { HIDE_BALANCE, NetworkType } from 'utils/const'
import { onEnter } from 'utils/inputDevice'
import getMultisigSignStatus from 'utils/getMultisigSignStatus'
import useGetCountDownAndFeeRateStats from 'utils/hooks/useGetCountDownAndFeeRateStats'
import Button from 'widgets/Button'
import SetStartBlockNumberDialog from 'components/SetStartBlockNumberDialog'
import { type TFunction } from 'i18next'
import hooks from 'components/NervosDAO/hooks'
import { remaindRegenerateMultisigAddress } from 'services/localCache'
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
  {
    key: 'daoDeposit',
    icon: <DAODeposit />,
  },
  {
    key: 'daoWithdraw',
    icon: <DAOWithdrawal />,
  },
  {
    key: 'regenerate',
    icon: <Regenerate />,
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
    app: {
      send = appState.send,
      loadings: { sending = false },
    },
    wallet,
    chain: {
      syncState: { bestKnownBlockNumber, bestKnownBlockTimestamp },
      networkID,
      connectionStatus,
    },
    settings: { networks = [] },
  } = useGlobalState()
  const { id: walletId, addresses } = wallet
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
    regenerateConfig,
  } = useConfigManage({
    walletId,
    isMainnet,
  })
  const { multisigBanlances, multisigDaoBalances, multisigSyncProgress } = useSubscription({
    walletId,
    isMainnet,
    configs: allConfigs,
    isLightClient,
  })
  const { deleteAction, infoAction, sendAction, approveAction, daoDepositAction, daoWithdrawAction, regenerateAction } =
    useActions({
      deleteConfigById,
      regenerateConfig,
    })
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [showRegenerateDialog, setShowRegenerateDialog] = useState(false)
  const { suggestFeeRate } = useGetCountDownAndFeeRateStats()
  const [globalAPC, setGlobalAPC] = useState(0)
  const [genesisBlockTimestamp, setGenesisBlockTimestamp] = useState<number | undefined>(undefined)
  const [notice, setNotice] = useState('')

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
        case 'daoDeposit':
          daoDepositAction.action(multisigConfig)
          break
        case 'daoWithdraw':
          daoWithdrawAction.action(multisigConfig)
          break
        case 'regenerate':
          if (remaindRegenerateMultisigAddress.get()) {
            regenerateAction.action(multisigConfig)
          } else {
            regenerateAction.setConfig(multisigConfig)
            setShowRegenerateDialog(true)
          }
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

  const getListActionOptions = useCallback(
    (config: MultisigConfig) => {
      const options: typeof listActionOptions = []
      listActionOptions.forEach(item => {
        if (config.isLegacy && ['daoDeposit', 'daoWithdraw'].includes(item.key)) {
          return
        }
        if (!config.isLegacy && ['regenerate'].includes(item.key)) {
          return
        }
        if (!multisigBanlances[config.fullPayload] || multisigBanlances[config.fullPayload] === '0') {
          options.push({
            ...item,
            disabled: item.disabled || item.key === 'send',
          })
        } else {
          options.push(item)
        }
      })
      return options
    },
    [listActionOptions, multisigBanlances]
  )

  const daoDisabledMessage = useMemo(() => {
    if (!wallet.device) return ''

    if (
      (daoDepositAction.depositFromMultisig && daoDepositAction.isDialogOpen) ||
      (daoWithdrawAction.withdrawFromMultisig && daoWithdrawAction.isDialogOpen)
    ) {
      const multisigConfig = daoDepositAction.depositFromMultisig || daoWithdrawAction.withdrawFromMultisig
      const { canSign } = getMultisigSignStatus({
        multisigConfig: multisigConfig!,
        addresses,
      })

      return canSign ? 'dao-ledger-notice' : 'dao-hardware-not-match'
    }

    return ''
  }, [daoDepositAction, daoWithdrawAction, wallet.device, addresses])

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

  const genesisBlockHash = useMemo(() => networks.find(v => v.id === networkID)?.genesisHash, [networkID, networks])

  useEffect(() => {
    if (genesisBlockHash) {
      getHeader(genesisBlockHash)
        .then(header => setGenesisBlockTimestamp(+header.timestamp))
        .catch(err => console.error(err))
    }
  }, [])

  hooks.useUpdateGlobalAPC({ bestKnownBlockTimestamp, genesisBlockTimestamp, setGlobalAPC })

  const fee = `${shannonToCKBFormatter(
    send.generatedTx ? send.generatedTx.fee || calculateFee(send.generatedTx) : '0'
  )} CKB`

  const onDepositSuccess = useCallback(() => {
    daoDepositAction.closeDialog()
    setNotice(t('nervos-dao.deposit-submitted'))
    if (daoDepositAction.depositFromMultisig) {
      daoWithdrawAction.action(daoDepositAction.depositFromMultisig)
    }
  }, [t, setNotice, daoDepositAction, daoWithdrawAction])

  const showDaoMultisigScriptNotice = useMemo(() => {
    return allConfigs.some(config => config.isLegacy)
  }, [allConfigs])

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
          {showDaoMultisigScriptNotice && (
            <div className={styles.topTip}>
              <Attention />
              <div>
                <Trans
                  i18nKey="multisig-address.multisig-script-update-notice"
                  components={[
                    <button
                      type="button"
                      onClick={() => openExternal('https://github.com/Magickbase/neuron-public-issues/issues/457')}
                    >
                      {' '}
                    </button>,
                  ]}
                />
              </div>
            </div>
          )}
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
                        {item.isLegacy && <div className={styles.legacy}>Legacy</div>}
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
                        <div>
                          {show ? shannonToCKBFormatter(multisigBanlances[item.fullPayload] || '0') : HIDE_BALANCE} CKB
                        </div>
                        {!item.isLegacy && multisigDaoBalances[item.fullPayload] && (
                          <div>
                            (Nervos DAO:
                            {show ? shannonToCKBFormatter(multisigDaoBalances[item.fullPayload]) : HIDE_BALANCE} CKB)
                          </div>
                        )}
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
                              {getListActionOptions(item).map(({ key, label, icon, disabled }) => (
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

          <Toast content={notice} onDismiss={() => setNotice('')} />
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

      <AlertDialog
        show={showRegenerateDialog}
        className={styles.regenerateDialog}
        title={t('multisig-address.regenerate-dialog.title')}
        message={
          <div className={styles.regenerateDialogDetail}>
            <div>
              {t('multisig-address.regenerate-dialog.detail')}
              <br />
              {t('multisig-address.regenerate-dialog.donnot-worry')}
            </div>

            <label htmlFor="receiver" className={styles.checkboxWrap}>
              <input
                type="checkbox"
                id="receiver"
                onChange={regenerateAction.handleCheckbox}
                checked={regenerateAction.isNoRemind}
              />
              <span>{t('multisig-address.regenerate-dialog.donnot-remind-again')}</span>
            </label>
          </div>
        }
        type="warning"
        onCancel={() => setShowRegenerateDialog(false)}
        okText={t('multisig-address.regenerate-dialog.title')}
        onOk={() => {
          regenerateAction.action(regenerateAction.config!)
          setShowRegenerateDialog(false)
        }}
      />

      <AlertDialog
        show={regenerateAction.isDialogOpen}
        title={regenerateAction.regenerateErrorMessage}
        type="failed"
        onCancel={regenerateAction.closeDialog}
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

      {!daoDisabledMessage && daoDepositAction.depositFromMultisig && daoDepositAction.isDialogOpen ? (
        <DepositDialog
          balance={multisigBanlances[daoDepositAction.depositFromMultisig.fullPayload]}
          wallet={wallet}
          show
          fee={fee}
          onCloseDepositDialog={daoDepositAction.closeDialog}
          isDepositing={sending}
          isTxGenerated={!!send.generatedTx}
          suggestFeeRate={suggestFeeRate}
          globalAPC={globalAPC}
          onDepositSuccess={onDepositSuccess}
          multisigConfig={daoDepositAction.depositFromMultisig}
        />
      ) : null}

      {!daoDisabledMessage && daoWithdrawAction.withdrawFromMultisig && daoWithdrawAction.isDialogOpen ? (
        <MultisigAddressNervosDAODialog
          closeDialog={daoWithdrawAction.closeDialog}
          multisigConfig={daoWithdrawAction.withdrawFromMultisig}
        />
      ) : null}

      <AlertDialog
        show={!!daoDisabledMessage}
        message={t(`multisig-address.${daoDisabledMessage}`)}
        type="warning"
        okProps={{ style: { display: 'none' } }}
        onCancel={() => {
          daoDepositAction.closeDialog()
          daoWithdrawAction.closeDialog()
        }}
      />
    </div>
  )
}

MultisigAddress.displayName = 'MultisigAddress'

export default MultisigAddress
