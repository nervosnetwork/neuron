import { ErrorCode } from 'utils/enums'

export default {
  'Should throw an error when address is not a string': {
    params: {
      address: 'ckb1qrgqep8saj8agswr30pls73hra28ry8jlnlc3ejzh3dl2ju7xxpjxqgqqy28n5m69va267nv0wvsudngtxz8t9jwss3xkhpk',
      amount: '62',
      unit: 'ckb',
    },
    exception: ErrorCode.CapacityTooSmall,
  },
  'Should throw an error when address is required but not provided': {
    params: {
      address: 'ckb1qzda0cr08m85hc8jlnfp3zer7xulejywt49kt2rr0vthywaa50xwsq2n0egquval9ljqm2ga6t9509kwcex5ejq3hy6dk',
      amount: '62',
      unit: 'ckb',
    },
    exception: null,
  },
}
