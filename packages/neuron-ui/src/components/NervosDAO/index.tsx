import React, { useEffect, useState, useMemo, useCallback } from 'react'
import { useState as useGlobalState, useDispatch } from 'states'
import { useTranslation } from 'react-i18next'

import appState from 'states/init/app'

import {
  CONSTANTS,
  backToTop,
  calculateFee,
  ConnectionStatus,
  SyncStatus,
  shannonToCKBFormatter,
  getCurrentUrl,
  getSyncStatus,
  CKBToShannonFormatter,
  clsx,
  padFractionDigitsIfDecimal,
} from 'utils'

import { openExternal } from 'services/remote'

import DepositDialog from 'components/DepositDialog'
import WithdrawDialog from 'components/WithdrawDialog'
import DAORecord, { DAORecordProps } from 'components/NervosDAORecord'
import PageContainer from 'components/PageContainer'
import CopyZone from 'widgets/CopyZone'
import { ArrowNext, Deposit, EyesClose, EyesOpen, Tooltip } from 'widgets/Icons/icon'
import TableNoData from 'widgets/Icons/TableNoData.png'
import { HIDE_BALANCE } from 'utils/const'

import useGetCountDownAndFeeRateStats from 'utils/hooks/useGetCountDownAndFeeRateStats'
import hooks from './hooks'
import styles from './nervosDAO.module.scss'

