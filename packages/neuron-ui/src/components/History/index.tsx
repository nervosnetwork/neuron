import React, { useState, useCallback } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import Pagination from 'widgets/Pagination'
import SUDTAvatar from 'widgets/SUDTAvatar'
import Button from 'widgets/Button'
import Table, { TableProps } from 'widgets/Table'
import TextField from 'widgets/TextField'
import { DownloadIcon, SearchIcon, ArrowOpenRightIcon } from 'widgets/Icons/icon'

import PageContainer from 'components/PageContainer'
import { getDisplayName, isTonkenInfoStandardUAN, UANTonkenSymbol } from 'components/UANDisplay'
import { useState as useGlobalState, useDispatch } from 'states'
import { exportTransactions } from 'services/remote'

import { ReactComponent as CKBAvatar } from 'widgets/Icons/Nervos.svg'
import { ReactComponent as Success } from 'widgets/Icons/Success.svg'
import { ReactComponent as Pending } from 'widgets/Icons/Pending.svg'
import { ReactComponent as Failure } from 'widgets/Icons/Failure.svg'

import {
  RoutePath,
  isMainnet as isMainnetUtil,
  uniformTimeFormatter,
  nftFormatter,
  sUDTAmountFormatter,
  sudtValueToAmount,
  shannonToCKBFormatter,
} from 'utils'
import { onEnter } from 'utils/inputDevice'
import { CONFIRMATION_THRESHOLD, DEFAULT_SUDT_FIELDS, HIDE_BALANCE } from 'utils/const'
import RowExtend from './RowExtend'

import { useSearch } from './hooks'

import styles from './history.module.scss'

