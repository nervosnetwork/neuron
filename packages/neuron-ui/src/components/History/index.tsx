import React, { useCallback, useMemo } from 'react'
import { NavLink, RouteComponentProps } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Stack, SearchBox, DefaultButton } from 'office-ui-fabric-react'
import { Search as SearchIcon } from 'grommet-icons'

import TransactionList from 'components/TransactionList'
import { StateWithDispatch } from 'states/stateProvider/reducer'

import { Routes } from 'utils/const'

import { useSearch } from './hooks'

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
  const totalPages = useMemo(() => Math.ceil(totalCount / pageSize) || 1, [totalCount, pageSize])

  return (
    <Stack>
      <Stack horizontal horizontalAlign="start" tokens={{ childrenGap: 15 }}>
        <SearchBox
          value={keywords}
          styles={{ root: { width: 200 } }}
          placeholder="Search"
          onChange={onKeywordsChange}
          onSearch={onSearch}
        />
        <DefaultButton onClick={onSearch}>
          <SearchIcon />
        </DefaultButton>
      </Stack>
      <TransactionList walletID={id} items={items} dispatch={dispatch} />
      <div style={{ display: 'flex', justifyContent: 'center' }}>
        <NavLink to={`${Routes.History}?pageNo=1`}>{t('history.first')}</NavLink>
        <NavLink
          to={`${Routes.History}?pageNo=${pageNo - 1}`}
          style={{
            pointerEvents: pageNo - 1 < 1 ? 'none' : 'auto',
            color: pageNo - 1 < 1 ? 'grey' : '#007bff',
          }}
        >
          {t('history.previous')}
        </NavLink>
        <NavLink
          to={`${Routes.History}?pageNo=${pageNo + 1}`}
          style={{
            pointerEvents: pageNo + 1 > totalPages ? 'none' : 'auto',
            color: pageNo + 1 > totalPages ? 'grey' : '#007bff',
          }}
        >
          {t('history.next')}
        </NavLink>
        <NavLink to={`${Routes.History}?pageNo=${totalPages}`}>{t('history.last')}</NavLink>
      </div>
    </Stack>
  )
}

History.displayName = 'History'

export default History
