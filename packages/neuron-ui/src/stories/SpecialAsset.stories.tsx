import { Meta, StoryObj } from '@storybook/react'
import SpecialAsset, { SpecialAssetProps } from 'components/SpecialAsset'

const props: {
  [name: string]: Omit<SpecialAssetProps, 'onAction'>
} = {
  TypeAndData: {
    cell: {
      outPoint: {
        txHash: '',
        index: '',
      },
      capacity: '123456789012345678',
      lock: {
        args: '0xd2393e52df67cc0c231ef8cb04418bfeabb7b5e8b402009b00f00020',
        codeHash: '0x5c5069eb0857efc65e1bca0c07df34c31663b3622fd3876c876320fc9634e2a8',
        hashType: 'type',
      },
      type: undefined,
      data: '0x',
    },
    epoch: '0x3dd011d0004fb',
    datetime: new Date().getTime(),
    isMainnet: true,
    connectionStatus: 'online',
    bestKnownBlockTimestamp: Date.now(),
    tokenInfoList: [],
    assetInfo: {
      data: '',
      lock: 'SingleMultiSign',
      type: '',
    },
  },
  Type: {
    cell: {
      outPoint: {
        txHash: '',
        index: '',
      },
      capacity: '123456789012345678',
      lock: {
        args: '0xd2393e52df67cc0c231ef8cb04418bfeabb7b5e8b402009b00f00020',
        codeHash: '0x5c5069eb0857efc65e1bca0c07df34c31663b3622fd3876c876320fc9634e2a8',
        hashType: 'type',
      },
      type: undefined,
      data: '0x',
    },
    epoch: '0x3dd011d0004fb',
    datetime: new Date().getTime(),
    isMainnet: true,
    connectionStatus: 'online',
    bestKnownBlockTimestamp: Date.now(),
    tokenInfoList: [],
    assetInfo: {
      data: '',
      lock: 'SingleMultiSign',
      type: '',
    },
  },
  Data: {
    cell: {
      outPoint: {
        txHash: '',
        index: '',
      },

      capacity: '123456789012345678',
      lock: {
        args: '0xd2393e52df67cc0c231ef8cb04418bfeabb7b5e8b402009b00f00020',
        codeHash: '0x5c5069eb0857efc65e1bca0c07df34c31663b3622fd3876c876320fc9634e2a8',
        hashType: 'type',
      },
      type: undefined,
      data: '0x',
    },
    epoch: '0x3dd011d0004fb',
    datetime: new Date().getTime(),
    isMainnet: true,
    connectionStatus: 'online',
    bestKnownBlockTimestamp: Date.now(),
    tokenInfoList: [],
    assetInfo: {
      data: '',
      lock: 'SingleMultiSign',
      type: '',
    },
  },
  UserDefinedAsset: {
    cell: {
      capacity: '123456789012345678',
      outPoint: {
        txHash: '',
        index: '',
      },
      lock: {
        args: '0xd2393e52df67cc0c231ef8cb04418bfeabb7b5e8b402009b00f00020',
        codeHash: '0x5c5069eb0857efc65e1bca0c07df34c31663b3622fd3876c876320fc9634e2a8',
        hashType: 'type',
      },
      type: undefined,
      data: '0x',
    },
    epoch: '0x3dd011d0004fb',
    datetime: new Date().getTime(),
    isMainnet: true,
    connectionStatus: 'online',
    bestKnownBlockTimestamp: Date.now(),
    tokenInfoList: [],
    assetInfo: {
      data: '',
      lock: 'SingleMultiSign',
      type: '',
    },
  },
  Locked: {
    cell: {
      capacity: '123456789012345678',
      outPoint: {
        txHash: '',
        index: '',
      },
      lock: {
        args: '0xd2393e52df67cc0c231ef8cb04418bfeabb7b5e8b402009b00f00020',
        codeHash: '0x5c5069eb0857efc65e1bca0c07df34c31663b3622fd3876c876320fc9634e2a8',
        hashType: 'type',
      },
      type: undefined,
      data: '0x',
    },
    epoch: '0x3dd011d0004fb',
    datetime: new Date().getTime(),
    isMainnet: true,
    connectionStatus: 'online',
    bestKnownBlockTimestamp: Date.now(),
    tokenInfoList: [],
    assetInfo: {
      data: '',
      lock: 'SingleMultiSign',
      type: '',
    },
  },
  Claim: {
    cell: {
      capacity: '123456789012345678',
      outPoint: {
        txHash: '',
        index: '',
      },
      lock: {
        args: '0xd2393e52df67cc0c231ef8cb04418bfeabb7b5e8b402009b00f00020',
        codeHash: '0x5c5069eb0857efc65e1bca0c07df34c31663b3622fd3876c876320fc9634e2a8',
        hashType: 'type',
      },
      type: undefined,
      data: '0x',
    },
    epoch: '0x3dd011d0004fb',
    datetime: new Date().getTime(),
    isMainnet: true,
    connectionStatus: 'online',
    bestKnownBlockTimestamp: Date.now(),
    tokenInfoList: [],
    assetInfo: {
      data: '',
      lock: 'SingleMultiSign',
      type: '',
    },
  },
  Offline: {
    cell: {
      capacity: '123456789012345678',
      outPoint: {
        txHash: '',
        index: '',
      },
      lock: {
        args: '0xd2393e52df67cc0c231ef8cb04418bfeabb7b5e8b402009b00f00020',
        codeHash: '0x5c5069eb0857efc65e1bca0c07df34c31663b3622fd3876c876320fc9634e2a8',
        hashType: 'type',
      },
      type: undefined,
      data: '0x',
    },
    epoch: '0x3dd011d0004fb',
    datetime: new Date().getTime(),
    isMainnet: true,
    connectionStatus: 'offline',
    bestKnownBlockTimestamp: Date.now(),
    tokenInfoList: [],
    assetInfo: {
      data: '',
      lock: 'SingleMultiSign',
      type: '',
    },
  },
}

const meta: Meta<typeof SpecialAsset> = {
  component: SpecialAsset,
  args: {
    onAction: console.info,
  },
}

export default meta

type Story = StoryObj<typeof SpecialAsset>

export const TypeAndData: Story = {
  args: props.TypeAndData,
}

export const Type: Story = {
  args: props.Type,
}

export const Data: Story = {
  args: props.Data,
}

export const UserDefinedAsset: Story = {
  args: props.UserDefinedAsset,
}

export const Locked: Story = {
  args: props.Locked,
}

export const Claim: Story = {
  args: props.Claim,
}

export const Offline: Story = {
  args: props.Offline,
}
