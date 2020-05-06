import React, { useCallback, useMemo } from 'react'
import { useHistory, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Stack, SearchBox } from 'office-ui-fabric-react'
import { Pagination } from '@uifabric/experiments'

import TransactionList from 'components/TransactionList'
import { useState as useGlobalState, useDispatch } from 'states'

import { Routes } from 'utils/const'
import isMainnetUtil from 'utils/isMainnet'

import { useSearch } from './hooks'
import styles from './history.module.scss'

const History = () => {
  const {
    app: {
      tipBlockNumber: chainBlockNumber,
      loadings: { transactionList: isLoading },
    },
    wallet: { id },
    chain: {
      networkID,
      tipBlockNumber: syncedBlockNumber,
      transactions: { pageNo = 1, pageSize = 15, totalCount = 0, items = [] },
    },
    settings: { networks },
  } = useGlobalState()
  const dispatch = useDispatch()
  const [t] = useTranslation()
  const history = useHistory()
  const { search } = useLocation()
  const isMainnet = isMainnetUtil(networks, networkID)

  const { keywords, onKeywordsChange } = useSearch(search, id, dispatch)
  const onSearch = useCallback(() => history.push(`${Routes.History}?keywords=${keywords}`), [history, keywords])

  const tipBlockNumber = useMemo(() => {
    return Math.max(+syncedBlockNumber, +chainBlockNumber).toString()
  }, [syncedBlockNumber, chainBlockNumber])

  const List = useMemo(() => {
    return (
      <Stack className={styles.history}>
        <SearchBox
          value={keywords}
          styles={{
            root: {
              background: '#e3e3e3',
              border: 'none',
              borderRadius: 0,
              fontSize: '1rem',
            },
          }}
          placeholder={t('history.search.placeholder')}
          onChange={onKeywordsChange}
          onSearch={onSearch}
          iconProps={{ iconName: 'Search', styles: { root: { height: '18px' } } }}
        />
        <div className={styles.listContainer}>
          {totalCount ? (
            <TransactionList
              isLoading={isLoading}
              walletID={id}
              items={items as State.Transaction[]}
              tipBlockNumber={tipBlockNumber}
              isMainnet={isMainnet}
              dispatch={dispatch}
            />
          ) : null}
        </div>
        {totalCount ? null : <div className={styles.noTxs}>{t('history.no-txs')}</div>}
        <div className={styles.pagination}>
          {totalCount ? (
            <Pagination
              selectedPageIndex={pageNo - 1}
              pageCount={Math.ceil(totalCount / pageSize)}
              itemsPerPage={pageSize}
              totalItemCount={totalCount}
              previousPageAriaLabel={t('pagination.previous-page')}
              nextPageAriaLabel={t('pagination.next-page')}
              firstPageAriaLabel={t('pagination.first-page')}
              lastPageAriaLabel={t('pagination.last-page')}
              pageAriaLabel={t('pagination.page')}
              selectedAriaLabel={t('pagination.selected')}
              firstPageIconProps={{ iconName: 'FirstPage' }}
              previousPageIconProps={{ iconName: 'PrevPage' }}
              nextPageIconProps={{ iconName: 'NextPage' }}
              lastPageIconProps={{ iconName: 'LastPage' }}
              format="buttons"
              onPageChange={(idx: number) => {
                history.push(`${Routes.History}?pageNo=${idx + 1}&keywords=${keywords}`)
              }}
            />
          ) : null}
        </div>
      </Stack>
    )
  }, [
    keywords,
    onKeywordsChange,
    onSearch,
    isLoading,
    id,
    items,
    tipBlockNumber,
    dispatch,
    pageNo,
    totalCount,
    pageSize,
    history,
    isMainnet,
    t,
  ])

  return List
}

History.displayName = 'History'

export default History
