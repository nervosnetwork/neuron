import React, { useEffect, useState, useMemo, useCallback } from 'react'
import { useState as useGlobalState, useDispatch, showPageNotice } from 'states'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'

import appState from 'states/init/app'

import {
  backToTop,
  calculateFee,
  ConnectionStatus,
  SyncStatus,
  shannonToCKBFormatter,
  getCurrentUrl,
  getSyncStatus,
  clsx,
  useClearGeneratedTx,
} from 'utils'

import DepositRulesDialog from 'components/DepositRulesDialog'
import DepositDialog from 'components/DepositDialog'
import WithdrawDialog from 'components/WithdrawDialog'
import DAORecord, { DAORecordProps } from 'components/NervosDAORecord'
import PageContainer from 'components/PageContainer'
import CopyZone from 'widgets/CopyZone'
import { ArrowNext, Attention, Deposit, EyesClose, EyesOpen, DepositTimeSort } from 'widgets/Icons/icon'
import TableNoData from 'widgets/Icons/TableNoData.png'
import { HIDE_BALANCE } from 'utils/const'
import Tooltip from 'widgets/Tooltip'
import Button from 'widgets/Button'

import useGetCountDownAndFeeRateStats from 'utils/hooks/useGetCountDownAndFeeRateStats'
import hooks, { useDepositDialog } from './hooks'
import styles from './nervosDAO.module.scss'

