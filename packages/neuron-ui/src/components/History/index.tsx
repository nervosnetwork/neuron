import React, { useCallback, useEffect } from 'react'
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
    loadings: { transactionList: isLoading, updateDescription: isUpdatingDescription },
  },
  wallet: { id },
  chain: {
    transactions: { pageNo = 1, pageSize = 15, totalCount = 0, items = [] },
  },
  history,
  location: { search },
  dispatch,
}: React.PropsWithoutRef<StateWithDispatch & RouteComponentProps>) => {
  const [t] = useTranslation()

  const { keywords, onKeywordsChange, setKeywords } = useSearch(search, id, dispatch)
  useEffect(() => {
    if (id) {
      setKeywords('')
    }
  }, [id, setKeywords])
  const onSearch = useCallback(() => history.push(`${Routes.History}?keywords=${keywords}`), [history, keywords])

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
        isUpdatingDescription={isUpdatingDescription}
        walletID={id}
        items={items}
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
        pageAriaLabel={t('pagination-page')}
        selectedAriaLabel={t('pagination-selected')}
        firstPageIconProps={{ iconName: 'FirstPage' }}
        previousPageIconProps={{ iconName: 'PrevPage' }}
        nextPageIconProps={{ iconName: 'NextPage' }}
        lastPageIconProps={{ iconName: 'LastPage' }}
        format="buttons"
        onPageChange={(idx: number) => {
          history.push(`${Routes.History}?pageNo=${idx + 1}`)
        }}
      />
    </Stack>
  )
}

History.displayName = 'History'

export default History
