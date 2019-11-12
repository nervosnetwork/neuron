import React, { useCallback, useEffect, useMemo } from 'react'
import { RouteComponentProps } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Stack, SearchBox } from 'office-ui-fabric-react'
import { Pagination } from '@uifabric/experiments'

import TransactionList from 'components/TransactionList'
import { StateWithDispatch } from 'states/stateProvider/reducer'

import { Routes } from 'utils/const'

import { useSearch } from './hooks'

const History = ({
  app: {
    tipBlockNumber: chainBlockNumber,
    loadings: { transactionList: isLoading },
  },
  wallet: { id },
  chain: {
    tipBlockNumber: syncedBlockNumber,
    transactions: { pageNo = 1, pageSize = 15, totalCount = 0, items = [] },
  },
  history,
  location: { search },
  dispatch,
}: React.PropsWithoutRef<StateWithDispatch & RouteComponentProps>) => {
  const [t] = useTranslation()

  const { keywords, onKeywordsChange } = useSearch(search, id, dispatch)
  useEffect(() => {
    if (id) {
      history.push(`${Routes.History}?pageNo=1&keywords=${''}`)
    }
  }, [id, history])
  const onSearch = useCallback(() => history.push(`${Routes.History}?keywords=${keywords}`), [history, keywords])

  const tipBlockNumber = useMemo(() => {
    return Math.max(+syncedBlockNumber, +chainBlockNumber).toString()
  }, [syncedBlockNumber, chainBlockNumber])

  const List = useMemo(() => {
    return (
      <Stack>
        <Stack horizontal horizontalAlign="end" tokens={{ childrenGap: 15 }}>
          <SearchBox
            value={keywords}
            styles={{ root: { width: 500 } }}
            placeholder={t('history.search.placeholder')}
            onChange={onKeywordsChange}
            onSearch={onSearch}
            iconProps={{ iconName: 'Search', styles: { root: { height: '18px' } } }}
          />
        </Stack>
        <TransactionList
          isLoading={isLoading}
          walletID={id}
          items={items}
          tipBlockNumber={tipBlockNumber}
          dispatch={dispatch}
        />
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
    t,
  ])

  return List
}

History.displayName = 'History'

export default History
