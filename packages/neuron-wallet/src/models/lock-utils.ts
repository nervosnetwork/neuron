import {
  AddressPrefix,
  bech32Address,
  AddressType,
  parseAddress
} from '@nervosnetwork/ckb-sdk-utils'
import OutPoint from './chain/out-point'
import Script, { ScriptHashType } from './chain/script'
import SystemScriptInfo from './system-script-info'

export interface SystemScript {
  codeHash: string
  outPoint: OutPoint
  hashType: ScriptHashType
}

export default class LockUtils {
  addressToLockScript(address: string): Script {
    return SystemScriptInfo.generateSecpScript(LockUtils.addressToBlake160(address))
  }

  addressToLockHash(address: string): string {
    return this.addressToLockScript(address).computeHash()
  }

  addressesToAllLockHashes(addresses: string[]): string[] {
    return addresses.map(addr => {
      return this.addressToLockHash(addr)
    })
  }

  static lockScriptToAddress(lock: Script, prefix: AddressPrefix = AddressPrefix.Mainnet): string {
    const blake160: string = lock.args!
    return LockUtils.blake160ToAddress(blake160, prefix)
  }

  static blake160ToAddress(blake160: string, prefix: AddressPrefix = AddressPrefix.Mainnet): string {
    return bech32Address(blake160, {
      prefix,
      type: AddressType.HashIdx,
      codeHashOrCodeHashIndex: '0x00',
    })
  }

  static addressToBlake160(address: string): string {
    const result: string = parseAddress(address, 'hex') as string
    const hrp: string = `0100`
    let blake160: string = result.slice(hrp.length + 2, result.length)
    if (!blake160.startsWith('0x')) {
      blake160 = `0x${blake160}`
    }
    return blake160
  }
}
