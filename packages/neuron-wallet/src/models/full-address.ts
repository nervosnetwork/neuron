import { parseAddress } from "@nervosnetwork/ckb-sdk-utils"
import Script, { ScriptHashType } from "./chain/script"

export default class FullAddress {
  public static parse(address: string): Script {
    const result = parseAddress(address, 'hex')
    const formatType = '0x' + result.slice(2, 4)
    const codeHash = '0x' + result.slice(4, 68)
    const args = '0x' + result.slice(68)
    let hashType = ScriptHashType.Data
    if (formatType === '0x04') {
      hashType = ScriptHashType.Type
    } else if (formatType !== '0x02') {
      throw new Error('Error Full Address format')
    }
    return new Script(codeHash, args, hashType)
  }

  public static isFullFormat(address: string): boolean {
    const result = parseAddress(address, 'hex')
    const formatType = '0x' + result.slice(2, 4)
    if (formatType === '0x02' || formatType === '0x04') {
      return true
    }
    return false
  }
}
