import Script, { ScriptHashType } from "./chain/script"
import { parseAddress } from "@nervosnetwork/ckb-sdk-utils"
import SystemScriptInfo from "./system-script-info"

export default class AddressParser {
  public static parse(address: string): Script {
    const result = parseAddress(address, 'hex')
    const formatType = '0x' + result.slice(2, 4)

    if (formatType === '0x01') {
      // short address
      const codeHashIndex = '0x' + result.slice(4, 6)
      const args = '0x' + result.slice(6)
      if (codeHashIndex === '0x00') {
        return SystemScriptInfo.generateSecpScript(args)
      } else if (codeHashIndex === '0x01') {
        return SystemScriptInfo.generateMultiSignScript(args)
      } else {
        throw new Error('Address format error!')
      }
    } else if (formatType === '0x02' || formatType === '0x04') {
      const codeHash = '0x' + result.slice(4, 68)
      const args = '0x' + result.slice(68)
      const hashType = formatType === '0x02' ? ScriptHashType.Data : ScriptHashType.Type
      return new Script(codeHash, args, hashType)
    }
    throw new Error('Address format error!')
  }

  public static batchParse(addresses: string[]): Script[] {
    return addresses.map(addr => AddressParser.parse(addr))
  }

  public static batchToLockHash(addresses: string[]): string[] {
    return this.batchParse(addresses).map(lock => lock.computeHash())
  }

  public static toBlake160(address: string) {
    const lockScript = AddressParser.parse(address)
    if (!SystemScriptInfo.isSecpScript(lockScript)) {
      throw new Error(`address: ${address} not short address`)
    }
    return lockScript.args
  }
}
