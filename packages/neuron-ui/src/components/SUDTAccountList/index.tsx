import React, { useState, useCallback } from 'react'
import { useHistory } from 'react-router-dom'
import SUDTAccountPile, { SUDTAccountPileProps } from 'components/SUDTAccountPile'
import { SearchBox } from 'office-ui-fabric-react'
import SUDTCreateDialog, { TokenInfo } from 'components/SUDTCreateDialog'

import { Routes } from 'utils/const'

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
    address: 'account 0 address',
  },
  {
    accountId: 'account id 1',
    accountName: undefined,
    tokenName: undefined,
    symbol: undefined,
    balance: '',
    tokenId: 'token id 2',
    address: 'account 1 address',
  },
  {
    accountId: 'account id 2',
    accountName: 'accountName',
    tokenName: 'tokenName',
    symbol: 'symbol',
    balance: '1.1111111111111111111111111111111111111111111111',
    tokenId: 'token id 1',
    address: 'account 2 address',
  },
]

const SUDTAccountList = () => {
  const history = useHistory()
  const [accounts] = useState<SUDTAccount[]>(mock)
  const [selectedId, setSelectedId] = useState('')
  const [keyword, setKeyword] = useState('')
  const [dialog, setDialog] = useState<{ id: string; action: 'create' | 'update' } | null>(null)

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
        if (id) {
          setDialog({ id, action: 'update' })
        }
        break
      }
      case 'receive': {
        const account = accounts.find(a => a.accountId === id)
        if (!account) {
          break
        }
        const query = new URLSearchParams({
          address: account.address,
          accountName: account.accountName || '',
          tokenName: account.tokenName || '',
        })
        history.push(`${Routes.SUDTReceive}?${query}`)
        break
      }
      case 'send': {
        history.push(`${Routes.SUDTSend}/${id}`)
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

  const onCreateAccount = useCallback(
    (info: TokenInfo) => {
      console.info(info)
      return Promise.resolve(true).then(() => {
        setDialog(null)
        return true
      })
    },
    [setDialog]
  )

  const onOpenCreateDialog = useCallback(() => {
    setDialog({ id: '', action: 'create' })
  }, [setDialog])

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
        <div role="presentation" onClick={onOpenCreateDialog} className={styles.add} />
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
      {dialog?.action === 'update' ? <></> : null}
      {dialog?.action === 'create' ? (
        <SUDTCreateDialog
          onSubmit={onCreateAccount}
          onCancel={() => {
            setDialog(null)
          }}
        />
      ) : null}
    </div>
  )
}

SUDTAccountList.displayName = 'SUDTAccountList'

export default SUDTAccountList
