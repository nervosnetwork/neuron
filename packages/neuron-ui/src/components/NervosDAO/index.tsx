import React, { useEffect, useState, useMemo, useCallback } from 'react'
import { useState as useGlobalState, useDispatch } from 'states'
import { useTranslation } from 'react-i18next'

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

import { openExternal } from 'services/remote'

import DepositDialog from 'components/DepositDialog'
import WithdrawDialog from 'components/WithdrawDialog'
import DAORecord, { DAORecordProps } from 'components/NervosDAORecord'
import PageContainer from 'components/PageContainer'
import CopyZone from 'widgets/CopyZone'
import { ArrowNext, Attention, Deposit, EyesClose, EyesOpen } from 'widgets/Icons/icon'
import TableNoData from 'widgets/Icons/TableNoData.png'
import { HIDE_BALANCE } from 'utils/const'

import useGetCountDownAndFeeRateStats from 'utils/hooks/useGetCountDownAndFeeRateStats'
import hooks, { useDepositDialog } from './hooks'
import styles from './nervosDAO.module.scss'

const DAO_DOCS_URL = 'https://docs.nervos.org/docs/basics/guides/crypto%20wallets/neuron/#deposit-ckb-into-nervos-dao'

const NervosDAO = () => {
  const [tabIdx, setTabIdx] = useState('0')
  const {
    app: {
      send = appState.send,
      loadings: { sending = false },
      tipDao,
      tipBlockTimestamp,
      epoch,
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

  const onActionClick = hooks.useOnActionClick({
    records,
    clearGeneratedTx,
    dispatch,
    walletID: wallet.id,
    setActiveRecord,
  })

  const handleOpenRules = useCallback(() => {
    openExternal(DAO_DOCS_URL)
  }, [])

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
  })

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

    if (tabIdx === '1') {
      filteredRecord.sort((r1, r2) => +r2.unlockInfo!.timestamp! - +r1.unlockInfo!.timestamp!)
    }

    return (
      <>
        <div role="presentation" className={styles.recordTab} style={{ '--selected-tab': tabIdx }} onClick={onTabClick}>
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

  const isEnglish = language === 'en' || language.startsWith('en-')

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
              {isEnglish && (
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
    </PageContainer>
  )
}

NervosDAO.displayName = 'NervosDAO'

export default NervosDAO
