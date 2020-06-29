import { ErrorCode } from 'utils/enums'

export default {
  'Should throw an error when address is not a string': {
    params: {
      address: 1 as any,
      isMainnet: true,
      required: false,
    },
    exception: ErrorCode.FieldInvalid,
  },
  'Should throw an error when address is required but not provided': {
    params: {
      address: '',
      isMainnet: true,
      required: true,
    },
    exception: ErrorCode.FieldRequired,
  },
  'Should pass when address is not required and not provided': {
    params: {
      address: '',
      isMainnet: true,
      required: false,
    },
    exception: null,
  },
  'Should throw an error when mainnet address required but a testnet one is provided': {
    params: {
      address: 'ckt1q9gry5zg8stq8ruq5wfz3lm5wn2k7qw3ulsfmdhe98f2jd',
      isMainnet: true,
      required: false,
    },
    exception: ErrorCode.MainnetAddressRequired,
  },
  'Should throw an error when testnet address required but a mainnet one is provided': {
    params: {
      address: 'ckb1qyqt8xaupvm8837nv3gtc9x0ekkj64vud3jqfwyw5v',
      isMainnet: false,
      required: false,
    },
    exception: ErrorCode.TestnetAddressRequired,
  },
  "Should throw an error when it's not a full address": {
    params: {
      address: 'ckt1q9gry5zg8stq8ruq5wfz3lm5wn2k7qw3ulsfmdhe98f2j1',
      isMainnet: false,
      required: false,
    },
    exception: ErrorCode.FieldInvalid,
  },
  "Should throw an error when it's node a 0x04 address": {
    params: {
      address: 'ckt1q2r2r35c0f9vhcdgslx2fjwa9tylevr5qka7mfgmscd33wlhfykyk7tvzu37rv87kyv59ltdece09usz9t9yy3d90uh',
      isMainnet: false,
      required: false,
    },
    exception: ErrorCode.FieldInvalid,
  },
  'Should throw an error when minimum is malformed': {
    params: {
      address: 'ckt1qjr2r35c0f9vhcdgslx2fjwa9tylevr5qka7mfgmscd33wlhfykyk7tvzu37rv87kyv59ltdece09usz9t9yyyg3zy4fq3q6',
      isMainnet: false,
      required: false,
    },
    exception: ErrorCode.FieldInvalid,
  },
  'Should throw an error when the address is required but missing': {
    params: {
      address: 'ckt1qjr2r35c0f9vhcdgslx2fjwa9tylevr5qka7mfgmscd33wlhfykyk7tvzu37rv87kyv59ltdece09usz9t9yywhe92q',
      isMainnet: false,
      required: false,
    },
    exception: null,
  },
  'Should pass when the address is an acp address without code hash validation': {
    params: {
      address: 'ckt1qjr2r35c0f9vhcdgslx2fjwa9tylevr5qka7mfgmscd33wlhfykyk7tvzu37rv87kyv59ltdece09usz9t9yywhe92q',
      isMainnet: false,
      required: false,
    },
    exception: null,
  },
  'Should throw an error when the address is an acp address but code hash is not matched': {
    params: {
      address: 'ckt1qjr2r35c0f9vhcdgslx2fjwa9tylevr5qka7mfgmscd33wlhfykyk7tvzu37rv87kyv59ltdece09usz9t9yywhe92q',
      codeHash: '0x123',
      isMainnet: false,
      required: false,
    },
    exception: ErrorCode.FieldInvalid,
  },
  'Should pass when the address is an acp address and the code hash is matched': {
    params: {
      address: 'ckt1qjr2r35c0f9vhcdgslx2fjwa9tylevr5qka7mfgmscd33wlhfykyk7tvzu37rv87kyv59ltdece09usz9t9yywhe92q',
      codeHash: '0x86a1c6987a4acbe1a887cca4c9dd2ac9fcb07405bbeda51b861b18bbf7492c4b',
      isMainnet: false,
      required: false,
    },
    exception: null,
  },
}
