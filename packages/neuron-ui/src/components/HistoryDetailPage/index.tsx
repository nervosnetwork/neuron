import React, { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { scriptToAddress } from '@nervosnetwork/ckb-sdk-utils'
import { getTransaction, showErrorMessage } from 'services/remote'
import { transactionState, useState as useGlobalState } from 'states'
import PageContainer from 'components/PageContainer'
import LockInfoDialog from 'components/LockInfoDialog'
import ScriptTag from 'components/ScriptTag'
import Tabs from 'widgets/Tabs'
import Table from 'widgets/Table'
import CopyZone from 'widgets/CopyZone'

import {
  ErrorCode,
  CONSTANTS,
  localNumberFormatter,
  uniformTimeFormatter,
  shannonToCKBFormatter,
  isSuccessResponse,
  RoutePath,
} from 'utils'
import { HIDE_BALANCE } from 'utils/const'

import styles from './historyDetailPage.module.scss'

const { MAINNET_TAG } = CONSTANTS

type InputOrOutputType = (State.DetailedInput | State.DetailedOutput) & { idx: number }

const InfoItem = ({ label, value, className }: { label: string; value: React.ReactNode; className?: string }) => (
  <div className={`${styles.basicInfoItemBox} ${className}`}>
    <div className={styles.infoItemLabel}>{label}</div>
    <div className={styles.infoItemValue}>{value}</div>
  </div>
)

const HistoryDetailPage = () => {
  const { hash } = useParams()
  const {
    app: { pageNotice },
    chain: { networkID },
    settings: { networks },
    wallet: currentWallet,
  } = useGlobalState()
  const network = networks.find(n => n.id === networkID)
  const isMainnet = network != null && network.chain === MAINNET_TAG
  const [t] = useTranslation()
  const [transaction, setTransaction] = useState(transactionState)
  const [error, setError] = useState({ code: '', message: '' })
  const [lockInfo, setLockInfo] = useState<CKBComponents.Script | null>(null)

  useEffect(() => {
    if (currentWallet) {
      if (!hash) {
        showErrorMessage(
          t(`messages.error`),
          t(`messages.codes.${ErrorCode.FieldNotFound}`, { fieldName: 'transaction hash' })
        )
        return
      }
      getTransaction({ hash, walletID: currentWallet.id })
        .then(res => {
          if (isSuccessResponse(res)) {
            setTransaction(res.result)
          } else {
            showErrorMessage(
              t(`messages.error`),
              t(`messages.codes.${ErrorCode.FieldNotFound}`, { fieldName: 'transaction' })
            )
            window.close()
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

  const infos = [
    {
      label: t('transaction.transaction-hash'),
      value:
        (
          <CopyZone content={transaction.hash} name={t('history.copy-tx-hash')} className={styles.address}>
            {transaction.hash}
          </CopyZone>
        ) || 'none',
    },
    {
      label: t('transaction.block-number'),
      value: transaction.blockNumber ? localNumberFormatter(transaction.blockNumber) : 'none',
    },
    {
      label: t('transaction.date'),
      value: +(transaction.timestamp || transaction.createdAt)
        ? uniformTimeFormatter(+(transaction.timestamp || transaction.createdAt))
        : 'none',
    },
    {
      label: t('transaction.income'),
      value: (
        <CopyZone content={shannonToCKBFormatter(transaction.value, false, '')} name={t('history.copy-balance')}>
          {`${shannonToCKBFormatter(transaction.value)} CKB`}
        </CopyZone>
      ),
    },
  ]

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
        address = scriptToAddress(cell.lock, isMainnet)
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

  const columns: {
    title: string
    dataIndex: string
    isBalance?: boolean
    render?: (
      v: any,
      idx: number,
      item: InputOrOutputType,
      showBalance: boolean,
      expandedRow: number | null
    ) => React.ReactNode
    width?: string
    align?: 'left' | 'right' | 'center'
  }[] = [
    {
      title: t('transaction.index'),
      dataIndex: 'idx',
      width: '90px',
      render(_, __, item) {
        return <>{item.idx}</>
      },
    },
    {
      title: t('transaction.address'),
      dataIndex: 'type',
      align: 'left',
      width: '550px',
      render: (_, __, item) => {
        const { address } = handleListData(item)
        return (
          <>
            <CopyZone content={address} name={t('history.copy-address')} className={styles.address}>
              {`${address.slice(0, 20)}...${address.slice(-20)}`}
            </CopyZone>
            <ScriptTag isMainnet={isMainnet} script={item.lock} onClick={() => setLockInfo(item.lock)} />
          </>
        )
      },
    },
    {
      title: t('transaction.amount'),
      dataIndex: 'amount',
      align: 'left',
      isBalance: true,
      render(_, __, item, show: boolean) {
        const { capacity } = handleListData(item)
        return show ? (
          <CopyZone content={capacity.replace(/,/g, '')} name={t('history.copy-balance')}>
            {`${capacity} CKB`}
          </CopyZone>
        ) : (
          HIDE_BALANCE
        )
      },
    },
  ]

  return (
    <PageContainer
      onContextMenu={e => {
        e.stopPropagation()
        e.preventDefault()
      }}
      head={
        <div>
          <Link className={styles.breadcrumb} to={RoutePath.History}>
            {`${t('history.title')} / `}
          </Link>
          <span className={styles.breadcrumbNav}>{`${t('history.title-detail')}`}</span>
        </div>
      }
      notice={pageNotice}
    >
      <div className={styles.basicInfoWrap}>
        <div className={`${styles.basicInfoTitle} ${styles.borderBottom}`}>{t('history.basic-information')}</div>
        <div className={styles.basicInfoItemWrap}>
          <InfoItem {...infos[0]} className={styles.borderBottom} />
          <div className={styles.basicInfoMiddleWrap}>
            <InfoItem {...infos[1]} className={styles.borderBottom} />
            <InfoItem {...infos[2]} className={styles.borderBottom} />
          </div>
          <InfoItem {...infos[3]} />
        </div>
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
          columns={columns}
          dataSource={currentTab.id === tabs[0].id ? inputsData : outputsData}
          noDataContent={t('overview.no-recent-activities')}
        />
      </div>

      {lockInfo && <LockInfoDialog lockInfo={lockInfo} isMainnet={isMainnet} onDismiss={() => setLockInfo(null)} />}
    </PageContainer>
  )
}

HistoryDetailPage.displayName = 'HistoryDetailPage'

export default HistoryDetailPage
