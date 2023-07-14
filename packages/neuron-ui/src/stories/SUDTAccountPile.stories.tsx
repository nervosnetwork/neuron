import { Meta, StoryObj } from '@storybook/react'
import { action } from '@storybook/addon-actions'
import SUDTAccountPile, { SUDTAccountPileProps } from 'components/SUDTAccountPile'

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
    decimal: '10',
    ...eventListeners,
  },
  Unknown: {
    accountId: 'account id',
    accountName: undefined,
    tokenName: undefined,
    symbol: undefined,
    balance: '',
    tokenId: 'token id 2',
    decimal: '10',
    ...eventListeners,
  },
  selected: {
    accountId: 'account id',
    accountName: 'accountName',
    tokenName: 'tokenName',
    symbol: 'symbol',
    balance: '1.1111111111111111111111111111111111111111111111',
    tokenId: 'token id 1',
    decimal: '10',
    ...eventListeners,
  },
}

const meta: Meta<typeof SUDTAccountPile> = {
  component: SUDTAccountPile,
}

export default meta

type Story = StoryObj<typeof SUDTAccountPile>

export const sUDT: Story = {
  args: piles.sUDT,
}

export const Unknown: Story = {
  args: piles.Unknown,
}

export const selected: Story = {
  args: piles.selected,
}
