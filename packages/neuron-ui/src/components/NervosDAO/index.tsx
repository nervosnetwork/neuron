import React, { useEffect, useState, useMemo, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { ReactComponent as TooltipIcon } from 'widgets/Icons/Tooltip.svg'

import appState from 'states/init/app'
import { useState as useGlobalState, useDispatch } from 'states'

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
} from 'utils'

import { openExternal } from 'services/remote'

import DepositDialog from 'components/DepositDialog'
import WithdrawDialog from 'components/WithdrawDialog'
import DAORecord, { DAORecordProps } from 'components/NervosDAORecord'
import BalanceSyncIcon from 'components/BalanceSyncingIcon'
import Button from 'widgets/Button'
import CopyZone from 'widgets/CopyZone'

import hooks from './hooks'
import styles from './nervosDAO.module.scss'

const { MIN_DEPOSIT_AMOUNT } = CONSTANTS

const DAO_DOCS_URL =
  'https://docs.nervos.org/docs/basics/guides/neuron#5-deposit-your-nervos-ckbyte-tokens-into-nervos-dao'

const NervosDAO = () => {
  const [focusedRecord, setFocusedRecord] = useState('')
  const [tabIdx, setTabIdx] = useState('0')
  const {
    app: {
      send = appState.send,
      loadings: { sending = false },
      tipBlockHash,
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
  const updateDepositValue = hooks.useUpdateDepositValue({
    setDepositValue,
    setErrorMessage,
    clearGeneratedTx,
    maxDepositAmount,
    maxDepositTx,
    dispatch,
    walletID: wallet.id,
    maxDepositErrorMessage,
    isBalanceReserved,
    t,
  })

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
  })
  hooks.useInitData({ clearGeneratedTx, dispatch, updateDepositValue, wallet, setGenesisBlockTimestamp })
  hooks.useUpdateGlobalAPC({ bestKnownBlockTimestamp, genesisBlockTimestamp, setGlobalAPC })
  const onWithdrawDialogSubmit = hooks.useOnWithdrawDialogSubmit({
    activeRecord,
    setActiveRecord,
    clearGeneratedTx,
    walletID: wallet.id,
    dispatch,
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
    tipBlockHash,
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
        <div role="presentation" className={styles.recordTab} data-idx={tabIdx} onClick={onTabClick}>
          <button type="button" role="tab" data-idx="0">
            {t('nervos-dao.deposit-records')}
          </button>
          <button type="button" role="tab" data-idx="1">
            {t('nervos-dao.completed-records')}
          </button>
          <div className={styles.underline} />
        </div>
        {filteredRecord.length ? (
          filteredRecord.map(record => {
            const key = record.depositOutPoint
              ? `${record.depositOutPoint.txHash}-${record.depositOutPoint.index}`
              : `${record.outPoint.txHash}-${record.outPoint.index}`

            const props: DAORecordProps = {
              ...record,
              tipBlockTimestamp,
              withdrawCapacity: withdrawList.get(key) || null,
              onClick: onActionClick,
              depositEpoch: depositEpochList.get(key) || '',
              currentEpoch: epoch,
              genesisBlockTimestamp,
              connectionStatus,
              isCollapsed: focusedRecord !== key,
              onToggle: () => {
                setFocusedRecord(focusedRecord === key ? '' : key)
              },
            }
            return <DAORecord key={key} {...props} />
          })
        ) : (
          <div className={styles.noRecords}>
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
    focusedRecord,
    setFocusedRecord,
    tabIdx,
    setTabIdx,
  ])

  const onDepositDialogOpen = useCallback(() => {
    clearGeneratedTx()
  }, [clearGeneratedTx])

  useEffect(() => {
    backToTop()
  }, [])

  useEffect(() => {
    if (BigInt(CKBToShannonFormatter(depositValue)) > maxDepositAmount) {
      setDepositValue(shannonToCKBFormatter(`${maxDepositAmount}`, false, ''))
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
        tipBlockHash={tipBlockHash}
        currentEpoch={epoch}
      />
    ) : null
  }, [activeRecord, onWithdrawDialogDismiss, onWithdrawDialogSubmit, tipBlockHash, epoch])

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

  const info = [
    {
      key: 'free',
      value: (
        <CopyZone
          content={shannonToCKBFormatter(`${free}`, false, '')}
          name={t('nervos-dao.copy-balance')}
          className={styles.balance}
        >
          {`${shannonToCKBFormatter(`${free}`)} CKB`}
        </CopyZone>
      ),
    },
    {
      key: 'locked',
      value: onlineAndSynced ? (
        <CopyZone
          content={shannonToCKBFormatter(`${locked}`, false, '')}
          name={t('nervos-dao.copy-balance')}
          className={styles.balance}
        >
          {`${shannonToCKBFormatter(`${locked}`)} CKB`}
        </CopyZone>
      ) : (
        `-- CKB`
      ),
    },
    {
      key: 'apc',
      tooltip: ['en', 'en-US'].includes(language) ? `apc-tooltip` : undefined,
      value: `~${globalAPC}%`,
    },
  ]

  return (
    <div className={styles.nervosDAOContainer}>
      <h1 className={styles.title}>Nervos DAO</h1>
      {info.map(({ key, value, tooltip }) => {
        const label = t(`nervos-dao.${key}`)
        return (
          <div key={key} title={label} aria-label={label} className={styles[key]}>
            <span>
              {label}
              {tooltip ? (
                <span className={styles.tooltip} data-tooltip={t(`nervos-dao.${tooltip}`)}>
                  <TooltipIcon />
                </span>
              ) : null}
            </span>

            <div
              style={{
                color: onlineAndSynced ? '#000' : '#888',
              }}
            >
              {value}
            </div>
          </div>
        )
      })}
      <div className={styles.networkAlert}>
        <BalanceSyncIcon connectionStatus={connectionStatus} syncStatus={syncStatus} />
      </div>
      <div className={styles.deposit}>
        <Button
          type="primary"
          disabled={connectionStatus === 'offline' || sending || !maxDepositTx}
          onClick={() => setShowDepositDialog(true)}
          label={t('nervos-dao.deposit')}
        />
      </div>
      <span
        onClick={handleOpenRules}
        onKeyPress={handleOpenRules}
        role="link"
        tabIndex={0}
        className={styles.depositRules}
      >
        {t('nervos-dao.deposit-rules')}
      </span>
      <div className={styles.records}>{MemoizedRecords}</div>
      {MemoizedDepositDialog}
      {MemoizedWithdrawDialog}
    </div>
  )
}

NervosDAO.displayName = 'NervosDAO'

export default NervosDAO
