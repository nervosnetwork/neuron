const fixtures = {
  'Should pass when address and amount are both valid': {
    params: {
      outputs: [
        {
          address: 'ckt1qyqg5w7emdntvnnk7utzqkz3kx276um0j4qs525t0y',
          amount: '100',
        },
      ],
      ignoreLastAmount: false,
      ignoreLastAddress: false,
    },
    exception: false,
  },
  'Should pass when last address is empty and ignore last address': {
    params: {
      outputs: [
        {
          address: '',
          amount: '100',
        },
      ],
      ignoreLastAmount: false,
      ignoreLastAddress: true,
    },
    exception: false,
  },
  'Should throw an error when not the last address is not provided': {
    params: {
      outputs: [
        {
          address: '',
          amount: '100',
        },
      ],
      ignoreLastAmount: false,
      ignoreLastAddress: false,
    },
    exception: true,
  },
  'Should throw an error when address is invalid': {
    params: {
      outputs: [
        {
          address: 'abcdefg',
          amount: '100',
        },
      ],
      ignoreLastAmount: false,
      ignoreLastAddress: false,
    },
    exception: true,
  },
  'Should throw an error when amount is invalid': {
    params: {
      outputs: [
        {
          address: 'ckt1qyqg5w7emdntvnnk7utzqkz3kx276um0j4qs525t0y',
          amount: 'invalid number',
        },
      ],
      ignoreLastAmount: false,
      ignoreLastAddress: false,
    },
    exception: true,
  },
  'Should throw an error when amount is negative': {
    params: {
      outputs: [
        {
          address: 'ckt1qyqg5w7emdntvnnk7utzqkz3kx276um0j4qs525t0y',
          amount: '-1',
        },
      ],
      ignoreLastAmount: false,
      ignoreLastAddress: false,
    },
    exception: true,
  },
  'Should throw an error when amount is less than 61': {
    params: {
      outputs: [
        {
          address: 'ckt1qyqg5w7emdntvnnk7utzqkz3kx276um0j4qs525t0y',
          amount: '60',
        },
      ],
      ignoreLastAmount: false,
      ignoreLastAddress: false,
    },
    exception: true,
  },
  'Should pass when the last amount is ignored': {
    params: {
      outputs: [
        {
          address: 'ckt1qyqg5w7emdntvnnk7utzqkz3kx276um0j4qs525t0y',
          amount: '60',
        },
      ],
      ignoreLastAmount: true,
      ignoreLastAddress: false,
    },
    exception: false,
  },
}

export default fixtures
