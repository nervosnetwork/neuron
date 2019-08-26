import { ErrorCode } from 'utils/const'

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
  'Name cannot be empty': {
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
  'Name is too long': {
    name: '12345678901234567890123456789',
    usedNames: ['Local'],
    expected: {
      code: ErrorCode.FieldTooLong,
    },
  },
  'Name is used': {
    name: 'Testnet',
    usedNames: ['Testnet', 'Local'],
    expected: {
      code: ErrorCode.FieldUsed,
    },
  },
}

export default fixtures
