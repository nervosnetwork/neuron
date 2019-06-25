/* globals BigInt */
import React, { useMemo } from 'react'
import styled from 'styled-components'
import { useNeuronWallet } from 'utils/hooks'
import { useTranslation } from 'react-i18next'

const GeneralPanel = styled.div`
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

const General = () => {
  const {
    wallet: { addresses },
    chain: {
      networkId,
      transactions: { items },
      tipBlockNumber,
    },
    settings: { networks },
  } = useNeuronWallet()
  const [t] = useTranslation()
  const activeNetwork = useMemo(() => networks.find(n => n.id === networkId), [networkId, networks])
  const balance = useMemo(() => {
    return addresses.reduce((total, addr) => total + BigInt(addr.balance), BigInt(0)).toString()
  }, [addresses])
  return (
    <GeneralPanel>
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
        {activeNetwork ? (
          <>
            <Field>
              <span>{t('general.blockchain-identity')}</span>
              <span>Mock Chain ID</span>
            </Field>
            <Field>
              <span>{t('general.block-height')}</span>
              <span>{`${(100000).toLocaleString()} / ${+(tipBlockNumber || 0).toLocaleString()}`}</span>
            </Field>
            <Field>
              <span>{t('general.rpc-service')}</span>
              <span>{activeNetwork.name}</span>
            </Field>
          </>
        ) : null}
      </Blockchain>
    </GeneralPanel>
  )
}

General.displayName = 'General'

export default General
