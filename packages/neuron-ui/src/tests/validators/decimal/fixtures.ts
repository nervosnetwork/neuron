import { ErrorCode } from 'utils/enums'

const fixtures = {
  'Should throw an error when decimal is required but not provided': {
    params: {
      decimal: '',
      required: true,
    },
    exception: ErrorCode.FieldRequired,
  },
  'Should throw an error when decimal is required and not provided': {
    params: {
      decimal: '',
      required: false,
    },
    exception: null,
  },
  'Should throw an error when decimal is not a number': {
    params: {
      decimal: 'a',
      required: true,
    },
    exception: ErrorCode.FieldInvalid,
  },
  'Should throw an error when decimal is not an integer': {
    params: {
      decimal: '1.2',
      required: true,
    },
    exception: ErrorCode.FieldInvalid,
  },
  'Should throw an error when decimal is negative': {
    params: {
      decimal: '-1',
      required: true,
    },
    exception: ErrorCode.FieldInvalid,
  },
  'Should throw an error when decimal is greater than 32': {
    params: {
      decimal: '33',
      required: true,
    },
    exception: ErrorCode.FieldInvalid,
  },
  'Should pass when decimal is an integer between 0-32(inclusive)': {
    params: {
      decimal: '32',
      required: true,
    },
    exception: null,
  },
}

export default fixtures
