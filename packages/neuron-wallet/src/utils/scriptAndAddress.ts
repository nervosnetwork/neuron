import { type Script, hd } from '@ckb-lumos/lumos'
import { encodeToAddress, parseAddress } from '@ckb-lumos/lumos/helpers'
import { systemScripts } from './systemScripts'
import { AGGRON4, LINA } from '../utils/systemScripts'

export enum DefaultAddressNumber {
  Change = 10,
  Receiving = 20,
}

export const prefixWith0x = (hex: string) => (hex.startsWith('0x') ? hex : `0x${hex}`)

export const publicKeyToAddress = (publicKey: string, isMainnet = false) => {
  return scriptToAddress(
    {
      codeHash: systemScripts.SECP256K1_BLAKE160.CODE_HASH,
      hashType: systemScripts.SECP256K1_BLAKE160.HASH_TYPE,
      args: hd.key.publicKeyToBlake160(prefixWith0x(publicKey)),
    },
    isMainnet
  )
}

export const scriptToAddress = (script: CKBComponents.Script, isMainnet = true): string => {
  const lumosConfig = !isMainnet ? AGGRON4 : LINA
  return encodeToAddress(
    // omit keys other than codeHash, args and hashType
    {
      codeHash: script.codeHash,
      args: script.args,
      hashType: script.hashType,
    },
    { config: lumosConfig }
  )
}

export const addressToScript = (address: string): Script => {
  const prefix = address.slice(0, 3)
  if (prefix !== 'ckt' && prefix !== 'ckb') {
    throw new Error('Invalid address prefix')
  }
  const lumosConfig = prefix === 'ckt' ? AGGRON4 : LINA
  return parseAddress(address, { config: lumosConfig })
}
