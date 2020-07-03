import { ErrorCode } from 'utils/enums'

const azSet = 'abcdefghijklmnopqrstuvwxyz'
const AZSet = azSet.toUpperCase()
const numberSet = '0123456789'
const signSet = '!@#$%^&*()_+'

const fixtures = {
  'Should throw an error when password is empty': {
    params: {
      password: '',
    },
    exception: ErrorCode.FieldRequired,
  },
  'Should throw an error when password has less than 8 chars': {
    params: {
      password: 'p'.repeat(7),
    },
    exception: ErrorCode.FieldTooShort,
  },
  'Should throw an error when password has more than 50': {
    params: {
      password: 'p'.repeat(51),
    },
    exception: ErrorCode.FieldTooLong,
  },
  'Should throw an error when password consists of 0-9 and a-z': {
    params: {
      password: `${numberSet}${azSet}`,
    },
    exception: ErrorCode.FieldTooSimple,
  },
  'Should throw an error when password consists of 0-9 and A-Z': {
    params: {
      password: `${numberSet}${AZSet}`,
    },
    exception: ErrorCode.FieldTooSimple,
  },
  'Should throw an error when password consists of 0-9 and signs': {
    params: {
      password: `${numberSet}${signSet}`,
    },
    exception: ErrorCode.FieldTooSimple,
  },
  'Should throw an error when password consists of a-z and A-Z': {
    params: {
      password: `${azSet}${AZSet}`.substr(0, 50),
    },
    exception: ErrorCode.FieldTooSimple,
  },
  'Should throw an error when password consists of a-z and signs': {
    params: {
      password: 'abcdefghijklmnopqrstuvwxyz!',
    },
    exception: ErrorCode.FieldTooSimple,
  },
  'Should throw an error when password consists of A-Z and signs': {
    params: {
      password: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ!',
    },
    exception: ErrorCode.FieldTooSimple,
  },
  'Should pass when password consists of 0-9, a-z and A-Z': {
    params: {
      password: `${numberSet}${azSet.substr(0, 10)}${AZSet.substr(0, 10)}`,
    },
    exception: null,
  },
  'Should pass when password consists of 0-9, a-z and signs': {
    params: {
      password: `${numberSet}${azSet.substr(0, 10)}${signSet.substr(0, 10)}`,
    },
    exception: null,
  },
  'Should pass when password consists of 0-9, A-Z and signs': {
    params: {
      password: `${numberSet}${AZSet.substr(0, 10)}${signSet.substr(0, 10)}`,
    },
    exception: null,
  },
  'Should pass when password consists of a-z, A-Z and signs': {
    params: {
      password: `${azSet.substr(0, 10)}${AZSet.substr(0, 10)}${signSet.substr(0, 10)}`,
    },
    exception: null,
  },
  'Should pass when password consists of 0-9, a-z, A-Z and signs': {
    params: {
      password: `${numberSet}${azSet.substr(0, 10)}${AZSet.substr(0, 10)}${signSet.substr(0, 10)}`,
    },
    exception: null,
  },
}

export default fixtures
