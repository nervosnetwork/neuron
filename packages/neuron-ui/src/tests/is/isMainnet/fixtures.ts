const fixtures = {
  'Should return false when network id is empty': {
    params: {
      networkID: '',
      networks: [],
    },
    expected: false,
  },
  'Should return false when network list is empty': {
    params: {
      networkID: 'mainnet',
      networks: [],
    },
    expected: false,
  },
  'Should return false when network id cannot be found in network list': {
    params: {
      networkID: 'testnet',
      networks: [
        {
          id: 'mainnet',
          chain: 'ckb',
          type: 0 as 0 | 1,
          name: 'Mainnet',
          remote: 'http://127.0.0.1:8114',
          genesisHash: '0x10639e0895502b5688a6be8cf69460d76541bfa4821629d86d62ba0aae3f9606',
        },
      ],
    },
    expected: false,
  },
  "Should return false when network id can be found in network list but it's not Mainnet": {
    params: {
      networkID: 'testnet',
      networks: [
        {
          id: 'testnet',
          chain: 'ckb_testnet',
          type: 0 as 0 | 1,
          name: 'Mainnet',
          remote: 'http://127.0.0.1:8114',
          genesisHash: '0x10639e0895502b5688a6be8cf69460d76541bfa4821629d86d62ba0aae3f9606',
        },
      ],
    },
    expected: false,
  },
  "Should return true when network id can be found in network list and it's Mainnet": {
    params: {
      networkID: 'mainnet',
      networks: [
        {
          id: 'mainnet',
          chain: 'ckb',
          type: 0 as 0 | 1,
          name: 'Mainnet',
          remote: 'http://127.0.0.1:8114',
          genesisHash: '0x10639e0895502b5688a6be8cf69460d76541bfa4821629d86d62ba0aae3f9606',
        },
      ],
    },
    expected: true,
  },
}

export default fixtures
