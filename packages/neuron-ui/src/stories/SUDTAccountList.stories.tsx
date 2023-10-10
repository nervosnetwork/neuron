import { Meta, StoryObj } from '@storybook/react'
import { withRouter } from 'storybook-addon-react-router-v6'
import SUDTAccountList from 'components/SUDTAccountList'

const meta: Meta<typeof SUDTAccountList> = {
  component: SUDTAccountList,
  decorators: [withRouter],
}

export default meta

type Story = StoryObj<typeof SUDTAccountList>

export const Default: Story = {}
