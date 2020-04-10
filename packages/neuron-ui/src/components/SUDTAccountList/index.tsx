import React, { useState } from 'react'
import SUDTAccountPile, { SUDTAccountPileProps } from 'components/SUDTAccountPile'

import styles from './sUDTAccountList.module.scss'

export type SUDTAccount = Omit<SUDTAccountPileProps, 'onClick' | 'isSelected'>

const mock: SUDTAccount[] = [
  {
    accountId: 'account id 0',
    accountName: 'accountName',
    tokenName: 'tokenName',
    symbol: 'symbol',
    balance: '1.1111111111111111111111111111111111111111111111',
    tokenId: 'token id 1',
  },
  {
    accountId: 'account id 1',
    accountName: undefined,
    tokenName: undefined,
    symbol: undefined,
    balance: '',
    tokenId: 'token id 2',
  },
  {
    accountId: 'account id 2',
    accountName: 'accountName',
    tokenName: 'tokenName',
    symbol: 'symbol',
    balance: '1.1111111111111111111111111111111111111111111111',
    tokenId: 'token id 1',
  },
]

const SUDTAccountList = () => {
  const [accounts] = useState<SUDTAccount[]>(mock)
  const [selectedId, setSelectedId] = useState('')

  const onClick = (e: any) => {
    const {
      target: {
        dataset: { role },
      },
      currentTarget: {
        dataset: { id },
      },
    } = e

    switch (role) {
      case 'edit': {
        console.info('Edit', id)
        break
      }
      case 'receive': {
        console.info('Receive', id)
        break
      }
      case 'send': {
        console.info('Send', id)
        break
      }
      default: {
        console.info('Select', id)
        setSelectedId(id)
      }
    }
  }

  return (
    <div className={styles.container}>
      <input type="text" />
      <div className={styles.list}>
        {accounts.map(account => (
          <SUDTAccountPile
            key={account.accountId}
            {...account}
            isSelected={selectedId === account.accountId}
            onClick={onClick}
          />
        ))}
      </div>
    </div>
  )
}

SUDTAccountList.displayName = 'SUDTAccountList'

export default SUDTAccountList
