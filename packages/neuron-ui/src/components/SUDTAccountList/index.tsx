import React, { useState, useCallback } from 'react'
import SUDTAccountPile, { SUDTAccountPileProps } from 'components/SUDTAccountPile'
import { SearchBox } from 'office-ui-fabric-react'

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
  const [keyword, setKeyword] = useState('')

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

  const onKeywordChange = useCallback(
    (_e?: React.ChangeEvent<HTMLInputElement>, newValue?: string) => {
      if (newValue !== undefined) {
        setKeyword(newValue)
      }
    },
    [setKeyword]
  )

  const filteredAccounts = keyword
    ? accounts.filter(
        account =>
          account.accountName?.includes(keyword) ||
          account.tokenName?.includes(keyword) ||
          account.symbol === keyword ||
          account.tokenId === keyword
      )
    : accounts

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <SearchBox
          value={keyword}
          styles={{
            root: {
              background: '#e3e3e3',
              border: 'none',
              borderRadius: 0,
              fontSize: '1rem',
            },
          }}
          placeholder="search"
          onChange={onKeywordChange}
          iconProps={{ iconName: 'Search', styles: { root: { height: '18px' } } }}
        />
      </div>
      <div className={styles.list}>
        {filteredAccounts.length ? (
          filteredAccounts.map(account => (
            <SUDTAccountPile
              key={account.accountId}
              {...account}
              isSelected={selectedId === account.accountId}
              onClick={onClick}
            />
          ))
        ) : (
          <div className={styles.notice}>No asset accounts</div>
        )}
      </div>
    </div>
  )
}

SUDTAccountList.displayName = 'SUDTAccountList'

export default SUDTAccountList
