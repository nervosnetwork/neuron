import React from 'react'
import { NavLink, RouteComponentProps } from 'react-router-dom'
import { Stack, SearchBox, DefaultButton } from 'office-ui-fabric-react'
import { useTranslation } from 'react-i18next'
import { Search as SearchIcon } from 'grommet-icons'

import TransactionList from 'components/TransactionList'
import { StateWithDispatch } from 'states/stateProvider/reducer'

import { Routes } from 'utils/const'

import { useSearch } from './hooks'

const History = ({
  wallet: { addresses },
  chain: {
    transactions: { pageNo, pageSize, totalCount, items, keywords: incomingKeywords },
  },
  history,
  location: { search },
  dispatch,
}: React.PropsWithoutRef<StateWithDispatch & RouteComponentProps>) => {
  const [t] = useTranslation()

  const { keywords, onKeywordsChange } = useSearch(search, incomingKeywords, addresses, dispatch)
  const onSearch = () => history.push(`${Routes.History}?keywords=${keywords}`)
  const totalPages = Math.ceil(totalCount / pageSize) || 1

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
      <TransactionList items={items} dispatch={dispatch} />
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

export default History
