import React from 'react'
import { NavLink, RouteComponentProps } from 'react-router-dom'
import { Container, Alert } from 'react-bootstrap'
import { useTranslation } from 'react-i18next'

import TransactionList from 'components/TransactionList'

import { ContentProps } from 'containers/MainContent'
import { Search as SearchIcon } from 'grommet-icons'

import { useNeuronWallet } from 'utils/hooks'
import { Routes } from 'utils/const'

import { useSearch } from './hooks'

const History = ({
  location: { search },
  errorMsgs,
  dispatch,
  providerDispatch,
}: React.PropsWithoutRef<ContentProps & RouteComponentProps>) => {
  const {
    chain: {
      transactions: { pageNo, pageSize, totalCount, items },
    },
  } = useNeuronWallet()
  const [t] = useTranslation()

  const { keywords, onKeywordsChange } = useSearch(search, dispatch, providerDispatch)
  const totalPages = Math.ceil(totalCount / pageSize) || 1

  return (
    <Container>
      <h1>{t('navbar.history')}</h1>
      {errorMsgs.transaction ? <Alert variant="warning">{t(`messages.${errorMsgs.transactions}`)}</Alert> : null}
      <div style={{ display: 'flex' }}>
        <input type="text" alt="search" value={keywords} onChange={onKeywordsChange} />
        <NavLink to={`${Routes.History}?keywords=${keywords}`}>
          <SearchIcon />
        </NavLink>
      </div>
      <TransactionList items={items} dispatch={dispatch} />
      <div style={{ display: 'flex', justifyContent: 'center' }}>
        <NavLink to={`${Routes.History}?pageNo=1`}>{t('history.first')}</NavLink>
        <NavLink
          to={`${Routes.History}?pageNo=${pageNo - 1}`}
          style={{
            pointerEvents: pageNo - 1 < 1 ? 'none' : 'auto',
            color: pageNo - 1 < 1 ? 'grey' : 'current',
          }}
        >
          {t('history.previous')}
        </NavLink>
        <NavLink
          to={`${Routes.History}?pageNo=${pageNo + 1}`}
          style={{
            pointerEvents: pageNo + 1 > totalPages ? 'none' : 'auto',
            color: pageNo + 1 > totalPages ? 'grey' : 'current',
          }}
        >
          {t('history.next')}
        </NavLink>
        <NavLink to={`${Routes.History}?pageNo=${totalPages}`}>{t('history.last')}</NavLink>
      </div>
    </Container>
  )
}

export default History
