import { ErrorCode } from 'utils/enums'

const fixtures: {
  [title: string]: {
    name: string
    usedNames: string[]
    expected: boolean | { code: ErrorCode }
  }
} = {
  'Valid name': {
    name: 'Testnet',
    usedNames: ['Local'],
    expected: true,
  },
  'Empty name should fail': {
    name: '',
    usedNames: ['Local'],
    expected: {
      code: ErrorCode.FieldRequired,
    },
  },
  'Name consists of 28 charcters': {
    name: '1234567890123456789012345678',
    usedNames: ['Local'],
    expected: true,
  },
  'Name consists of more than 28 characters should fail': {
    name: '12345678901234567890123456789',
    usedNames: ['Local'],
    expected: {
      code: ErrorCode.FieldTooLong,
    },
  },
  'Name which is used should fail': {
    name: 'Testnet',
    usedNames: ['Testnet', 'Local'],
    expected: {
      code: ErrorCode.FieldUsed,
    },
  },
}

export default fixtures
