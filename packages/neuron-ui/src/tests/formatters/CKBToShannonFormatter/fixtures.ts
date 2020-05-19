import { CapacityUnit } from 'utils/enums'

const fixtures = [
  {
    ckb: {
      amount: `1.234`,
      unit: CapacityUnit.CKB,
    },
    expected: `123400000`,
  },
  {
    ckb: {
      amount: `1.23456789`,
      unit: CapacityUnit.CKB,
    },
    expected: `123456789`,
  },
  {
    ckb: {
      amount: `1.0`,
      unit: CapacityUnit.CKB,
    },
    expected: `100000000`,
  },
  {
    ckb: {
      amount: `1.`,
      unit: CapacityUnit.CKB,
    },
    expected: `100000000`,
  },
  {
    ckb: {
      amount: `0.123`,
      unit: CapacityUnit.CKB,
    },
    expected: `12300000`,
  },
  {
    ckb: {
      amount: `.123`,
      unit: CapacityUnit.CKB,
    },
    expected: `12300000`,
  },
  {
    ckb: {
      amount: `12345678901234567890123456789012345678901234567890123456789012345678901234`,
      unit: CapacityUnit.CKB,
    },
    expected: `1234567890123456789012345678901234567890123456789012345678901234567890123400000000`,
  },
  {
    ckb: {
      amount: `12345678901234567890123456789012345678901234567890123456789012345678901234`,
      unit: CapacityUnit.CKKB,
    },
    expected: `1234567890123456789012345678901234567890123456789012345678901234567890123400000000000`,
  },
  {
    ckb: {
      amount: `12345678901234567890123456789012345678901234567890123456789012345678901234`,
      unit: CapacityUnit.CKGB,
    },
    expected: `1234567890123456789012345678901234567890123456789012345678901234567890123400000000000000000`,
  },
]

export default fixtures