const History = () => {
  const {
    wallet: { id, name: walletName },
    chain: {
      networkID,
      syncState: { cacheTipBlockNumber, bestKnownBlockNumber },
      transactions: { pageNo = 1, pageSize = 10, totalCount = 0, items = [] },
    },
    settings: { networks },
    app: { pageNotice },
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

  const bestBlockNumber = Math.max(cacheTipBlockNumber, bestKnownBlockNumber)

  const handleTransactionInfo = (tx: State.Transaction) => {
    let name = '--'
    let amount = '--'
    let typeLabel = '--'
    let sudtAmount = ''
    let showWithUANFormatter = false

    if (tx.nftInfo) {
      // NFT
      name = walletName
      const { type, data } = tx.nftInfo
      typeLabel = `${t(`history.${type}`)} m-NFT`
      amount = `${type === 'receive' ? '+' : '-'}${nftFormatter(data)}`
    } else if (tx.sudtInfo?.sUDT) {
      // Asset Account
      name = tx.sudtInfo.sUDT.tokenName || DEFAULT_SUDT_FIELDS.tokenName
      if (['create', 'destroy'].includes(tx.type)) {
        // create/destroy an account
        showWithUANFormatter = isTonkenInfoStandardUAN(tx.sudtInfo.sUDT.tokenName, tx.sudtInfo.sUDT.symbol)
        typeLabel = `${t(`history.${tx.type}`, { name: getDisplayName(name, tx.sudtInfo.sUDT.symbol) })}`
      } else {
        // send/receive to/from an account
        const type = +tx.sudtInfo.amount <= 0 ? 'send' : 'receive'
        typeLabel = `UDT ${t(`history.${type}`)}`
      }

      if (tx.sudtInfo.sUDT.decimal) {
        sudtAmount = sudtValueToAmount(tx.sudtInfo.amount, tx.sudtInfo.sUDT.decimal, true)
        amount = `${sUDTAmountFormatter(sudtAmount)} ${tx.sudtInfo.sUDT.symbol}`
      }
    } else {
      // normal tx
      name = walletName
      amount = `${shannonToCKBFormatter(tx.value, true)} CKB`
      if (tx.type === 'create' || tx.type === 'destroy') {
        if (tx.assetAccountType === 'CKB') {
          typeLabel = `${t(`history.${tx.type}`, { name: 'CKB' })}`
        } else {
          typeLabel = `${t(`overview.${tx.type}`, { name: 'Unknown' })}`
        }
      } else {
        typeLabel = tx.nervosDao ? 'Nervos DAO' : t(`history.${tx.type}`)
      }
    }

    let indicator = <Pending />
    switch (tx.status) {
      case 'success': {
        indicator = <Success />
        break
      }
      case 'failed': {
        indicator = <Failure />
        break
      }
      default: {
        // ignore
      }
    }

    return {
      name,
      amount,
      typeLabel,
      sudtAmount,
      showWithUANFormatter,
      indicator,
    }
  }

  const columns: TableProps<State.Transaction>['columns'] = [
    {
      title: t('history.table.name'),
      dataIndex: 'name',
      width: '130px',
      minWidth: '',
      render(_, __, item) {
        const { name } = handleTransactionInfo(item)
        return (
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
      width: '100px',
      render: (_, __, item) => {
        const { typeLabel } = handleTransactionInfo(item)
        return typeLabel
      },
    },
    {
      title: t('history.table.amount'),
      dataIndex: 'amount',
      align: 'left',
      isBalance: true,
      minWidth: '150px',
      render(_, __, item, show) {
        let amount = '--'
        let sudtAmount = ''
        let isReceive = false

        if (item.blockNumber !== undefined) {
          if (item.nftInfo) {
            // NFT
            const { type, data } = item.nftInfo
            amount = show ? `${type === 'receive' ? '+' : '-'}${nftFormatter(data)}` : `${HIDE_BALANCE}mNFT`
            isReceive = type === 'receive'
          } else if (item.sudtInfo?.sUDT) {
            if (item.sudtInfo.sUDT.decimal) {
              sudtAmount = sUDTAmountFormatter(sudtValueToAmount(item.sudtInfo.amount, item.sudtInfo.sUDT.decimal))
            }
          } else {
            amount = show ? `${shannonToCKBFormatter(item.value, true)} CKB` : `${HIDE_BALANCE} CKB`
            isReceive = !amount.includes('-')
          }
        }
        return sudtAmount ? (
          <>
            {show ? sudtAmount : HIDE_BALANCE}&nbsp;
            <UANTonkenSymbol
              className={styles.symbol}
              name={item.sudtInfo!.sUDT.tokenName}
              symbol={item.sudtInfo!.sUDT.symbol}
            />
          </>
        ) : (
          <span className={show && isReceive ? styles.isReceive : ''}>{amount}</span>
        )
      },
    },
    {
      title: t('history.table.timestamp'),
      dataIndex: 'timestamp',
      align: 'left',
      render: (_, __, item) => uniformTimeFormatter(item.timestamp),
    },
    {
      title: t('history.table.status'),
      dataIndex: 'status',
      align: 'left',
      render(_, __, item) {
        const confirmations = 1 + bestBlockNumber - +item.blockNumber
        let status = item.status as string
        if (status === 'success' && confirmations < CONFIRMATION_THRESHOLD) {
          status = 'confirming'
        }

        return t(`history.${status}`)
      },
    },
    {
      title: t('history.table.operation'),
      dataIndex: 'operation',
      align: 'left',
      render(_, idx, ___, ____, expandedRow) {
        return <ArrowOpenRightIcon className={styles.arrow} data-is-open={expandedRow === idx} />
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
                  <SearchIcon onClick={onSearch} />
                </span>
              }
              placeholder={t('history.search.placeholder')}
              className={styles.tableHeaderInput}
              stack={false}
              onKeyDown={onEnter(onSearch)}
            />

            <Button disabled={isExporting} onClick={onExport} className={styles.exportButton}>
              <DownloadIcon className={styles.exportIcon} /> {t('history.export-history')}
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
      />

      <div className={styles.container}>
        {totalCount ? null : <div className={styles.noTxs}>{t('history.no-txs')}</div>}
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
