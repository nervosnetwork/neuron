import { ResponseCode } from 'utils/enums'

const fixtures = {
  'Should return true when response has status of ResponseCode.SUCCESS': {
    params: {
      res: {
        status: ResponseCode.SUCCESS,
      },
    },
    expected: true,
  },
  "Should return false when response doesn't has status of ResponseCode.SUCCESS": {
    params: {
      res: {
        status: 2 as any,
      },
    },
    expected: false,
  },
}

export default fixtures
