import React, { useMemo, useEffect } from 'react'
import { RouteComponentProps } from 'react-router-dom'
import { useTranslation } from 'react-i18next'

import styled from 'styled-components'

import { StateWithDispatch } from 'states/stateProvider/reducer'
import actionCreators from 'states/stateProvider/actionCreators'

import { localNumberFormatter } from 'utils/formatters'
import { PAGE_SIZE } from 'utils/const'

const OverviewPanel = styled.div`
  display: grid;
  grid-gap: 50px;
  grid-template:
    'balance activity' 1fr
    'blockchain activity' 1fr /
    1fr 1fr;
`
const Balance = styled.div`
  grid-area: balance;
`
const Activity = styled.div`
  grid-area: activity;
`

const Blockchain = styled.div`
  grid-area: blockchain;
`

const Field = styled.div`
  display: flex;
  justify-content: space-between;
  & span:first-child::after {
    content: ':';
  }
`

const General = ({
  dispatch,
  wallet: { addresses = [], balance = '' },
  chain: {
    networkID = '',
    transactions: { items = [] },
    tipBlockNumber = '0',
  },
  settings: { networks = [] },
}: React.PropsWithoutRef<StateWithDispatch & RouteComponentProps>) => {
  const [t] = useTranslation()
  const currentNetwork = useMemo(() => networks.find(n => n.id === networkID), [networkID, networks])
  const defaultKeywords = useMemo(() => addresses.map(addr => addr.address).join(','), [addresses])
  useEffect(() => {
    dispatch(actionCreators.getTransactions({ pageNo: 1, pageSize: PAGE_SIZE, keywords: defaultKeywords }))
  }, [dispatch, defaultKeywords])
  return (
    <OverviewPanel>
      <Balance>
        <h1>{t('general.balance')}</h1>
        <Field>
          <span>{t('general.amount')}</span>
          <span>{balance}</span>
        </Field>
        <Field>
          <span>{t('general.live-cells')}</span>
          <span>Mock Living Cells</span>
        </Field>
        <Field>
          <span>{t('general.cell-types')}</span>
          <span>Mock Cell Types</span>
        </Field>
      </Balance>
      <Activity>
        <h1>{t('general.recent-activities')}</h1>
        {items.length ? (
          <table>
            <tbody>
              {items.map(tx => (
                <tr key={tx.hash}>
                  <td>{tx.timestamp}</td>
                  <td>{tx.type}</td>
                  <td>{tx.status}</td>
                  <td>{tx.value}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div>{t('general.no-recent-activities')}</div>
        )}
      </Activity>
      <Blockchain>
        <h1>{t('general.blockchain-status')}</h1>
        {currentNetwork ? (
          <>
            <Field>
              <span>{t('general.blockchain-identity')}</span>
              <span>Mock Chain ID</span>
            </Field>
            <Field>
              <span>{t('general.block-height')}</span>
              <span>{`${localNumberFormatter(tipBlockNumber)}`}</span>
            </Field>
            <Field>
              <span>{t('general.rpc-service')}</span>
              <span>{currentNetwork.name}</span>
            </Field>
          </>
        ) : null}
      </Blockchain>
    </OverviewPanel>
  )
}

General.displayName = 'General'

export default General
