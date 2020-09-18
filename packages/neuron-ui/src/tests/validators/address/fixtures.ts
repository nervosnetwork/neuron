import { ErrorCode } from 'utils/enums'

export default {
  'Should throw an error when address is not a string': {
    params: {
      address: 1 as any,
      isMainnet: true,
    },
    exception: ErrorCode.FieldInvalid,
  },
  'Should throw an error when address is empty': {
    params: {
      address: '',
      isMainnet: true,
    },
    exception: ErrorCode.AddressIsEmpty,
  },
  'Should throw an error when mainnet address required but a testnet one is provided': {
    params: {
      address: 'ckt1q9gry5zg8stq8ruq5wfz3lm5wn2k7qw3ulsfmdhe98f2jd',
      isMainnet: true,
    },
    exception: ErrorCode.MainnetAddressRequired,
  },
  'Should throw an error when testnet address required but a mainnet one is provided': {
    params: {
      address: 'ckb1qyqt8xaupvm8837nv3gtc9x0ekkj64vud3jqfwyw5v',
      isMainnet: false,
    },
    exception: ErrorCode.TestnetAddressRequired,
  },
  "Should pass when it's a blake160 short address": {
    params: {
      address: 'ckb1qyqt8xaupvm8837nv3gtc9x0ekkj64vud3jqfwyw5v',
      isMainnet: true,
    },
    exception: null,
  },
  "Should pass when it's a multisig short address": {
    params: {
      address: 'ckb1qyq5lv479ewscx3ms620sv34pgeuz6zagaaqklhtgg',
      isMainnet: true,
    },
    exception: null,
  },
  "Should pass when it's a full address": {
    params: {
      address: 'ckb1qjda0cr08m85hc8jlnfp3zer7xulejywt49kt2rr0vthywaa50xw3vumhs9nvu786dj9p0q5elx66t24n3kxgj53qks',
      isMainnet: true,
    },
    exception: null,
  },
  "Should throw an error when it's an invalid short address": {
    params: {
      address: 'ckb1qy1t8xaupvm8837nv3gtc9x0ekkj64vud3jqfwyw5v',
      isMainnet: true,
    },
    exception: ErrorCode.FieldInvalid,
  },
  "Should throw an error when it's an unknown type address": {
    params: {
      address: 'ckb11jda0cr08m85hc8jlnfp3zer7xulejywt49kt2rr0vthywaa50xw3vumhs9nvu786dj9p0q5elx66t24n3kxgj53qks',
      isMainnet: true,
    },
    exception: ErrorCode.FieldInvalid,
  },
}
