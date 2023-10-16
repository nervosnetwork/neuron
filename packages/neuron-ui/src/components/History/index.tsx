import React, { useState, useCallback } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import Pagination from 'widgets/Pagination'
import SUDTAvatar from 'widgets/SUDTAvatar'
import Button from 'widgets/Button'
import Table, { TableProps } from 'widgets/Table'
import TextField from 'widgets/TextField'
import { Download, Search, ArrowNext } from 'widgets/Icons/icon'

import PageContainer from 'components/PageContainer'
import TransactionStatusWrap from 'components/TransactionStatusWrap'
import FormattedTokenAmount from 'components/FormattedTokenAmount'
import { useState as useGlobalState, useDispatch } from 'states'
import { exportTransactions } from 'services/remote'

import { ReactComponent as CKBAvatar } from 'widgets/Icons/Nervos.svg'

import { RoutePath, isMainnet as isMainnetUtil, uniformTimeFormatter } from 'utils'
import { onEnter } from 'utils/inputDevice'
import { CONFIRMATION_THRESHOLD, DEFAULT_SUDT_FIELDS } from 'utils/const'
import Tooltip from 'widgets/Tooltip'
import TracsactionType from 'components/TransactionType'
import RowExtend from './RowExtend'

import { useSearch } from './hooks'

import styles from './history.module.scss'

const History = () => {
  const {
    app: { pageNotice },
    wallet: { id, name: walletName },
    chain: {
      networkID,
      syncState: { cacheTipBlockNumber, bestKnownBlockNumber },
      transactions: { pageNo = 1, pageSize = 10, totalCount = 0, items = [] },
    },
    settings: { networks },
  } = useGlobalState()
  const dispatch = useDispatch()
  const [t] = useTranslation()
  const navigate = useNavigate()
  const { search } = useLocation()
  const [isExporting, setIsExporting] = useState(false)
  const isMainnet = isMainnetUtil(networks, networkID)

  const { keywords, onKeywordsChange } = useSearch(search, id, dispatch)
  const onSearch = useCallback(() => navigate(`${RoutePath.History}?keywords=${keywords}`), [navigate, keywords])
  const onExport = useCallback(() => {
    setIsExporting(true)
    const timer = setTimeout(() => {
      setIsExporting(false)
    }, 3000)
    exportTransactions({ walletID: id }).finally(() => {
      clearTimeout(timer)
      setIsExporting(false)
    })
  }, [id, setIsExporting])

  const [expandedRow, setExpandedRow] = useState<number | null>(null)

  const bestBlockNumber = Math.max(cacheTipBlockNumber, bestKnownBlockNumber)

  const getTxName = (tx: State.Transaction) => {
    if (!tx.nftInfo && tx.sudtInfo?.sUDT) {
      // Asset Account
      return tx.sudtInfo.sUDT.tokenName || DEFAULT_SUDT_FIELDS.tokenName
    }
    return walletName ?? '--'
  }

  const handleExpandClick = (idx: number | null) => {
    setExpandedRow(prevIndex => (prevIndex === idx ? null : idx))
  }

  const columns: TableProps<State.Transaction>['columns'] = [
    {
      title: t('history.table.name'),
      dataIndex: 'name',
      minWidth: '110px',
      render(_, __, item) {
        const name = getTxName(item)
        return name.length > 8 ? (
          <Tooltip tip={<>{name}</>} isTriggerNextToChild showTriangle>
            <div className={styles.avatarBox}>
              {item.sudtInfo?.sUDT ? (
                <SUDTAvatar name={name} type="token" style={{ width: '30px', height: '30px' }} />
              ) : (
                <CKBAvatar />
              )}
              <div className={styles.nameWrap}>{name.slice(0, 8)}...</div>
            </div>
          </Tooltip>
        ) : (
          <div className={styles.avatarBox}>
            {item.sudtInfo?.sUDT ? (
              <SUDTAvatar name={name} type="token" style={{ width: '30px', height: '30px' }} />
            ) : (
              <CKBAvatar />
            )}
            <div className={styles.nameWrap}>{name}</div>
          </div>
        )
      },
    },
    {
      title: t('history.table.type'),
      dataIndex: 'type',
      align: 'left',
      minWidth: '120px',
      render: (_, __, item) => {
        return (
          <TracsactionType
            item={item}
            cacheTipBlockNumber={cacheTipBlockNumber}
            bestKnownBlockNumber={bestKnownBlockNumber}
            tokenNameClassName={styles.tokenName}
          />
        )
      },
    },
    {
      title: t('history.table.amount'),
      dataIndex: 'amount',
      align: 'left',
      isBalance: true,
      minWidth: '200px',
      render(_, __, item, show) {
        return <FormattedTokenAmount item={item} show={show} symbolClassName={styles.symbolClassName} />
      },
    },
    {
      title: t('history.table.timestamp'),
      dataIndex: 'timestamp',
      align: 'left',
      minWidth: '150px',
      render: (_, __, item) => uniformTimeFormatter(item.timestamp),
    },
    {
      title: t('history.table.status'),
      dataIndex: 'status',
      align: 'left',
      minWidth: '50px',
      render(_, __, item) {
        const confirmationCount = 1 + bestBlockNumber - +item.blockNumber
        const status =
          item.status === 'success' && confirmationCount < CONFIRMATION_THRESHOLD ? 'confirming' : item.status

        return <TransactionStatusWrap status={status} confirmationCount={confirmationCount} />
      },
    },
    {
      title: t('history.table.operation'),
      dataIndex: 'operation',
      align: 'center',
      minWidth: '72px',
      render(_, idx) {
        return <ArrowNext className={styles.arrow} data-is-expand-show={expandedRow === idx} />
      },
    },
  ]

  return (
    <PageContainer
      onContextMenu={e => {
        e.stopPropagation()
        e.preventDefault()
      }}
      head={t('history.title')}
      notice={pageNotice}
    >
      <Table
        head={
          <div className={styles.tableHeaderWrapper}>
            <TextField
              value={keywords}
              onChange={(e: React.FormEvent<HTMLInputElement | HTMLTextAreaElement>) =>
                onKeywordsChange(e, e.currentTarget.value)
              }
              prefix={
                <span className={styles.searchBoxPrefix}>
                  <Search onClick={onSearch} />
                </span>
              }
              placeholder={t('history.search.placeholder')}
              className={styles.tableHeaderInput}
              stack={false}
              onKeyDown={onEnter(onSearch)}
            />

            <Button disabled={isExporting} onClick={onExport} className={styles.exportButton}>
              <Download className={styles.exportIcon} /> {t('history.export-history')}
            </Button>
          </div>
        }
        columns={columns}
        dataSource={items}
        noDataContent={t('overview.no-recent-activities')}
        rowExtendRender={column => (
          <RowExtend
            column={column}
            columns={columns}
            isMainnet={isMainnet}
            id={id}
            bestBlockNumber={bestBlockNumber}
          />
        )}
        expandedRow={expandedRow}
        onRowClick={(_, __, idx) => handleExpandClick(idx)}
      />

      <div className={styles.container}>
        <div className={styles.pagination}>
          <Pagination
            count={totalCount}
            pageSize={pageSize}
            pageNo={pageNo}
            onChange={(no: number) => {
              navigate(`${RoutePath.History}?pageNo=${no}&keywords=${keywords}`)
            }}
          />
        </div>
      </div>
    </PageContainer>
  )
}

History.displayName = 'History'

export default History
