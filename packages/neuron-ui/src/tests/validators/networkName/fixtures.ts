import { ErrorCode } from 'utils/enums'

const fixtures = {
  'Should pass when name is valid and not used': {
    params: {
      name: 'Testnet',
      usedNames: [],
    },
    exception: null,
  },
  'Should throw an error when name is empty': {
    params: {
      name: '',
      usedNames: [],
    },
    exception: ErrorCode.FieldRequired,
  },
  'Should pass when name has 28 chars': {
    params: {
      name: 'n'.repeat(28),
      usedNames: [],
    },
    exception: null,
  },
  'Should throw an error when name has more than 28 chars': {
    params: {
      name: 'n'.repeat(29),
      usedNames: [],
    },
    exception: ErrorCode.FieldTooLong,
  },
  'Should throw an error when name is used': {
    params: {
      name: 'Testnet',
      usedNames: ['Testnet', 'Local'],
    },
    exception: ErrorCode.FieldUsed,
  },
}

export default fixtures
