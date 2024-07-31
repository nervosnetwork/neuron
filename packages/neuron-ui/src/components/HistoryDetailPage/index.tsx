import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { calculateUnlockDaoMaximumWithdraw, getTransaction } from 'services/remote'
import { showPageNotice, transactionState, useDispatch, useState as useGlobalState } from 'states'
import { type CKBComponents } from '@ckb-lumos/lumos/rpc'
import PageContainer from 'components/PageContainer'
import LockInfoDialog from 'components/LockInfoDialog'
import ScriptTag from 'components/ScriptTag'
import AlertDialog from 'widgets/AlertDialog'
import Tabs from 'widgets/Tabs'
import Table, { TableProps } from 'widgets/Table'
import CopyZone from 'widgets/CopyZone'
import { ArrowNext, BalanceHide, BalanceShow, Copy } from 'widgets/Icons/icon'
import Tooltip from 'widgets/Tooltip'
import Breadcrum from 'widgets/Breadcrum'

import {
  ErrorCode,
  scriptToAddress,
  localNumberFormatter,
  uniformTimeFormatter,
  shannonToCKBFormatter,
  isSuccessResponse,
  isMainnet as isMainnetUtil,
  calculateFee,
} from 'utils'
import { CONFIRMATION_THRESHOLD, HIDE_BALANCE } from 'utils/const'

import TxTopology from 'components/SendTxDetail/TxTopology'
import FormattedTokenAmount, { FormattedCKBBalanceChange } from 'components/FormattedTokenAmount'
import TransactionStatusWrap from 'components/TransactionStatusWrap'
import CellInfoDialog from 'components/CellInfoDialog'
import TransactionType from 'components/TransactionType'
import { TabId, useCellInfoDialog, useTxTabs } from './hooks'
import styles from './historyDetailPage.module.scss'

type InputOrOutputType = (State.DetailedInput | State.DetailedOutput) & { idx: number }

const InfoItem = ({ label, value, className }: { label: string; value: React.ReactNode; className?: string }) => (
  <div className={`${styles.basicInfoItemBox} ${className}`}>
    <div className={styles.infoItemLabel}>{label}</div>
    <div className={styles.infoItemValue}>{value}</div>
  </div>
)

const BasicInfo = ({
  transaction,
  cacheTipBlockNumber,
  bestKnownBlockNumber,
  txFee,
}: {
  transaction: State.DetailedTransaction
  cacheTipBlockNumber: number
  bestKnownBlockNumber: number
  txFee: string
}) => {
  const [t] = useTranslation()
  const dispatch = useDispatch()
  const onCopy = useCallback(() => {
    window.navigator.clipboard.writeText(transaction.hash)
    showPageNotice('common.copied')(dispatch)
  }, [transaction.hash, dispatch])
  const [isAmountShow, setIsAmountShow] = useState(true)
  const onChangeAmountShow = useCallback(() => {
    setIsAmountShow(v => !v)
  }, [])
  const [isBalanceShow, setIsBalanceShow] = useState(true)
  const onChangeBalanceShow = useCallback(() => {
    setIsBalanceShow(v => !v)
  }, [])
  const bestBlockNumber = Math.max(cacheTipBlockNumber, bestKnownBlockNumber)
  const confirmationCount = 1 + bestBlockNumber - +transaction.blockNumber
  const status =
    transaction.status === 'success' && confirmationCount < CONFIRMATION_THRESHOLD ? 'confirming' : transaction.status

  const infos = {
    hash: {
      label: t('transaction.transaction-hash'),
      value: (
        <div content={transaction.hash} className={styles.address}>
          {transaction.hash}
          <Copy onClick={onCopy} />
        </div>
      ),
    },
    blockNumber: {
      label: t('transaction.block-number'),
      value: transaction.blockNumber ? localNumberFormatter(transaction.blockNumber) : 'none',
    },
    time: {
      label: t('transaction.date'),
      value: +(transaction.timestamp || transaction.createdAt)
        ? uniformTimeFormatter(+(transaction.timestamp || transaction.createdAt))
        : 'none',
    },
    type: {
      label: t('transaction.type'),
      value: (
        <TransactionType
          item={transaction}
          cacheTipBlockNumber={cacheTipBlockNumber}
          bestKnownBlockNumber={bestKnownBlockNumber}
          tokenNameClassName={styles.tokenName}
        />
      ),
    },
    fee: {
      label: t('transaction.fee'),
      value: `${shannonToCKBFormatter(txFee)} CKB`,
    },
    amount: {
      label: t('transaction.assets'),
      value: (
        <div className={styles.flexItem}>
          <FormattedTokenAmount item={transaction} show={isAmountShow} symbolClassName={styles.symbol} />
          {isAmountShow ? <BalanceShow onClick={onChangeAmountShow} /> : <BalanceHide onClick={onChangeAmountShow} />}
        </div>
      ),
    },
    balance: {
      label: t('transaction.balance'),
      value: (
        <div className={styles.flexItem}>
          <FormattedCKBBalanceChange item={transaction} show={isBalanceShow} symbolClassName={styles.symbol} />
          {isBalanceShow ? (
            <BalanceShow onClick={onChangeBalanceShow} />
          ) : (
            <BalanceHide onClick={onChangeBalanceShow} />
          )}
        </div>
      ),
    },
    status: {
      label: t('transaction.status'),
      value: <TransactionStatusWrap status={status} confirmationCount={confirmationCount} />,
    },
    size: {
      label: t('transaction.size'),
      value: `${transaction.size} Bytes`,
    },
    cycles: {
      label: t('transaction.cycles'),
      value: transaction.cycles ? +transaction.cycles : '--',
    },
  }
  return (
    <div className={styles.basicInfoWrap}>
      <InfoItem {...infos.hash} className={styles.txHash} />
      <div className={styles.twoColumns}>
        <InfoItem {...infos.blockNumber} className={styles.borderBottom} />
        <InfoItem {...infos.time} className={styles.borderBottom} />
      </div>
      <div className={styles.twoColumns}>
        <InfoItem {...infos.type} className={styles.borderBottom} />
        <InfoItem {...infos.fee} className={styles.borderBottom} />
      </div>
      <div className={styles.twoColumns}>
        <InfoItem {...infos.amount} className={styles.borderBottom} />
        <InfoItem {...infos.balance} className={styles.borderBottom} />
      </div>
      <div className={styles.twoColumns}>
        <InfoItem {...infos.status} className={styles.borderBottom} />
        <InfoItem {...infos.size} className={styles.borderBottom} />
      </div>
      <InfoItem {...infos.cycles} className={styles.borderBottom} />
    </div>
  )
}

