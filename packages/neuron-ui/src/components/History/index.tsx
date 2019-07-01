import React from 'react'
import { NavLink, RouteComponentProps } from 'react-router-dom'
import { Stack, MessageBar, MessageBarType, SearchBox, DefaultButton } from 'office-ui-fabric-react'
import { useTranslation } from 'react-i18next'
import { Search as SearchIcon } from 'grommet-icons'

import TransactionList from 'components/TransactionList'

import { ContentProps } from 'containers/MainContent'

import { useNeuronWallet } from 'utils/hooks'
import { Routes } from 'utils/const'

import { useSearch } from './hooks'

const History = ({
  history,
  location: { search },
  errorMsgs,
  dispatch,
  providerDispatch,
}: React.PropsWithoutRef<ContentProps & RouteComponentProps>) => {
  const {
    chain: {
      transactions: { pageNo, pageSize, totalCount, items, keywords: incomingKeywords },
    },
  } = useNeuronWallet()
  const [t] = useTranslation()

  const { keywords, onKeywordsChange } = useSearch(search, incomingKeywords, dispatch, providerDispatch)
  const onSearch = () => history.push(`${Routes.History}?keywords=${keywords}`)
  const totalPages = Math.ceil(totalCount / pageSize) || 1

  return (
    <Stack>
      {errorMsgs.transaction ? (
        <MessageBar messageBarType={MessageBarType.warning}>{t(`messages.${errorMsgs.transactions}`)}</MessageBar>
      ) : null}
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
