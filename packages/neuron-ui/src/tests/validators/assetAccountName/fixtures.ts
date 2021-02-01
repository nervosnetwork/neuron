import { ErrorCode } from 'utils/enums'

const fixtures = {
  'Should throw an error when account name is required but not provided': {
    params: {
      name: '',
      required: true,
      exists: [],
    },
    exception: ErrorCode.FieldRequired,
  },
  'Should pass when account name is not required and not provided': {
    params: {
      name: '',
      required: false,
      exists: [],
    },
    exception: null,
  },
  'Should throw an error when account name is reserved': {
    params: {
      name: 'Undefined',
      required: true,
      exists: [],
    },
    exception: ErrorCode.ValueReserved,
  },
  'Should throw an error when account name is used': {
    params: {
      name: 'Name',
      required: true,
      exists: ['Name'],
    },
    exception: ErrorCode.FieldUsed,
  },
  'Should throw an error when account name is longer than 16 chars': {
    params: {
      name: 'n'.repeat(17),
      required: true,
      exists: [],
    },
    exception: ErrorCode.FieldTooLong,
  },
  'Should pass when account name is not used, not reserved and is less than or equal to 16 chars': {
    params: {
      name: 'n'.repeat(16),
      required: true,
      exists: [],
    },
    exception: null,
  },
}

export default fixtures
