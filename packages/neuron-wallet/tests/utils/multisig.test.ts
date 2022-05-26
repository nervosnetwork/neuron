import { getMultisigStatus } from '../../src/utils/multisig'
import MultisigConfigModel from '../../src/models/multisig-config'
import { SignStatus } from '../../src/models/offline-sign'

describe('getMultisigStatus test', () => {

  const addressesToArgs: Record<string, string> = {
    'ckt1qyq89x5ggpt0a5epm2k2gyxeffwkgfdxeg0s543mh4': '0x729a884056fed321daaca410d94a5d6425a6ca1f',
    'ckt1qyqql0vgjyxjxjxknkj6nq8jxa485xsyl66sy7c5f6': '0x0fbd88910d2348d69da5a980f2376a7a1a04feb5',
    'ckt1qyqt9wqszk2lurw7h86wrt826cg8zx2f0lnq6e4vpl': '0xb2b8101595fe0ddeb9f4e1acead6107119497fe6'
  }
  describe('m is 2', () => {
    const multisigConfig = MultisigConfigModel.fromObject({
      walletId: '',
      r: 1,
      m: 2,
      n: 3,
      blake160s: Object.values(addressesToArgs),
    })
    it('Unsigned', () => {
      expect(getMultisigStatus(multisigConfig, {})).toBe(SignStatus.Unsigned)
    })
    it('PartiallySigned lose m', () => {
      expect(getMultisigStatus(multisigConfig, {
        '0x76079ccbdb113a1e1392cf91aa7f409e4278d87181390dc3f8dd80ad3ef6b8f7': ['ckt1qyq89x5ggpt0a5epm2k2gyxeffwkgfdxeg0s543mh4'].map(v => addressesToArgs[v])
      })).toBe(SignStatus.PartiallySigned)
    })
    it('PartiallySigned lose r', () => {
      expect(getMultisigStatus(multisigConfig, {
        '0x76079ccbdb113a1e1392cf91aa7f409e4278d87181390dc3f8dd80ad3ef6b8f7': ['ckt1qyqql0vgjyxjxjxknkj6nq8jxa485xsyl66sy7c5f6', 'ckt1qyqt9wqszk2lurw7h86wrt826cg8zx2f0lnq6e4vpl'].map(v => addressesToArgs[v])
      })).toBe(SignStatus.PartiallySigned)
    })
    it('Signed', () => {
      expect(getMultisigStatus(multisigConfig, {
        '0x76079ccbdb113a1e1392cf91aa7f409e4278d87181390dc3f8dd80ad3ef6b8f7': ['ckt1qyq89x5ggpt0a5epm2k2gyxeffwkgfdxeg0s543mh4', 'ckt1qyqt9wqszk2lurw7h86wrt826cg8zx2f0lnq6e4vpl'].map(v => addressesToArgs[v])
      })).toBe(SignStatus.Signed)
    })
  })
})