import { ErrorCode } from 'utils/enums'

const fixtures = {
  'Should throw an error when amount is 0': {
    params: {
      amount: '0',
      extraSize: 0,
    },
    exception: ErrorCode.AmountTooSmall,
  },
  'Should throw an error when amount is less than61': {
    params: {
      amount: '60.99999999',
      extraSize: 0,
    },
    exception: ErrorCode.AmountTooSmall,
  },
  'Should pass when amount is 61': {
    params: {
      amount: '61',
      extraSize: 0,
    },
    exception: null,
  },
  'Should pass when amount is greater than 61': {
    params: {
      amount: '61.00000001',
      extraSize: 0,
    },
    exception: null,
  },
  'Should throw an error when amount is 61 amount and extraSize is 1': {
    params: {
      amount: '61',
      extraSize: 1,
    },
    exception: ErrorCode.AmountTooSmall,
  },
  'Should pass when amount is 62 and extraSize is 1': {
    params: {
      amount: '62',
      extraSize: 1,
    },
    exception: null,
  },
}

export default fixtures
