import { addressToScript } from '@nervosnetwork/ckb-sdk-utils'
import SystemScriptInfo from './system-script-info'
import { Script, utils } from '@ckb-lumos/base'

export default class AddressParser {
  public static parse(address: string): Script {
    try {
      const script = addressToScript(address)
      return {
        codeHash: script.codeHash,
        args: script.args,
        hashType: script.hashType,
      }
    } catch {
      throw new Error('Address format error')
    }
  }

  public static batchParse(addresses: string[]): Script[] {
    return addresses.map(addr => AddressParser.parse(addr))
  }

  public static batchToLockHash(addresses: string[]): string[] {
    return this.batchParse(addresses).map(lock => utils.computeScriptHash(lock))
  }

  public static toBlake160(address: string) {
    const lockScript = AddressParser.parse(address)
    if (!SystemScriptInfo.isSecpScript(lockScript)) {
      throw new Error(`address: ${address} not short address`)
    }
    return lockScript.args
  }
}
