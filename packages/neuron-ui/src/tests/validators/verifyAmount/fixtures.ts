import { ErrorCode } from 'utils/const'

const fixtures: {
  [title: string]: {
    amount: string
    expected:
      | boolean
      | {
          code: ErrorCode
        }
  }
} = {
  'Valid Amount of 100000000000000000000000000000000000000000000000.00000001': {
    amount: '100000000000000000000000000000000000000000000000.00000001',
    expected: true,
  },
  'Amount should be number': {
    amount: 'not a number',
    expected: {
      code: ErrorCode.FieldInvalid,
    },
  },
  'Amount should not be negative': {
    amount: '-1',
    expected: {
      code: ErrorCode.NotNegative,
    },
  },
  'Amount should have no more than 8 decimal places': {
    amount: '0.000000001',
    expected: {
      code: ErrorCode.DecimalExceed,
    },
  },
}

export default fixtures
