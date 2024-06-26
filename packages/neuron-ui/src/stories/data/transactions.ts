const transactions: {
  [title: string]: State.Transaction[]
} = {
  'Empty List': [],
  'Content List': [
    {
      type: 'destroy',
      createdAt: (new Date(1565240655845).getTime() - 100000).toString(),
      updatedAt: '',
      timestamp: '',
      value: '-10000',
      hash: '0x70abeeaa2ed08b7d7659341a122b9a2f2ede99bb6bd0df7398d7ffe488beab61',
      description: 'description of send transaction',
      blockNumber: '120',
      status: 'pending',
      nervosDao: false,
      sudtInfo: {
        sUDT: {
          tokenID: 'token id',
          tokenName: 'Token Name',
          symbol: 'Token Symbol',
          decimal: '12',
        },
        amount: '0',
      },
      assetAccountType: 'sUDT',
    },
    {
      type: 'create',
      createdAt: (new Date(1565240655845).getTime() - 100000).toString(),
      updatedAt: '',
      timestamp: '',
      value: '-10000',
      hash: '0x70abeeaa2ed08b7d7659341a122b9a2f2ede99bb6bd0df7398d7ffe488beab61',
      description: 'description of send transaction',
      blockNumber: '120',
      status: 'success',
      nervosDao: false,
      sudtInfo: {
        sUDT: {
          tokenID: 'token id',
          tokenName: 'Token Name',
          symbol: 'Token Symbol',
          decimal: '12',
        },
        amount: '0',
      },
      assetAccountType: 'sUDT',
    },
    {
      type: 'send',
      createdAt: (new Date(1565240655845).getTime() - 100000).toString(),
      updatedAt: '',
      timestamp: '',
      value: '-10000',
      hash: '0x70abeeaa2ed08b7d7659341a122b9a2f2ede99bb6bd0df7398d7ffe488beab60',
      description: 'description of send transaction',
      blockNumber: '120',
      status: 'pending',
      nervosDao: false,
      sudtInfo: {
        sUDT: {
          tokenID: 'token id',
          tokenName: '',
          symbol: '',
          decimal: '',
        },
        amount: '100000',
      },
    },
    {
      type: 'send',
      createdAt: (new Date(1565240655845).getTime() - 100000).toString(),
      updatedAt: '',
      timestamp: '',
      value: '-10000',
      hash: '0x70abeeaa2ed08b7d7659341a122b9a2f2ede99bb6bd0df7398d7ffe488beab61',
      description: 'description of send transaction',
      blockNumber: '120',
      status: 'pending',
      nervosDao: false,
      sudtInfo: {
        sUDT: {
          tokenID: 'token id',
          tokenName: 'Token Name',
          symbol: 'Token Symbol',
          decimal: '12',
        },
        amount: '100000',
      },
    },
    {
      type: 'receive',
      createdAt: (new Date(1565240655845).getTime() - 200000).toString(),
      updatedAt: '',
      timestamp: '',
      value: '10000',
      hash: '0x70abeeaa2ed08b7d7659341a122b9a2f2ede99bb6bd0df7398d7ffe488beab62',
      description: 'description of receive transaction',
      blockNumber: '120',
      status: 'pending',
      nervosDao: false,
      sudtInfo: {
        sUDT: {
          tokenID: 'token id',
          tokenName: 'Token Name',
          symbol: 'Token Symbol',
          decimal: '12',
        },
        amount: '-100000',
      },
    },
    {
      type: 'send',
      createdAt: (new Date(1565240655845).getTime() - 100000).toString(),
      updatedAt: '',
      timestamp: '',
      value: '-10000',
      hash: '0x70abeeaa2ed08b7d7659341a122b9a2f2ede99bb6bd0df7398d7ffe488beab11',
      description: 'description of send transaction',
      blockNumber: '120',
      status: 'success',
      nervosDao: true,
    },
    {
      type: 'receive',
      createdAt: (new Date(1565240655845).getTime() - 200000).toString(),
      updatedAt: '',
      timestamp: '',
      value: '10000',
      hash: '0x70abeeaa2ed08b7d7659341a122b9a2f2ede99bb6bd0df7398d7ffe488beab22',
      description: 'description of receive transaction',
      blockNumber: '120',
      status: 'success',
      nervosDao: false,
    },
    {
      type: 'send',
      createdAt: '',
      updatedAt: '',
      timestamp: (new Date(1565240655845).getTime() - 300000).toString(),
      value: '-10000',
      hash: '0x70abeeaa2ed08b7d7659341a122b9a2f2ede99bb6bd0df7398d7ffe488beab63',
      description: 'description of send transaction',
      blockNumber: '0',
      status: 'success',
      nervosDao: true,
    },
    {
      type: 'receive',
      createdAt: '',
      updatedAt: '',
      timestamp: (new Date(1565240655845).getTime() - 400000).toString(),
      value: '10000',
      hash: '0x70abeeaa2ed08b7d7659341a122b9a2f2ede99bb6bd0df7398d7ffe488beab64',
      description: 'description of receive transaction',
      blockNumber: '0',
      status: 'success',
      nervosDao: false,
    },
    {
      type: 'send',
      createdAt: (new Date(1565240655845).getTime() - 500000).toString(),
      updatedAt: '',
      timestamp: '',
      value: '-10000',
      hash: '0x70abeeaa2ed08b7d7659341a122b9a2f2ede99bb6bd0df7398d7ffe488beab65',
      description: 'description of send transaction',
      blockNumber: '0',
      status: 'failed',
      nervosDao: true,
    },
    {
      type: 'receive',
      createdAt: (new Date(1565240655845).getTime() - 600000).toString(),
      updatedAt: '',
      timestamp: '',
      value: '10000',
      hash: '0x70abeeaa2ed08b7d7659341a122b9a2f2ede99bb6bd0df7398d7ffe488beab66',
      description: 'description of receive transaction',
      blockNumber: '0',
      status: 'failed',
      nervosDao: false,
    },
    {
      type: 'send',
      createdAt: new Date('2019-05-18').getTime().toString(),
      updatedAt: '',
      timestamp: '',
      value: '-10000',
      hash: '0x70abeeaa2ed08b7d7659341a122b9a2f2ede99bb6bd0df7398d7ffe488beab67',
      description: 'description of send transaction',
      blockNumber: '0',
      status: 'failed',
      nervosDao: true,
    },
    {
      type: 'receive',
      createdAt: new Date('2019-05-18').getTime().toString(),
      updatedAt: '',
      timestamp: '',
      value: '10000',
      hash: '0x70abeeaa2ed08b7d7659341a122b9a2f2ede99bb6bd0df7398d7ffe488beab68',
      description: 'description of receive transaction',
      blockNumber: '0',
      status: 'failed',
      nervosDao: false,
    },
    {
      type: 'send',
      createdAt: new Date('2019-04-18').getTime().toString(),
      updatedAt: '',
      timestamp: '',
      value: '-10000',
      hash: '0x70abeeaa2ed08b7d7659341a122b9a2f2ede99bb6bd0df7398d7ffe488beab69',
      description: 'description of send transaction',
      blockNumber: '0',
      status: 'failed',
      nervosDao: true,
    },
    {
      type: 'receive',
      createdAt: new Date('2019-04-18').getTime().toString(),
      updatedAt: '',
      timestamp: '',
      value: '10000',
      hash: '0x70abeeaa2ed08b7d7659341a122b9a2f2ede99bb6bd0df7398d7ffe488beab10',
      description: 'description of receive transaction',
      blockNumber: '0',
      status: 'failed',
      nervosDao: false,
    },
    {
      type: 'send',
      createdAt: new Date('2019-04-17').getTime().toString(),
      updatedAt: '',
      timestamp: '',
      value: '-10000',
      hash: '0x70abeeaa2ed08b7d7659341a122b9a2f2ede99bb6bd0df7398d7ffe488beab11',
      description: 'description of send transaction',
      blockNumber: '0',
      status: 'failed',
      nervosDao: true,
    },
    {
      type: 'receive',
      createdAt: new Date('2019-04-16').getTime().toString(),
      updatedAt: '',
      timestamp: '',
      value: '10000',
      hash: '0x70abeeaa2ed08b7d7659341a122b9a2f2ede99bb6bd0df7398d7ffe488beab12',
      description: 'description of receive transaction',
      blockNumber: '0',
      status: 'failed',
      nervosDao: false,
    },
  ],
}

export default transactions
