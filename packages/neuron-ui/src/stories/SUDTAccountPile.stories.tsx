import React from 'react'
import { storiesOf } from '@storybook/react'
import { action } from '@storybook/addon-actions'
import SUDTAccountPile, { SUDTAccountPileProps } from 'components/SUDTAccountPile'

const stories = storiesOf('sUD Account Pile', module)

const eventListeners = {
  onClick: (e: any) => action('Click')(e.target.dataset.id, e.currentTarget.dataset.role),
}

const piles: { [accountType: string]: SUDTAccountPileProps } = {
  sUDT: {
    accountId: 'account id',
    accountName: 'accountName',
    tokenName: 'tokenName',
    symbol: 'symbol',
    balance: '1.1111111111111111111111111111111111111111111111',
    tokenId: 'token id 1',
    isSelected: false,
    ...eventListeners,
  },
  Unknown: {
    accountId: 'account id',
    accountName: undefined,
    tokenName: undefined,
    symbol: undefined,
    balance: '',
    tokenId: 'token id 2',
    isSelected: false,
    ...eventListeners,
  },
  selected: {
    accountId: 'account id',
    accountName: 'accountName',
    tokenName: 'tokenName',
    symbol: 'symbol',
    balance: '1.1111111111111111111111111111111111111111111111',
    tokenId: 'token id 1',
    isSelected: true,
    ...eventListeners,
  },
}

Object.entries(piles).forEach(([accountType, accountProps]) => {
  stories.add(accountType, () => {
    return <SUDTAccountPile {...accountProps} />
  })
})
