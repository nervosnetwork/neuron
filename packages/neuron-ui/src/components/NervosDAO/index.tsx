import React, { useEffect, useState, useMemo } from 'react'
import { useTranslation } from 'react-i18next'

import appState from 'states/initStates/app'
import { useState as useGlobalState, useDispatch } from 'states/stateProvider'

import calculateFee from 'utils/calculateFee'
import { shannonToCKBFormatter } from 'utils/formatters'
import { MIN_DEPOSIT_AMOUNT } from 'utils/const'
import { backToTop } from 'utils/animations'
import getSyncStatus from 'utils/getSyncStatus'
import getCurrentUrl from 'utils/getCurrentUrl'

import DepositDialog from 'components/DepositDialog'
import WithdrawDialog from 'components/WithdrawDialog'
import DAORecord from 'components/NervosDAORecord'
import BalanceSyncIcon from 'components/BalanceSyncingIcon'
import Button from 'widgets/Button'

import hooks from './hooks'
import styles from './nervosDAO.module.scss'

const NervosDAO = () => {
  const [focusedRecord, setFocusedRecord] = useState('')
  const [tabIdx, setTabIdx] = useState('0')
  const {
    app: {
      send = appState.send,
      loadings: { sending = false },
      tipBlockNumber,
      tipBlockHash,
      tipBlockTimestamp,
      epoch,
    },
    wallet,
    nervosDAO: { records },
    chain: { connectionStatus, tipBlockNumber: syncedBlockNumber, networkID },
    settings: { networks },
  } = useGlobalState()
  const dispatch = useDispatch()
  const [t] = useTranslation()
  useEffect(() => {
    backToTop()
  }, [])
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

  hooks.useUpdateMaxDeposit({ wallet, setMaxDepositAmount, setMaxDepositTx, setMaxDepositErrorMessage })
  hooks.useInitData({ clearGeneratedTx, dispatch, updateDepositValue, wallet, setGenesisBlockTimestamp })
  hooks.useUpdateGlobalAPC({ tipBlockTimestamp, genesisBlockTimestamp, setGlobalAPC })
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

  const onSlide = hooks.useOnSlide({ updateDepositValue, maxDepositAmount })
  hooks.useUpdateDepositEpochList({ records, setDepositEpochList, connectionStatus })

  const fee = `${shannonToCKBFormatter(
    send.generatedTx ? send.generatedTx.fee || calculateFee(send.generatedTx) : '0'
  )} CKB`
  hooks.useUpdateWithdrawList({
    records,
    tipBlockHash,
    setWithdrawList,
  })

  const syncStatus = getSyncStatus({
    tipBlockNumber,
    tipBlockTimestamp,
    syncedBlockNumber,
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

            const props = {
              ...record,
              tipBlockTimestamp,
              withdrawCapacity: withdrawList.get(key) || null,
              key,
              onClick: onActionClick,
              tipBlockNumber,
              depositEpoch: depositEpochList.get(key) || '',
              currentEpoch: epoch,
              genesisBlockTimestamp,
              connectionStatus,
            }
            return (
              <DAORecord
                {...props}
                isCollapsed={focusedRecord !== key}
                onToggle={() => {
                  setFocusedRecord(focusedRecord === key ? '' : key)
                }}
              />
            )
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
    tipBlockNumber,
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

  const MemoizedDepositDialog = useMemo(() => {
    return (
      <DepositDialog
        show={showDepositDialog}
        value={depositValue}
        fee={fee}
        onChange={onDepositValueChange}
        onDismiss={onDepositDialogDismiss}
        onSubmit={onDepositDialogSubmit}
        onSlide={onSlide}
        maxDepositAmount={maxDepositAmount}
        isDepositing={sending}
        errorMessage={errorMessage}
        isTxGenerated={!!send.generatedTx}
      />
    )
    // eslint-disable-next-line
  }, [
    showDepositDialog,
    depositValue,
    fee,
    onDepositDialogDismiss,
    onDepositDialogSubmit,
    onSlide,
    maxDepositAmount,
    sending,
    errorMessage,
    send.generatedTx,
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
  const locked = [...withdrawList.values()].reduce((acc, w) => acc + BigInt(w || 0), BigInt(0))

  const info = [
    {
      key: 'free',
      value: `${shannonToCKBFormatter(`${free}`)} CKB`,
    },
    {
      key: 'locked',
      value: `${shannonToCKBFormatter(`${locked}`)} CKB`,
    },
    {
      key: 'apc',
      value: `~${globalAPC}%`,
    },
  ]

  return (
    <div className={styles.nervosDAOContainer}>
      <h1 className={styles.title}>Nervos DAO</h1>
      {info.map(({ key, value }) => {
        const label = t(`nervos-dao.${key}`)
        return (
          <div key={key} title={label} aria-label={label} className={styles[key]}>
            <span>{label}</span>
            <span>{value}</span>
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
      <div className={styles.records}>{MemoizedRecords}</div>
      {MemoizedDepositDialog}
      {MemoizedWithdrawDialog}
    </div>
  )
}

NervosDAO.displayName = 'NervosDAO'

export default NervosDAO