const HistoryDetailPage = () => {
  const { hash } = useParams()
  const navigate = useNavigate()
  const {
    app: { pageNotice },
    chain: {
      networkID,
      syncState: { cacheTipBlockNumber, bestKnownBlockNumber },
      transactions: { items = [] },
    },
    settings: { networks },
    wallet: currentWallet,
  } = useGlobalState()
  const isMainnet = isMainnetUtil(networks, networkID)
  const [t] = useTranslation()
  const [transaction, setTransaction] = useState(transactionState)
  const [daoMaximumWithdraw, setDaoMaximumWithdraw] = useState<undefined | string>()
  const [error, setError] = useState({ code: '', message: '' })
  const [failedMessage, setFailedMessage] = useState('')
  const [lockInfo, setLockInfo] = useState<CKBComponents.Script | null>(null)

  useEffect(() => {
    if (currentWallet) {
      if (!hash) {
        setFailedMessage(t(`messages.codes.${ErrorCode.FieldNotFound}`, { fieldName: 'transaction hash' }))
        return
      }
      getTransaction({ hash, walletID: currentWallet.id })
        .then(res => {
          if (isSuccessResponse(res)) {
            const tx = items.find(v => v.hash === hash)
            setTransaction({ ...tx, ...res.result, nervosDao: tx?.nervosDao ?? res.result.nervosDao })
          } else {
            setFailedMessage(t(`messages.codes.${ErrorCode.FieldNotFound}`, { fieldName: 'transaction' }))
          }
        })
        .catch((err: Error) => {
          setError({
            code: '-1',
            message: err.message,
          })
        })
    }
  }, [t, hash, currentWallet])

  useEffect(() => {
    if (hash) {
      calculateUnlockDaoMaximumWithdraw(hash).then(res => {
        if (isSuccessResponse(res) && res.result) {
          setDaoMaximumWithdraw(res.result)
        }
      })
    }
  }, [hash])

  const inputsTitle = useMemo(
    () => `${t('transaction.inputs')} (${transaction.inputs.length}/${localNumberFormatter(transaction.inputsCount)})`,
    [transaction.inputs.length, transaction.inputsCount, t]
  )

  const outputsTitle = useMemo(() => {
    return `${t('transaction.outputs')} (${transaction.outputs.length}/${localNumberFormatter(
      transaction.outputsCount
    )})`
  }, [transaction.outputs.length, transaction.outputsCount, t])

  const inputsData: InputOrOutputType[] = useMemo(
    () => transaction?.inputs.map((item, idx) => ({ ...item, idx: idx + 1 })),
    [transaction.inputs.length, transaction.inputsCount]
  )
  const outputsData: InputOrOutputType[] = useMemo(
    () => transaction?.outputs.map((item, idx) => ({ ...item, idx: idx + 1 })),
    [transaction.outputs.length, transaction.outputsCount]
  )

  const tabs = [
    { id: 0, label: inputsTitle },
    { id: 1, label: outputsTitle },
  ]
  const [currentTab, setCurrentTab] = useState(tabs[0])

  const handleListData = (cell: Readonly<State.DetailedInput | State.DetailedOutput>) => {
    let address = ''
    if (!cell.lock) {
      address = t('transaction.cell-from-cellbase')
    } else {
      try {
        address = scriptToAddress(cell.lock, { isMainnet })
      } catch (err) {
        console.error(err)
      }
    }
    const capacity = shannonToCKBFormatter(cell.capacity || '0')

    return {
      address,
      capacity,
    }
  }

  if (error.code) {
    return (
      <div className={styles.error}>
        {error.message || t(`messages.codes.${ErrorCode.FieldNotFound}`, { fieldName: 'transaction' })}
      </div>
    )
  }

  const columns: TableProps<InputOrOutputType>['columns'] = [
    {
      title: t('transaction.index'),
      dataIndex: 'idx',
      width: '60px',
      render(_, __, item) {
        return <>{item.idx}</>
      },
    },
    {
      title: t('transaction.address'),
      dataIndex: 'type',
      align: 'left',
      width: '560px',
      render: (_, __, item) => {
        const { address } = handleListData(item)
        return (
          <>
            <Tooltip
              tip={
                <CopyZone content={address} className={styles.copyTableAddress}>
                  {address}
                </CopyZone>
              }
              className={styles.addressTips}
              showTriangle
              isTriggerNextToChild
            >
              <div className={styles.address}>{`${address.slice(0, 20)}...${address.slice(-20)}`}</div>
            </Tooltip>
            <ScriptTag
              isMainnet={isMainnet}
              className={styles.scriptTag}
              script={item.lock}
              onClick={() => setLockInfo(item.lock)}
            />
          </>
        )
      },
    },
    {
      title: t('transaction.amount'),
      dataIndex: 'amount',
      align: 'left',
      isBalance: true,
      className: styles.amount,
      render(_, __, item, show: boolean) {
        const { capacity } = handleListData(item)
        return show ? (
          <CopyZone maskRadius={8} content={capacity.replaceAll(',', '')}>{`${capacity} CKB`}</CopyZone>
        ) : (
          `${HIDE_BALANCE} CKB`
        )
      },
    },
  ]

  const { setOutputCell, outputCell, onCancel } = useCellInfoDialog()

  const cellInfoColumn: TableProps<InputOrOutputType>['columns'][number] = {
    title: '',
    dataIndex: 'cellInfo',
    align: 'left',
    width: '100px',
    render(_, __, item) {
      return (
        <button className={styles.cellInfo} type="button" onClick={() => setOutputCell(item as State.DetailedOutput)}>
          <span>{t('transaction.cell-detail')}</span>
          <ArrowNext />
        </button>
      )
    },
  }

  const breadPages = useMemo(() => [{ label: t('history.title-detail') }], [t])

  const { tabs: txTabs, setCurrentTab: setTxCurrentTab, currentTab: currentTxTab } = useTxTabs({ t })
  const txFee = useMemo(() => {
    if (daoMaximumWithdraw) {
      return (
        BigInt(daoMaximumWithdraw) -
        transaction.outputs.reduce(
          (result: bigint, output: { capacity: string }) => result + BigInt(output.capacity),
          BigInt(0)
        )
      ).toString()
    }
    return calculateFee(transaction)
  }, [transaction, daoMaximumWithdraw])

  return (
    <PageContainer
      onContextMenu={e => {
        e.stopPropagation()
        e.preventDefault()
      }}
      head={<Breadcrum pages={breadPages} showBackIcon />}
      notice={pageNotice}
    >
      <div className={styles.tx}>
        <Tabs
          tabs={txTabs}
          onTabChange={setTxCurrentTab}
          tabsClassName={styles.tabsClassName}
          tabsWrapClassName={styles.tabsWrapClassName}
          tabsColumnClassName={styles.tabsColumnClassName}
          activeColumnClassName={styles.active}
        />
        {currentTxTab.id === TabId.Basic ? (
          <BasicInfo
            transaction={transaction}
            cacheTipBlockNumber={cacheTipBlockNumber}
            bestKnownBlockNumber={bestKnownBlockNumber}
            txFee={txFee}
          />
        ) : (
          <TxTopology tx={{ ...transaction, fee: txFee }} isMainnet={isMainnet} />
        )}
      </div>
      <div className={styles.listWrap}>
        <Table
          head={
            <Tabs
              tabs={tabs}
              onTabChange={setCurrentTab}
              tabsClassName={styles.tabsClassName}
              tabsWrapClassName={styles.tabsWrapClassName}
              tabsColumnClassName={styles.tabsColumnClassName}
              activeColumnClassName={styles.active}
            />
          }
          columns={currentTab.id === tabs[0].id ? columns : [...columns, cellInfoColumn]}
          dataSource={currentTab.id === tabs[0].id ? inputsData : outputsData}
          noDataContent={t('overview.no-recent-activities')}
          hasHoverTrBg={false}
        />
      </div>

      {lockInfo && <LockInfoDialog lockInfo={lockInfo} isMainnet={isMainnet} onDismiss={() => setLockInfo(null)} />}

      <AlertDialog
        show={!!failedMessage}
        title={t(`messages.error`)}
        message={failedMessage}
        type="failed"
        onCancel={() => navigate(-1)}
      />
      <CellInfoDialog output={outputCell} onCancel={onCancel} isMainnet={isMainnet} />
    </PageContainer>
  )
}

HistoryDetailPage.displayName = 'HistoryDetailPage'

export default HistoryDetailPage
