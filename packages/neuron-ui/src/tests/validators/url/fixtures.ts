import { ErrorCode } from 'utils/enums'

const fixtures = {
  'URL starts with http://': {
    params: {
      url: 'http://localhost',
    },
    exception: null,
  },
  'URL starts with https://': {
    params: {
      url: 'https://localhost',
    },
    exception: null,
  },
  'URL starts with http should fail': {
    params: {
      url: 'http hello',
    },
    exception: ErrorCode.ProtocolRequired,
  },
  'URL starts with https should fail': {
    params: {
      url: 'https hello',
    },
    exception: ErrorCode.ProtocolRequired,
  },
  'URL start with ws:// should fail': {
    params: {
      url: 'ws://localhost',
    },
    exception: ErrorCode.ProtocolRequired,
  },
  'URL contains whitespaces should fail': {
    params: {
      url: 'http:// localhost',
    },
    exception: ErrorCode.NoWhiteSpaces,
  },
  'Empty URL should fail': {
    params: {
      url: '',
    },
    exception: ErrorCode.FieldRequired,
  },
}

export default fixtures
