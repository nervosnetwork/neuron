import { ErrorCode } from 'utils/enums'

const fixtures = {
  'Should pass when amount is 100000000000000000000000000000000000000000000000.00000001': {
    params: {
      amount: '100000000000000000000000000000000000000000000000.00000001',
    },
    exception: null,
  },
  'Should throw an error when amount is not a number': {
    params: {
      amount: 'not a number',
    },
    exception: ErrorCode.FieldInvalid,
  },
  'Should throw an error when amount is negative': {
    params: {
      amount: '-1',
    },
    exception: ErrorCode.NotNegative,
  },
  'Should throw an error when amount has more than 8 decimal places': {
    params: {
      amount: '0.000000001',
    },
    exception: ErrorCode.DecimalExceed,
  },
}

export default fixtures