const { MIN_DEPOSIT_AMOUNT } = CONSTANTS

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
  const [t, { language }] = useTranslation()
  const { suggestFeeRate } = useGetCountDownAndFeeRateStats()
  const [isPrivacyMode, setIsPrivacyMode] = useState(false)
  const [depositValue, setDepositValue] = useState(`${MIN_DEPOSIT_AMOUNT}`)
  const [showDepositDialog, setShowDepositDialog] = useState(false)
  const [activeRecord, setActiveRecord] = useState<State.NervosDAORecord | null>(null)
  const [errorMessage, setErrorMessage] = useState('')
  const [withdrawList, setWithdrawList] = useState<Map<string, string | null>>(new Map())
  const [globalAPC, setGlobalAPC] = useState(0)
  const [genesisBlockTimestamp, setGenesisBlockTimestamp] = useState<number | undefined>(undefined)
  const [maxDepositAmount, setMaxDepositAmount] = useState<bigint>(BigInt(wallet.balance))
  const [maxDepositTx, setMaxDepositTx] = useState<any>(undefined)
  const [maxDepositErrorMessage, setMaxDepositErrorMessage] = useState('')
  const [depositEpochList, setDepositEpochList] = useState<Map<string, string | null>>(new Map())
  const [isBalanceReserved, setIsBalanceReserved] = useState(true)
  const clearGeneratedTx = hooks.useClearGeneratedTx(dispatch)
  hooks.useGenerateDaoDepositTx({
    setErrorMessage,
    clearGeneratedTx,
    maxDepositAmount,
    maxDepositTx,
    dispatch,
    walletID: wallet.id,
    maxDepositErrorMessage,
    isBalanceReserved,
    t,
    depositValue,
    suggestFeeRate,
  })
  const updateDepositValue = hooks.useUpdateDepositValue({ setDepositValue })

  const onDepositValueChange = hooks.useOnDepositValueChange({ updateDepositValue })
  const onDepositDialogDismiss = hooks.useOnDepositDialogDismiss({
    setShowDepositDialog,
    setDepositValue,
    setErrorMessage,
  })

  const onDepositDialogSubmit = hooks.useOnDepositDialogSubmit({
    setShowDepositDialog,
    setDepositValue,
    dispatch,
    walletID: wallet.id,
  })
  const onWithdrawDialogDismiss = hooks.useOnWithdrawDialogDismiss(setActiveRecord)

  hooks.useUpdateMaxDeposit({
    wallet,
    setMaxDepositAmount,
    setMaxDepositTx,
    setMaxDepositErrorMessage,
    isBalanceReserved,
    suggestFeeRate,
  })
  const genesisBlockHash = useMemo(() => networks.find(v => v.id === networkID)?.genesisHash, [networkID, networks])
  hooks.useInitData({
    clearGeneratedTx,
    dispatch,
    updateDepositValue,
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

  const onSlide = hooks.useOnSlide({ updateDepositValue, maxDepositAmount })
  hooks.useUpdateDepositEpochList({ records, setDepositEpochList, connectionStatus })

  const onIsBalanceReservedChange = (e: React.SyntheticEvent<HTMLInputElement>) => {
    setErrorMessage('')
    setIsBalanceReserved(!e.currentTarget.checked)
  }

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

  const onOpenDepositDialog = useCallback(() => {
    setDepositValue(`${MIN_DEPOSIT_AMOUNT}`)
    setShowDepositDialog(true)
  }, [])

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
          <button className={clsx({ [styles.active]: tabIdx === '0' })} type="button" role="tab" data-idx="0">
            {t('nervos-dao.deposit-records')}
          </button>
          <button className={clsx({ [styles.active]: tabIdx === '1' })} type="button" role="tab" data-idx="1">
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

  const onDepositDialogOpen = useCallback(() => {
    clearGeneratedTx()
  }, [clearGeneratedTx])

  useEffect(() => {
    backToTop()
  }, [])

  useEffect(() => {
    try {
      if (BigInt(CKBToShannonFormatter(depositValue)) > maxDepositAmount) {
        const amount = shannonToCKBFormatter(`${maxDepositAmount}`, false, '')
        setDepositValue(padFractionDigitsIfDecimal(amount, 8))
      }
    } catch (error) {
      // ignore error
      // When the depositValue is invalid, it displays the error in the textField, but it will throw an exception when valid wheater it's big than the max deposit value
      // and when the depositValue is invalid, it's no need to set max depositValue.
    }
  }, [maxDepositAmount, depositValue, setDepositValue])

  const MemoizedDepositDialog = useMemo(() => {
    return (
      <DepositDialog
        show={showDepositDialog}
        value={depositValue}
        fee={fee}
        onChange={onDepositValueChange}
        onOpen={onDepositDialogOpen}
        onDismiss={onDepositDialogDismiss}
        onSubmit={onDepositDialogSubmit}
        onSlide={onSlide}
        maxDepositAmount={maxDepositAmount}
        isDepositing={sending}
        errorMessage={errorMessage}
        isTxGenerated={!!send.generatedTx}
        isBalanceReserved={isBalanceReserved}
        onIsBalanceReservedChange={onIsBalanceReservedChange}
      />
    )
    // eslint-disable-next-line
  }, [
    showDepositDialog,
    depositValue,
    fee,
    onDepositDialogOpen,
    onDepositDialogDismiss,
    onDepositDialogSubmit,
    onSlide,
    maxDepositAmount,
    sending,
    errorMessage,
    send.generatedTx,
    isBalanceReserved,
    onIsBalanceReservedChange,
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
      notice={pageNotice}
    >
      <div className={styles.header}>
        <div className={styles.daoOverview}>
          <div className={clsx(styles.field, styles.free)}>
            <div className={styles.name}>{t(`nervos-dao.free`)}</div>
            <div className={styles.value}>
              <CopyZone
                content={shannonToCKBFormatter(`${free}`, false, '')}
                name={t('nervos-dao.copy-balance')}
                className={styles.balance}
              >
                <span className={styles.number}>{isPrivacyMode ? HIDE_BALANCE : shannonToCKBFormatter(`${free}`)}</span>{' '}
                CKB
              </CopyZone>
            </div>
          </div>

          <div className={clsx(styles.field, styles.locked)}>
            <div className={styles.name}>{t(`nervos-dao.locked`)}</div>
            <div className={styles.value}>
              {onlineAndSynced ? (
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
                <div>-- CKB</div>
              )}
            </div>
          </div>

          <div className={clsx(styles.field, styles.apc)}>
            <div className={styles.name}>
              {t(`nervos-dao.apc`)}
              {isEnglish && (
                <span className={styles.tooltip} data-tooltip={t(`nervos-dao.apc-tooltip`)}>
                  <Tooltip />
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
            disabled={connectionStatus === 'offline' || sending || !maxDepositTx}
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
