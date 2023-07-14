import { Meta, StoryObj } from '@storybook/react'
import SignAndVerify from 'components/SignAndVerify'
import { withRouter } from 'storybook-addon-react-router-v6'

const meta: Meta<typeof SignAndVerify> = {
  component: SignAndVerify,
  decorators: [withRouter()],
}

export default meta

type Story = StoryObj<typeof SignAndVerify>

export const Default: Story = {}
