import Script, { ScriptHashType } from "./chain/script"
import { parseAddress } from "@nervosnetwork/ckb-sdk-utils"

export default class AddressParser {
  private address: string
  private defaultLockScriptCodeHash: string = '0x'
  private defaultLockScriptHashType: ScriptHashType | undefined
  private multiSignLockScriptCodeHash: string = '0x'
  private multiSignLockScriptHashType: ScriptHashType | undefined

  constructor(address: string) {
    this.address = address
  }

  setDefaultLockScript(codeHash: string, hashType: ScriptHashType): AddressParser {
    this.defaultLockScriptCodeHash = codeHash
    this.defaultLockScriptHashType = hashType

    return this
  }

  setMultiSignLockScript(codeHash: string, hashType: ScriptHashType): AddressParser {
    this.multiSignLockScriptCodeHash = codeHash
    this.multiSignLockScriptHashType = hashType

    return this
  }

  parse(): Script {
    const result = parseAddress(this.address, 'hex')
    const formatType = '0x' + result.slice(2, 4)

    if (formatType === '0x01') {
      // short address
      const codeHashIndex = '0x' + result.slice(4, 6)
      const args = '0x' + result.slice(6)
      if (codeHashIndex === '0x00') {
        if (this.defaultLockScriptCodeHash === '0x' || !this.defaultLockScriptHashType) {
          throw new Error('Please set default lock script info firstly!')
        }
        return new Script(this.defaultLockScriptCodeHash, args, this.defaultLockScriptHashType)
      } else if (codeHashIndex === '0x01') {
        if (this.multiSignLockScriptCodeHash === '0x' || !this.multiSignLockScriptHashType) {
          throw new Error('Please set multi sign lock script info firstly!')
        }
        return new Script(this.multiSignLockScriptCodeHash, args, this.multiSignLockScriptHashType)
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
}
