import { Meta, StoryObj } from '@storybook/react'
import { action } from '@storybook/addon-actions'
import SUDTUpdateDialog, { TokenInfo } from 'components/SUDTUpdateDialog'

const meta: Meta<typeof SUDTUpdateDialog> = {
  component: SUDTUpdateDialog,
}

export default meta

type Story = StoryObj<typeof SUDTUpdateDialog>

const commArgs = {
  accountName: 'account name',
  tokenName: 'token name',
  symbol: 'symbol',
  decimal: '8',
  tokenId: 'token id',
  accountId: 'account id',
  balance: '200',
  onSubmit: (info: Omit<TokenInfo, 'isCKB'>) => {
    return new Promise<boolean>(resolve => {
      action('submit')(info)
      resolve(true)
    })
  },
  onCancel: () => action('cancel')(),
  existingAccountNames: ['name1', 'name2'],
}

export const SUDTToken: Story = {
  args: {
    ...commArgs,
    isCKB: false,
    isMainnet: true,
  },
}

export const CKB: Story = {
  args: {
    ...commArgs,
    isCKB: true,
    isMainnet: false,
  },
}
