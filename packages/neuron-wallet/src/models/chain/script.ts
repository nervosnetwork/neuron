import { scriptToHash } from "@nervosnetwork/ckb-sdk-utils"
import HexUtils from 'utils/hex'

export enum ScriptHashType {
  Data = 'data',
  Type = 'type',
}

export interface ScriptInterface {
  args: string
  codeHash: string
  hashType: ScriptHashType
}

export class Script implements ScriptInterface {
  private _args: string
  private _codeHash: string
  private _hashType: ScriptHashType

  constructor({ args, codeHash, hashType }: ScriptInterface) {
    this._args = args
    this._codeHash = codeHash
    this._hashType = hashType
  }

  public get args(): string {
    return this._args
  }

  public get codeHash(): string {
    return this._codeHash
  }

  public get hashType(): ScriptHashType {
    return this._hashType
  }

  public computeHash(): string {
    const hash: string = scriptToHash(this.toSDK())
    return HexUtils.addPrefix(hash)
  }

  public toSDK(): CKBComponents.Script {
    return {
      args: this.args,
      codeHash: this.codeHash,
      hashType: this.hashType
    }
  }

  public static fromSDK(sdkScript: CKBComponents.Script): Script {
    return new Script({
      args: sdkScript.args,
      codeHash: sdkScript.codeHash,
      hashType: sdkScript.hashType as ScriptHashType,
    })
  }
}
