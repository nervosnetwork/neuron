import React from 'react'
import { storiesOf } from '@storybook/react'
import { action } from '@storybook/addon-actions'
import SUDTAccountPile, { SUDTAccountPileProps } from 'components/SUDTAccountPile'

const stories = storiesOf('sUD Account Pile', module)

const onEditClick = (e: any) => action('Edit')(e.target.dataset.id)
const onReceiveClick = (e: any) => action('Receive')(e.target.dataset.id)
const onSendClick = (e: any) => action('Send')(e.target.dataset.id)

const piles: { [accountType: string]: SUDTAccountPileProps } = {
  sUDT: {
    accountId: 'account id',
    accountName: 'accountName',
    tokenName: 'tokenName',
    symbol: 'symbol',
    balance: '1.1111111111111111111111111111111111111111111111',
    tokenId: 'token id 1',
    isSelected: false,
    onEditClick,
    onReceiveClick,
    onSendClick,
  },
  Unknown: {
    accountId: 'account id',
    accountName: undefined,
    tokenName: undefined,
    symbol: undefined,
    balance: '',
    tokenId: 'token id 2',
    isSelected: false,
    onEditClick,
    onReceiveClick,
    onSendClick,
  },
  selected: {
    accountId: 'account id',
    accountName: 'accountName',
    tokenName: 'tokenName',
    symbol: 'symbol',
    balance: '1.1111111111111111111111111111111111111111111111',
    tokenId: 'token id 1',
    isSelected: true,
    onEditClick,
    onReceiveClick,
    onSendClick,
  },
}

Object.entries(piles).forEach(([accountType, accountProps]) => {
  stories.add(accountType, () => {
    return <SUDTAccountPile {...accountProps} />
  })
})
