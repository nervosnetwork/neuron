import { computeScriptHash as scriptToHash } from '@ckb-lumos/lumos/utils'
import { bytes as byteUtils } from '@ckb-lumos/lumos/codec'
import TypeChecker from '../../utils/type-checker'

export enum ScriptHashType {
  Data = 'data',
  Type = 'type',
  Data1 = 'data1',
}

export default class Script {
  public codeHash: string
  public args: string
  public hashType: ScriptHashType

  constructor(codeHash: string, args: string, hashType: ScriptHashType) {
    this.args = args
    this.codeHash = codeHash
    this.hashType = hashType

    TypeChecker.hashChecker(this.codeHash)
  }

  public static fromObject({
    codeHash,
    args,
    hashType,
  }: {
    codeHash: string
    args: string
    hashType: ScriptHashType
  }): Script {
    return new Script(codeHash, args, hashType)
  }

  public computeHash(): string {
    const script = this.toSDK()
    if (!script || !script.codeHash || !script.hashType) {
      throw new Error('Invalid script')
    }
    // empty string is not allowed for args
    const formattedScript = {
      ...script,
      args: script.args || '0x',
    }
    return scriptToHash(formattedScript)
  }

  /**
   * @deprecated please move to `calculateOccupiedByteSize`
   */
  public calculateBytesize(): number {
    return this.calculateOccupiedByteSize()
  }

  public calculateOccupiedByteSize(): number {
    return 1 + byteUtils.concat(this.args, this.codeHash).byteLength
  }

  public toSDK(): CKBComponents.Script {
    return {
      args: this.args,
      codeHash: this.codeHash,
      hashType: this.hashType,
    }
  }

  public static fromSDK(sdkScript: CKBComponents.Script): Script {
    return new Script(sdkScript.codeHash, sdkScript.args, sdkScript.hashType as ScriptHashType)
  }
}
