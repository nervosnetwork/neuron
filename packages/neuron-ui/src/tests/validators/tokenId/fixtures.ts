import { ErrorCode } from 'utils/enums'

const fixtures = {
  'Should throw an error when token id is required but not provided': {
    params: {
      tokenId: '',
      isCKB: false,
      required: true,
    },
    exception: ErrorCode.FieldRequired,
  },
  'Should pass when token id is not required and not provided': {
    params: {
      tokenId: '',
      isCKB: false,
      required: false,
    },
    exception: null,
  },
  'Should pass when isCKB is true and token id is CKBytes': {
    params: {
      tokenId: 'CKBytes',
      isCKB: true,
      required: false,
    },
    exception: null,
  },
  'Should throw an error when isCKB is true but token id is not CKBytes': {
    params: {
      tokenId: '0x796c1723e1b0feb11942fd6dce32f2f2022aca42',
      isCKB: true,
      required: false,
    },
    exception: ErrorCode.FieldInvalid,
  },
  'Should pass when isCKB is false and token id is valid': {
    params: {
      tokenId: `0x${'6'.repeat(64)}`,
      isCKB: false,
      required: false,
    },
    exception: null,
  },
  'Should throw an error when isCKB is false and token id has incorrect length': {
    params: {
      tokenId: `0x${'6'.repeat(65)}`,
      isCKB: false,
      required: false,
    },
    exception: ErrorCode.FieldInvalid,
  },
  'Should throw an error when isCKB is false and token id is not hex string': {
    params: {
      tokenId: '6'.repeat(66),
      isCKB: false,
      required: false,
    },
    exception: ErrorCode.FieldInvalid,
  },
}

export default fixtures
