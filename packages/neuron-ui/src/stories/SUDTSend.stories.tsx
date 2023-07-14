import { Meta, StoryObj } from '@storybook/react'
import { withRouter } from 'storybook-addon-react-router-v6'
import SUDTSend from 'components/SUDTSend'

const meta: Meta<typeof SUDTSend> = {
  component: SUDTSend,
  decorators: [withRouter],
}

export default meta

type Story = StoryObj<typeof SUDTSend>

export const Default: Story = {}
