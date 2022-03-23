import { ErrorCode } from 'utils/enums'

const fixtures = {
  'Should pass when total amount + fee is valid and not greater than balance': {
    params: {
      totalAmount: '10000000000000000000000',
      fee: '1',
      balance: '10000000000000000000001',
    },
    exception: null,
  },
  'Should throw an error when total amount is greater than balance': {
    params: {
      totalAmount: '10000000000000000000001',
      fee: '0',
      balance: '10000000000000000000000',
    },
    exception: ErrorCode.AmountNotEnough,
  },
  'Should throw an error when total amount + fee is greater than balance': {
    params: {
      totalAmount: '10000000000000000000000',
      fee: '1',
      balance: '10000000000000000000000',
    },
    exception: ErrorCode.AmountNotEnough,
  },
  'Should throw an error when balance is negative': {
    params: {
      totalAmount: '10000000000000000000000',
      fee: '10000000000',
      balance: '-10000000000010000000000',
    },
    exception: ErrorCode.AmountNotEnough,
  },
}

export default fixtures
