import { scriptToHash } from "@nervosnetwork/ckb-sdk-utils"
import HexUtils from 'utils/hex'
import TypeChecker from "utils/type-checker"

export enum ScriptHashType {
  Data = 'data',
  Type = 'type',
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

  public static fromObject({ codeHash, args, hashType }: {
    codeHash: string,
    args: string,
    hashType: ScriptHashType
  }): Script {
    return new Script(codeHash, args, hashType)
  }

  public computeHash(): string {
    const hash: string = scriptToHash(this.toSDK())
    return HexUtils.addPrefix(hash)
  }

  public calculateBytesize(): number {
    return 1 + HexUtils.byteLength(this.codeHash) + HexUtils.byteLength(this.args)
  }

  public toSDK(): CKBComponents.Script {
    return {
      args: this.args,
      codeHash: this.codeHash,
      hashType: this.hashType
    }
  }

  public static fromSDK(sdkScript: CKBComponents.Script): Script {
    return new Script(
      sdkScript.codeHash,
      sdkScript.args,
      sdkScript.hashType as ScriptHashType,
    )
  }
}
