import { ErrorCode } from 'utils/enums'

const fixtures = {
  'Should throw an error when token name is required but not provided': {
    params: {
      tokenName: '',
      required: true,
      isCKB: false,
    },
    exception: ErrorCode.FieldRequired,
  },
  'Should pass when token name is not required and not provided': {
    params: {
      tokenName: '',
      required: false,
      isCKB: false,
    },
    exception: null,
  },
  'Should throw an error when isCKB is false and the token name is Unknown which is reserved': {
    params: {
      tokenName: 'Unknown',
      required: false,
      isCKB: false,
    },
    exception: ErrorCode.ValueReserved,
  },
  'Should throw an error when isCKB is false and the token name is CKBytes which is reserved': {
    params: {
      tokenName: 'CKBytes',
      required: false,
      isCKB: false,
    },
    exception: ErrorCode.ValueReserved,
  },
  'Should pass when isCKB is true and the token name is CKBytes': {
    params: {
      tokenName: 'CKBytes',
      required: false,
      isCKB: true,
    },
    exception: null,
  },
  'Should throw an error when isCKB is true and the token name is Unknown which is reserved': {
    params: {
      tokenName: 'Unknown',
      required: false,
      isCKB: true,
    },
    exception: ErrorCode.ValueReserved,
  },
  'Should throw an error when token name is longer than 201 chars': {
    params: {
      tokenName: 't'.repeat(201),
      required: false,
      isCKB: true,
    },
    exception: ErrorCode.FieldTooLong,
  },
  'Should pass when token name is less than or equal to 200 chars': {
    params: {
      tokenName: 't'.repeat(200),
      required: false,
      isCKB: true,
    },
    exception: null,
  },
}

export default fixtures
