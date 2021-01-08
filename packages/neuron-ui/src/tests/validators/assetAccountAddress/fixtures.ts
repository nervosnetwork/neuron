import { AccountType, ErrorCode } from 'utils/enums'

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
  "Should throw an error when it's of sudt type but neither a full version address nor a acp short version address": {
    params: {
      address: 'ckt1q9gry5zg8stq8ruq5wfz3lm5wn2k7qw3ulsfmdhe98f2j1',
      isMainnet: false,
      required: false,
    },
    exception: ErrorCode.FieldInvalid,
  },
  "Should throw an error when it's of sudt type and a short version address but its code hash index is not 0x02": {
    params: {
      address: 'ckt1qyqrdsefa43s6m882pcj53m4gdnj4k440axqswmu83',
      isMainnet: false,
      required: false,
    },
    exception: ErrorCode.FieldInvalid,
  },
  "Should throw an error when it's of sudt type and a full version address but its code hash index is not 0x04": {
    params: {
      address: 'ckt1q2r2r35c0f9vhcdgslx2fjwa9tylevr5qka7mfgmscd33wlhfykyk7tvzu37rv87kyv59ltdece09usz9t9yy3d90uh',
      isMainnet: false,
      required: false,
    },
    exception: ErrorCode.FieldInvalid,
  },
  'Should throw an error when minimum is malformed': {
    params: {
      address: 'ckt1qy6pngwqn6e9vlm92th84rk0l4jp2h8lurchjmnwv8kq3rt5psf4v7tvzu37rv87kyv59ltdece09usz9t9yyyg3zy428nc2',
      isMainnet: false,
      required: false,
    },
    exception: ErrorCode.FieldInvalid,
  },
  'Should throw an error when the address is required but missing': {
    params: {
      address: '',
      isMainnet: false,
      required: true,
    },
    exception: ErrorCode.FieldRequired,
  },
  'Should throw an error when the args is not 20 bytes': {
    params: {
      address: 'ckt1qs6pngwqn6e9vlm92th84rk0l4jp2h8lurchjmnwv8kq3rt5psf4v7tvzu37rv87kyv59ltdece09usz9t9q8qep7n',
      isMainnet: false,
      required: false,
    },
    exception: ErrorCode.FieldInvalid,
  },
  'Should pass when the address is an acp short version address': {
    params: {
      address: 'ckt1qypgzvf2uphwkpgykum7d0862wtmuddf9r0qnzefn9',
      isMainnet: false,
      required: false,
    },
    exception: null,
  },
  'Should pass when the address is an acp full version address without code hash validation': {
    params: {
      address: 'ckt1qs6pngwqn6e9vlm92th84rk0l4jp2h8lurchjmnwv8kq3rt5psf4v7tvzu37rv87kyv59ltdece09usz9t9yym9pmex',
      isMainnet: false,
      required: false,
    },
    exception: null,
  },
  'Should pass when the address is an acp full version address and the code hash is matched': {
    params: {
      address: 'ckt1qs6pngwqn6e9vlm92th84rk0l4jp2h8lurchjmnwv8kq3rt5psf4v7tvzu37rv87kyv59ltdece09usz9t9yym9pmex',
      codeHash: '0x3419a1c09eb2567f6552ee7a8ecffd64155cffe0f1796e6e61ec088d740c1356',
      isMainnet: false,
      required: false,
    },
    exception: null,
  },
  "Should pass when it's of ckb type and a short version address": {
    params: {
      address: 'ckt1qyqw975zuu9svtyxgjuq44lv7mspte0n2tmqa703cd',
      isMainnet: false,
      required: false,
      type: AccountType.CKB,
    },
    exception: null,
  },
  "Should pass when it's of ckb type and a full version address": {
    params: {
      address: 'ckt1q2r2r35c0f9vhcdgslx2fjwa9tylevr5qka7mfgmscd33wlhfykyk7tvzu37rv87kyv59ltdece09usz9t9yy3d90uh',
      isMainnet: false,
      required: false,
      type: AccountType.CKB,
    },
    exception: null,
  },
  'Should throw an error when address is a deprecated acp address on lina': {
    params: {
      address: 'ckt1qg8mxsu48mncexvxkzgaa7mz2g25uza4zpz062relhjmyuc52ps3z7tvzu37rv87kyv59ltdece09usz9t9yyx9r0yj',
      isMainnet: false,
      required: false,
    },
    exception: ErrorCode.AddressIsDeprecated,
  },
  'Should throw an error when address is a deprecated acp address on aggron': {
    params: {
      address: 'ckt1qjr2r35c0f9vhcdgslx2fjwa9tylevr5qka7mfgmscd33wlhfykyk7tvzu37rv87kyv59ltdece09usz9t9yywhe92q',
      isMainnet: false,
      required: false,
    },
    exception: ErrorCode.AddressIsDeprecated,
  },
}
