import { scriptToAddress, blake2b, PERSONAL, hexToBytes } from '@nervosnetwork/ckb-sdk-utils'
import { MultiSigLockInfo } from './enums'

function getMultisigParamsHex(v: number) {
  if (v < 0 || v > 255) {
    throw new Error("Multisig's r/m/n should between 0 and 255")
  }
  return v.toString(16).padStart(2, '0')
}

function multisigSerialize(blake160s: string[], r: number = 0, m: number = 1, n: number = 1) {
  const hexR = getMultisigParamsHex(r)
  const hexM = getMultisigParamsHex(m)
  const hexN = getMultisigParamsHex(n)
  return `0x00${hexR}${hexM}${hexN}${blake160s.reduce((pre, cur) => pre + cur.slice(2), '')}`
}

function multisigHash(blake160s: string[], r: number = 0, m: number = 1, n: number = 1): string {
  const serializeResult = multisigSerialize(blake160s, r, m, n)
  const blake2bHash = blake2b(32, null, null, PERSONAL)
  blake2bHash.update(hexToBytes(serializeResult))
  return `0x${blake2bHash.digest('hex')}`.slice(0, 42)
}

export function getMultisigAddress(blake160s: string[], r: number, m: number, n: number, isMainnet: boolean) {
  return scriptToAddress(
    {
      args: multisigHash(blake160s, r, m, n),
      codeHash: MultiSigLockInfo.CodeHash,
      hashType: MultiSigLockInfo.HashType,
    },
    isMainnet
  )
}

export default {
  getMultisigAddress,
}