const NervosDAO = () => {
  const [tabIdx, setTabIdx] = useState('0')
  const {
    app: {
      send = appState.send,
      loadings: { sending = false },
      tipDao,
      tipBlockTimestamp,
      epoch,
      pageNotice,
    },
    wallet,
    nervosDAO: { records },
    chain: {
      connectionStatus,
      syncState: { cacheTipBlockNumber, bestKnownBlockNumber, bestKnownBlockTimestamp },
      networkID,
    },
    settings: { networks },
  } = useGlobalState()
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const [t, { language }] = useTranslation()
  const { suggestFeeRate } = useGetCountDownAndFeeRateStats()
  const [isPrivacyMode, setIsPrivacyMode] = useState(false)
  const [activeRecord, setActiveRecord] = useState<State.NervosDAORecord | null>(null)
  const [withdrawList, setWithdrawList] = useState<Map<string, string | null>>(new Map())
  const [globalAPC, setGlobalAPC] = useState(0)
  const [genesisBlockTimestamp, setGenesisBlockTimestamp] = useState<number | undefined>(undefined)
  const [depositEpochList, setDepositEpochList] = useState<Map<string, string | null>>(new Map())
  const clearGeneratedTx = useClearGeneratedTx()
  const { showDepositDialog, onOpenDepositDialog, onCloseDepositDialog } = useDepositDialog()
  const [showRules, setShowRules] = useState(false)
  const [isDescDirection, setIsDescDirection] = useState(true)

  const onWithdrawDialogDismiss = hooks.useOnWithdrawDialogDismiss(setActiveRecord)

  const genesisBlockHash = useMemo(() => networks.find(v => v.id === networkID)?.genesisHash, [networkID, networks])
  hooks.useInitData({
    clearGeneratedTx,
    dispatch,
    wallet,
    setGenesisBlockTimestamp,
    genesisBlockHash,
  })
  hooks.useUpdateGlobalAPC({ bestKnownBlockTimestamp, genesisBlockTimestamp, setGlobalAPC })
  const onWithdrawDialogSubmit = hooks.useOnWithdrawDialogSubmit({
    activeRecord,
    setActiveRecord,
    clearGeneratedTx,
    walletID: wallet.id,
    dispatch,
    suggestFeeRate,
  })

  const onDepositSuccess = useCallback(() => {
    onCloseDepositDialog()
    showPageNotice('nervos-dao.deposit-submitted')(dispatch)
  }, [dispatch, onCloseDepositDialog])

  const onActionClick = hooks.useOnActionClick({
    records,
    clearGeneratedTx,
    dispatch,
    walletID: wallet.id,
    setActiveRecord,
    navigate,
  })

  const handleOpenRules = useCallback(() => {
    setShowRules(true)
  }, [setShowRules])

  const handleCloseRules = useCallback(() => {
    setShowRules(false)
  }, [setShowRules])

  hooks.useUpdateDepositEpochList({ records, setDepositEpochList, connectionStatus })

  const fee = `${shannonToCKBFormatter(
    send.generatedTx ? send.generatedTx.fee || calculateFee(send.generatedTx) : '0'
  )} CKB`
  hooks.useUpdateWithdrawList({
    records,
    tipDao,
    setWithdrawList,
  })

  const syncStatus = getSyncStatus({
    bestKnownBlockNumber,
    bestKnownBlockTimestamp,
    cacheTipBlockNumber,
    currentTimestamp: Date.now(),
    url: getCurrentUrl(networkID, networks),
    networkID,
  })

  const toggleDirection = useCallback(() => {
    setIsDescDirection(!isDescDirection)
  }, [setIsDescDirection, isDescDirection])

  const MemoizedRecords = useMemo(() => {
    const onTabClick = (e: React.SyntheticEvent<HTMLDivElement, MouseEvent>) => {
      const {
        dataset: { idx },
      } = e.target as HTMLDivElement
      if (idx) {
        setTabIdx(idx)
      }
    }
    const filteredRecord = records.filter(record => {
      if (record.status === 'failed') {
        return false
      }

      if (tabIdx === '0') {
        return record.status !== 'dead'
      }
      return record.status === 'dead'
    })

    if (tabIdx === '0') {
      filteredRecord.sort((r1, r2) =>
        isDescDirection
          ? +r2.depositInfo!.timestamp! - +r1.depositInfo!.timestamp!
          : +r1.depositInfo!.timestamp! - +r2.depositInfo!.timestamp!
      )
    } else if (tabIdx === '1') {
      filteredRecord.sort((r1, r2) => +r2.unlockInfo!.timestamp! - +r1.unlockInfo!.timestamp!)
    }

    return (
      <>
        <div className={styles.tabContainer}>
          <div
            role="presentation"
            className={styles.recordTab}
            style={{ '--selected-tab': tabIdx }}
            onClick={onTabClick}
          >
            <div className={styles.underline} />
            <button
              className={clsx({ [styles.active]: tabIdx === '0' }, styles.tab)}
              type="button"
              role="tab"
              data-idx="0"
            >
              {t('nervos-dao.deposit-records')}
            </button>
            <button
              className={clsx({ [styles.active]: tabIdx === '1' }, styles.tab)}
              type="button"
              role="tab"
              data-idx="1"
            >
              {t('nervos-dao.completed-records')}
            </button>
          </div>

          {tabIdx === '0' ? (
            <Tooltip tip={t('Deposit Time')} placement="left-top">
              <Button type="text" className={styles.sortBtn} data-desc={isDescDirection} onClick={toggleDirection}>
                <DepositTimeSort />
              </Button>
            </Tooltip>
          ) : null}
        </div>
        {filteredRecord.length ? (
          <div className={styles.records}>
            {filteredRecord.map(record => {
              const key = record.depositOutPoint
                ? `${record.depositOutPoint.txHash}-${record.depositOutPoint.index}`
                : `${record.outPoint.txHash}-${record.outPoint.index}`
              const txHash = record.depositOutPoint ? record.depositOutPoint.txHash : record.outPoint.txHash

              const props: DAORecordProps = {
                ...record,
                tipBlockTimestamp,
                withdrawCapacity: withdrawList.get(key) || null,
                onClick: onActionClick,
                depositEpoch: depositEpochList.get(txHash) || '',
                currentEpoch: epoch,
                genesisBlockTimestamp,
                connectionStatus,
                isPrivacyMode,
                hasCkbBalance: +wallet.balance > 0,
              }
              return <DAORecord key={key} {...props} />
            })}
          </div>
        ) : (
          <div className={styles.noRecords}>
            <img src={TableNoData} alt="No Data" />
            {t(`nervos-dao.deposit-record.no-${tabIdx === '0' ? 'deposit' : 'completed'}`)}
          </div>
        )}
      </>
    )
  }, [
    records,
    withdrawList,
    t,
    onActionClick,
    epoch,
    connectionStatus,
    genesisBlockTimestamp,
    tipBlockTimestamp,
    depositEpochList,
    tabIdx,
    setTabIdx,
    isPrivacyMode,
    isDescDirection,
    toggleDirection,
  ])

  useEffect(() => {
    backToTop()
  }, [])

  const MemoizedDepositDialog = useMemo(() => {
    return (
      <DepositDialog
        balance={wallet.balance}
        walletID={wallet.id}
        show={showDepositDialog}
        fee={fee}
        onCloseDepositDialog={onCloseDepositDialog}
        isDepositing={sending}
        isTxGenerated={!!send.generatedTx}
        suggestFeeRate={suggestFeeRate}
        globalAPC={globalAPC}
        onDepositSuccess={onDepositSuccess}
      />
    )
  }, [
    wallet.balance,
    wallet.id,
    showDepositDialog,
    fee,
    onCloseDepositDialog,
    sending,
    send.generatedTx,
    suggestFeeRate,
    globalAPC,
  ])

  const MemoizedWithdrawDialog = useMemo(() => {
    return activeRecord ? (
      <WithdrawDialog
        record={activeRecord}
        onDismiss={onWithdrawDialogDismiss}
        onSubmit={onWithdrawDialogSubmit}
        tipDao={tipDao}
        currentEpoch={epoch}
      />
    ) : null
  }, [activeRecord, onWithdrawDialogDismiss, onWithdrawDialogSubmit, tipDao, epoch])

  const free = BigInt(wallet.balance)
  const locked = records
    .filter(record => !(record.unlockInfo && record.status === 'dead'))
    .reduce((acc, record) => {
      const key = record.depositOutPoint
        ? `${record.depositOutPoint.txHash}-${record.depositOutPoint.index}`
        : `${record.outPoint.txHash}-${record.outPoint.index}`

      return acc + BigInt(withdrawList.get(key) || 0)
    }, BigInt(0))

  const onlineAndSynced = ConnectionStatus.Online === connectionStatus && SyncStatus.SyncCompleted === syncStatus

  const isChinese = language === 'zh' || language.startsWith('zh-')

  return (
    <PageContainer
      head={
        <div className={styles.pageHead}>
          Nervos DAO
          {isPrivacyMode ? (
            <EyesClose onClick={() => setIsPrivacyMode(false)} />
          ) : (
            <EyesOpen onClick={() => setIsPrivacyMode(true)} />
          )}
        </div>
      }
      notice={pageNotice}
    >
      <div className={styles.header}>
        <div className={styles.daoOverview}>
          <div className={clsx(styles.field, styles.free)}>
            <div className={styles.name}>{t(`nervos-dao.free`)}</div>
            <div className={styles.value}>
              {isPrivacyMode ? (
                <>
                  <span className={styles.number}>{HIDE_BALANCE}</span> CKB
                </>
              ) : (
                <CopyZone
                  content={shannonToCKBFormatter(`${free}`, false, '')}
                  name={t('nervos-dao.copy-balance')}
                  className={styles.balance}
                >
                  <span className={styles.number}>{shannonToCKBFormatter(`${free}`)}</span> CKB
                </CopyZone>
              )}
            </div>
          </div>

          <div className={clsx(styles.field, styles.locked)}>
            <div className={styles.name}>{t(`nervos-dao.locked`)}</div>
            <div className={styles.value}>
              {onlineAndSynced && !isPrivacyMode ? (
                <CopyZone
                  content={shannonToCKBFormatter(`${locked}`, false, '')}
                  name={t('nervos-dao.copy-balance')}
                  className={styles.balance}
                >
                  <span className={styles.number}>
                    {isPrivacyMode ? HIDE_BALANCE : shannonToCKBFormatter(`${locked}`)}
                  </span>{' '}
                  CKB
                </CopyZone>
              ) : (
                <div>
                  <span className={styles.number}>{!onlineAndSynced ? '--' : HIDE_BALANCE}</span> CKB
                </div>
              )}
            </div>
          </div>

          <div className={clsx(styles.field, styles.apc)}>
            <div className={styles.name}>
              {t(`nervos-dao.apc`)}
              {isChinese ? null : (
                <span className={styles.tooltip} data-tooltip={t(`nervos-dao.apc-tooltip`)}>
                  <Attention />
                </span>
              )}
            </div>
            <div className={styles.value}>
              {isPrivacyMode ? (
                <span className={styles.number}>******</span>
              ) : (
                <>
                  ≈ <span className={styles.number}>{globalAPC}%</span>
                </>
              )}
            </div>
          </div>
        </div>

        <div className={styles.deposit}>
          <span
            onClick={handleOpenRules}
            onKeyPress={handleOpenRules}
            role="link"
            tabIndex={0}
            className={styles.rules}
          >
            {t('nervos-dao.deposit-rules')}
            <ArrowNext />
          </span>

          <button
            className={styles.action}
            type="button"
            disabled={connectionStatus === 'offline' || sending || !wallet.balance}
            onClick={onOpenDepositDialog}
          >
            <Deposit />
            {t('nervos-dao.deposit')}
          </button>
        </div>
      </div>

      <div className={styles.recordsContainer}>{MemoizedRecords}</div>

      {MemoizedDepositDialog}
      {MemoizedWithdrawDialog}

      <DepositRulesDialog show={showRules} onClose={handleCloseRules} />
    </PageContainer>
  )
}

NervosDAO.displayName = 'NervosDAO'

export default NervosDAO
