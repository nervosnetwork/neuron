import { describe, it, expect } from 'vitest'
import { MultisigConfig } from 'services/remote'
import { addressToScript, getMultisigSignStatus, MultiSigLockInfo } from 'utils'
import { computeScriptHash } from '@ckb-lumos/lumos/utils'

const addresses = [
  'ckt1qyqwh5hmt8j59njztrfz6z0s9wug3nv5qysqrnfm2h',
  'ckt1qyqwjt5p4axvmx9tl4lrrnqd0ld9pr9wjqsqv87474',
  'ckt1qyqql0vgjyxjxjxknkj6nq8jxa485xsyl66sy7c5f6',
]
const multisigConfig: MultisigConfig = {
  id: 1,
  walletId: 'walletId',
  r: 1,
  m: 2,
  n: 3,
  addresses,
  blake160s: addresses.map(v => addressToScript(v).args),
  lockCodeHash: MultiSigLockInfo.CodeHash,
  fullPayload: 'ckt1qqmvjudc6s0mm992hjnhm367sfnjntycg3a5d7g7qpukz4wamvxjjq593v2gev3yp5sxmfr002ydqrcdpepwfkqwqz8gp',
}
const fullPayloadHash = computeScriptHash(addressToScript(multisigConfig.fullPayload))

describe('Test getCompensationPeriod', () => {
  // first sign but no match address
  it('no address in fullPayload', () => {
    const res = getMultisigSignStatus({ multisigConfig, signatures: {}, addresses: [] })
    expect(res).toEqual({
      lackOfRCount: 1,
      lackOfMCount: 2,
      canBroadcastAfterSign: false,
      canSign: false,
    })
  })
  // first sign
  it('have signed address in fullPayload but not last', () => {
    const res = getMultisigSignStatus({
      multisigConfig,
      signatures: {},
      addresses: [
        {
          address: multisigConfig.addresses[1],
        },
      ] as any,
    })
    expect(res).toEqual({
      lackOfRCount: 1,
      lackOfMCount: 2,
      canBroadcastAfterSign: false,
      canSign: true,
    })
  })
  // second sign but no match address
  it('no signed address in fullPayload', () => {
    const res = getMultisigSignStatus({
      multisigConfig,
      signatures: {
        [fullPayloadHash]: [addressToScript(multisigConfig.addresses[1]).args],
      },
      addresses: [
        {
          address: multisigConfig.addresses[1],
        },
      ] as any,
    })
    expect(res).toEqual({
      lackOfRCount: 1,
      lackOfMCount: 1,
      canBroadcastAfterSign: false,
      canSign: false,
    })
  })
  // second sign
  it('need last unspecified signed address in fullPayload', () => {
    const res = getMultisigSignStatus({
      multisigConfig,
      signatures: {
        [fullPayloadHash]: [addressToScript(multisigConfig.addresses[0]).args],
      },
      addresses: [
        {
          address: multisigConfig.addresses[1],
        },
      ] as any,
    })
    expect(res).toEqual({
      lackOfRCount: 0,
      lackOfMCount: 1,
      canBroadcastAfterSign: true,
      canSign: true,
    })
  })
  // second sign
  it('need last specified signed address in fullPayload', () => {
    const res = getMultisigSignStatus({
      multisigConfig,
      signatures: {
        [fullPayloadHash]: [addressToScript(multisigConfig.addresses[1]).args],
      },
      addresses: [
        {
          address: multisigConfig.addresses[0],
        },
      ] as any,
    })
    expect(res).toEqual({
      lackOfRCount: 1,
      lackOfMCount: 1,
      canBroadcastAfterSign: true,
      canSign: true,
    })
  })
  // sign success
  it('has signed', () => {
    const res = getMultisigSignStatus({
      multisigConfig,
      signatures: {
        [fullPayloadHash]: [
          addressToScript(multisigConfig.addresses[0]).args,
          addressToScript(multisigConfig.addresses[1]).args,
        ],
      },
      addresses: [
        {
          address: multisigConfig.addresses[0],
        },
      ] as any,
    })
    expect(res).toEqual({
      lackOfRCount: 0,
      lackOfMCount: 0,
      canBroadcastAfterSign: false,
      canSign: false,
    })
  })
})
