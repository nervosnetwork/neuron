import { Meta, StoryObj } from '@storybook/react'
import { action } from '@storybook/addon-actions'
import SUDTCreateDialog, { TokenInfo, SUDTCreateDialogProps } from 'components/SUDTCreateDialog'

const baseProps = {
  accountName: '',
  tokenName: '',
  symbol: '',
  decimal: '',
  tokenId: '',
  onSubmit: (info: TokenInfo): any => {
    return new Promise(resolve => {
      action('submit')(info)
      resolve(true)
    })
  },
  onCancel: () => action('cancel')(),
  existingAccountNames: ['name1', 'name2'],
  isMainnet: true,
}
const propsList: { [name: string]: SUDTCreateDialogProps } = {
  Basic: baseProps,
  InsufficientForSUDT: { ...baseProps, insufficient: { ckb: false, sudt: true, xudt: true } },
  InsufficientForCKB: { ...baseProps, insufficient: { ckb: true, sudt: false, xudt: false } },
  InsufficientForCKBAndSUDT: { ...baseProps, insufficient: { ckb: true, sudt: true, xudt: true } },
}

const meta: Meta<typeof SUDTCreateDialog> = {
  component: SUDTCreateDialog,
}

export default meta

type Story = StoryObj<typeof SUDTCreateDialog>

export const Basic: Story = {
  args: propsList.Basic,
}

export const InsufficientForSUDT: Story = {
  args: propsList.InsufficientForSUDT,
}

export const InsufficientForCKB: Story = {
  args: propsList.InsufficientForCKB,
}

export const InsufficientForCKBAndSUDT: Story = {
  args: propsList.InsufficientForCKBAndSUDT,
}
