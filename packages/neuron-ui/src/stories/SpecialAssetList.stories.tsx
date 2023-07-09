import { Meta, StoryObj } from '@storybook/react'
import { withRouter } from 'storybook-addon-react-router-v6'
import SpecialAssetList from 'components/SpecialAssetList'

const meta: Meta<typeof SpecialAssetList> = {
  component: SpecialAssetList,
  decorators: [withRouter],
}

export default meta

type Story = StoryObj<typeof SpecialAssetList>

export const Default: Story = {}
