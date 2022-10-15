import React, { useState, useCallback, useMemo } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Stack, SearchBox } from 'office-ui-fabric-react'
import Pagination from 'widgets/Pagination'

import TransactionList from 'components/TransactionList'
import { useState as useGlobalState, useDispatch } from 'states'
import Button from 'widgets/Button'
import { exportTransactions } from 'services/remote'
import { ReactComponent as Export } from 'widgets/Icons/ExportHistory.svg'

import { RoutePath, isMainnet as isMainnetUtil } from 'utils'

import { useSearch } from './hooks'
import styles from './history.module.scss'

const History = () => {
  const {
    wallet: { id, name: walletName },
    chain: {
      networkID,
      syncState: { cacheTipBlockNumber, bestKnownBlockNumber },
      transactions: { pageNo = 1, pageSize = 15, totalCount = 0, items = [] },
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

  const bestBlockNumber = Math.max(cacheTipBlockNumber, bestKnownBlockNumber)
  const List = useMemo(() => {
    return (
      <Stack className={styles.container}>
        <div className={styles.tools}>
          <SearchBox
            value={keywords}
            className={styles.searchBox}
            styles={{
              root: {
                background: '#e3e3e3',
                borderRadius: 0,
                fontSize: '1rem',
                border: '1px solid rgb(204, 204, 204)',
                borderTopLeftRadius: 2,
                borderBottomLeftRadius: 2,
              },
            }}
            placeholder={t('history.search.placeholder')}
            onChange={onKeywordsChange}
            onSearch={onSearch}
            iconProps={{ iconName: 'Search', styles: { root: { height: '18px' } } }}
          />
          <Button className={styles.searchBtn} type="default" label={t('history.search.button')} onClick={onSearch} />
          <Button
            className={styles.exportBtn}
            type="primary"
            disabled={isExporting}
            onClick={onExport}
            label={t('history.export-history')}
          >
            <Export />
          </Button>
        </div>
        <div>
          {totalCount ? (
            <TransactionList
              walletID={id}
              walletName={walletName}
              items={items as State.Transaction[]}
              bestKnownBlockNumber={bestBlockNumber}
              isMainnet={isMainnet}
              dispatch={dispatch}
            />
          ) : null}
        </div>
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
      </Stack>
    )
  }, [
    keywords,
    onKeywordsChange,
    onSearch,
    id,
    walletName,
    items,
    bestBlockNumber,
    dispatch,
    pageNo,
    totalCount,
    pageSize,
    navigate,
    isMainnet,
    t,
    isExporting,
    onExport,
  ])

  return List
}

History.displayName = 'History'

export default History
