import { AddressPrefix } from './keys/address'
import { bech32Address, AddressType } from '@nervosnetwork/ckb-sdk-utils'
import Script, { ScriptHashType } from './chain/script'
import SystemScriptInfo from './system-script-info'

export default class AddressGenerator {
  public static toShort(lock: Script, prefix: AddressPrefix = AddressPrefix.Mainnet): string {
    if (!(lock.codeHash === SystemScriptInfo.SECP_CODE_HASH && lock.hashType === SystemScriptInfo.SECP_HASH_TYPE)) {
      throw new Error(`lock: ${lock} can't generate short address`)
    }
    return this.toShortByBlake160(lock.args, prefix)
  }

  // now only support short address
  public static toShortByBlake160(blake160: string, prefix: AddressPrefix = AddressPrefix.Mainnet): string {
    return bech32Address(blake160, {
      prefix,
      type: AddressType.HashIdx,
      codeHashOrCodeHashIndex: '0x00'
    })
  }

  public static generate(lock: Script, prefix: AddressPrefix = AddressPrefix.Mainnet): string {
    if (lock.codeHash === SystemScriptInfo.SECP_CODE_HASH && lock.hashType === SystemScriptInfo.SECP_HASH_TYPE) {
      return bech32Address(lock.args, {
        prefix,
        type: AddressType.HashIdx,
        codeHashOrCodeHashIndex: '0x00'
      })
    } else if (lock.codeHash === SystemScriptInfo.MULTI_SIGN_CODE_HASH && lock.hashType === SystemScriptInfo.MULTI_SIGN_HASH_TYPE) {
      return bech32Address(lock.args, {
        prefix,
        type: AddressType.HashIdx,
        codeHashOrCodeHashIndex: '0x01'
      })
    } else {
      const type = lock.hashType === ScriptHashType.Type ? AddressType.TypeCodeHash : AddressType.DataCodeHash
      return bech32Address(lock.args, {
        prefix,
        type,
        codeHashOrCodeHashIndex: lock.codeHash
      })
    }
  }
}
