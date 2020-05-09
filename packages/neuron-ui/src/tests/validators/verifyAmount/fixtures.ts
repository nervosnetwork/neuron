import { ErrorCode } from 'utils/enums'

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
  'Amount which is not a number should fail': {
    amount: 'not a number',
    expected: {
      code: ErrorCode.FieldInvalid,
    },
  },
  'Negative amount should fail': {
    amount: '-1',
    expected: {
      code: ErrorCode.NotNegative,
    },
  },
  'Amount has  more than 8 decimal places should fail': {
    amount: '0.000000001',
    expected: {
      code: ErrorCode.DecimalExceed,
    },
  },
}

export default fixtures
