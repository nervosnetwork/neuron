import { ErrorCode } from 'utils/const'

const fixtures: {
  [title: string]: {
    url: string
    expected: boolean | { code: ErrorCode }
  }
} = {
  'URL starts with http://': {
    url: 'http://localhost',
    expected: true,
  },
  'URL starts with https://': {
    url: 'https://localhost',
    expected: true,
  },
  'URL starts with http should fail': {
    url: 'http hello',
    expected: {
      code: ErrorCode.ProtocolRequired,
    },
  },
  'URL starts with https should fail': {
    url: 'https hello',
    expected: {
      code: ErrorCode.ProtocolRequired,
    },
  },
  'URL start with ws:// should fail': {
    url: 'ws://localhost',
    expected: {
      code: ErrorCode.ProtocolRequired,
    },
  },
  'URL contains whitespaces should fail': {
    url: 'http:// localhost',
    expected: {
      code: ErrorCode.NoWhiteSpaces,
    },
  },
  'Empty URL should fail': {
    url: '',
    expected: {
      code: ErrorCode.FieldRequired,
    },
  },
}

export default fixtures
