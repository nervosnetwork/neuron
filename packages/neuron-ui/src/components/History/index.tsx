import React, { useCallback } from 'react'
import { RouteComponentProps } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Stack, SearchBox, getTheme } from 'office-ui-fabric-react'
import { Pagination } from '@uifabric/experiments'
import {
  Search as SearchIcon,
  LinkDown as LinkDownIcon,
  LinkBottom as LinkBottomIcon,
  LinkTop as LinkTopIcon,
  LinkUp as LinkUpIcon,
} from 'grommet-icons'

import TransactionList from 'components/TransactionList'
import { StateWithDispatch } from 'states/stateProvider/reducer'

import { Routes } from 'utils/const'
import { registerIcons } from 'utils/icons'

import { useSearch } from './hooks'

const theme = getTheme()
const { semanticColors } = theme
registerIcons({
  icons: {
    Search: <SearchIcon size="16px" color={semanticColors.menuIcon} />,
    FirstPage: <LinkTopIcon size="16px" color={semanticColors.menuIcon} style={{ transform: 'rotate(-90deg)' }} />,
    LastPage: <LinkBottomIcon size="16px" color={semanticColors.menuIcon} style={{ transform: 'rotate(-90deg)' }} />,
    PrevPage: <LinkUpIcon size="16px" color={semanticColors.menuIcon} style={{ transform: 'rotate(-90deg)' }} />,
    NextPage: <LinkDownIcon size="16px" color={semanticColors.menuIcon} style={{ transform: 'rotate(-90deg)' }} />,
  },
})

const History = ({
  wallet: { id },
  chain: {
    transactions: { pageNo = 1, pageSize = 15, totalCount = 0, items = [], keywords: incomingKeywords = '' },
  },
  history,
  location: { search },
  dispatch,
}: React.PropsWithoutRef<StateWithDispatch & RouteComponentProps>) => {
  const [t] = useTranslation()

  const { keywords, onKeywordsChange } = useSearch(search, incomingKeywords, id, dispatch)
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
      <TransactionList walletID={id} items={items} dispatch={dispatch} />
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
