import { withRouter } from 'storybook-addon-react-router-v6'
import { Meta, StoryObj } from '@storybook/react'
import SUDTReceiveDialog from 'components/SUDTReceiveDialog'

const meta: Meta<typeof SUDTReceiveDialog> = {
  component: SUDTReceiveDialog,
  decorators: [withRouter],
}

export default meta

type Story = StoryObj<typeof SUDTReceiveDialog>

export const Default: Story = {
  args: {
    data: {
      acccountID: '1',
      address: 'ckt1q9gry5zg8stq8ruq5wfz3lm5wn2k7qw3ulsfmdhe98f2j1',
      accountName: 'account name',
      tokenName: 'token name',
      symbol: 'CKB',
    },
  },
}
