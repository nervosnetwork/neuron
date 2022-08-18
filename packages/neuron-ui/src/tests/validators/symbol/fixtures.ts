import { ErrorCode } from 'utils/enums'

const fixtures = {
  'Should throw an error when symbol is required but not provided': {
    params: {
      symbol: '',
      required: true,
      isCKB: false,
    },
    exception: ErrorCode.FieldRequired,
  },
  'Should pass when symbol is not required and not provided': {
    params: {
      symbol: '',
      required: false,
      isCKB: false,
    },
    exception: null,
  },
  'Should throw an error when symbol is Unknown which is reserved': {
    params: {
      symbol: 'Unknown',
      required: true,
      isCKB: false,
    },
    exception: ErrorCode.ValueReserved,
  },
  'Should throw an error when symbol is CKB which is reserved but isCKB is false': {
    params: {
      symbol: 'CKB',
      required: true,
      isCKB: false,
    },
    exception: ErrorCode.ValueReserved,
  },
  'Should pass when symbol is CKB and isCKB is true': {
    params: {
      symbol: 'CKB',
      required: true,
      isCKB: true,
    },
    exception: null,
  },
  'Should throw an error when symbol is longer than 101 chars': {
    params: {
      symbol: 'n'.repeat(101),
      required: true,
      isCKB: false,
    },
    exception: ErrorCode.FieldTooLong,
  },
  'Should throw an error when symbol has non-ascii char': {
    params: {
      symbol: '嘻',
      required: true,
      isCKB: false,
    },
    exception: ErrorCode.FieldInvalid,
  },
  'Should pass when symbol is less than or equal to 100 chars without non-ascii chars': {
    params: {
      symbol: 'n'.repeat(100),
      required: true,
      isCKB: false,
    },
    exception: null,
  },
}
export default fixtures
