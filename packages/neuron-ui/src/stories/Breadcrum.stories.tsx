import { Meta, StoryObj } from '@storybook/react'
import { withRouter } from 'storybook-addon-react-router-v6'
import Breadcrum from 'widgets/Breadcrum'

const meta: Meta<typeof Breadcrum> = {
  component: Breadcrum,
  decorators: [withRouter()],
}

export default meta

type Story = StoryObj<typeof Breadcrum>

export const Empty: Story = {
  args: {
    pages: [],
  },
}

export const Root: Story = {
  args: {
    pages: [
      {
        label: 'root',
        link: 'root',
      },
    ],
  },
}

export const TwoLayers: Story = {
  args: {
    pages: [
      { label: 'root', link: 'root' },
      { label: 'first', link: 'first' },
    ],
  },
}

export const ThreeLayers: Story = {
  args: {
    pages: [
      { label: 'root', link: 'root' },
      { label: 'first', link: 'first' },
      { label: 'second', link: 'second' },
    ],
  },
}
