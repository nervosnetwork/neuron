import { ErrorCode } from 'utils/enums'

const fixtures = {
  'Should throw an error when amount is required but not provided': {
    params: {
      amount: '',
      decimal: '10',
      required: true,
    },
    exception: ErrorCode.FieldRequired,
  },
  'Should pass when amount is not required and not provided': {
    params: {
      amount: '',
      decimal: '10',
      required: false,
    },
    exception: null,
  },
  'Should throw an error when amount is zero': {
    params: {
      amount: '0',
      decimal: '10',
      required: false,
    },
    exception: ErrorCode.AmountZero,
  },
  'Should throw an error when amount is not a number': {
    params: {
      amount: 'not a number',
      decimal: '10',
      required: false,
    },
    exception: ErrorCode.FieldInvalid,
  },
  'Should throw an error when amount is negative': {
    params: {
      amount: 'not a number',
      decimal: '10',
      required: false,
    },
    exception: ErrorCode.FieldInvalid,
  },
  'Should throw an error when amount cannot be converted into value': {
    params: {
      amount: '10',
      decimal: 'invalid decimal',
      required: false,
    },
    exception: ErrorCode.FieldInvalid,
  },
}

export default fixtures
