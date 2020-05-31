import CellDep, { DepType } from "./chain/cell-dep"
import Script, { ScriptHashType } from "./chain/script"
import OutPoint from "./chain/out-point"
import NetworksService from "services/networks"

export interface ScriptCellInfo {
  cellDep: CellDep
  codeHash: string
  hashType: ScriptHashType
}

export default class AssetAccountInfo {
  private sudtInfo: ScriptCellInfo
  private anyoneCanPayInfo: ScriptCellInfo
  public sudtDeployHeight: bigint

  private static MAINNET_GENESIS_BLOCK_HASH: string = '0x92b197aa1fba0f63633922c61c92375c9c074a93e85963554f5499fe1450d0e5'

  public get infos(): {[name: string]: ScriptCellInfo} {
    return {
      sudt: this.sudtInfo,
      anyoneCanPay: this.anyoneCanPayInfo
    }
  }

  constructor(genesisBlockHash: string = NetworksService.getInstance().getCurrent().genesisHash) {
    // dev chain: using testnet config
    if (genesisBlockHash === AssetAccountInfo.MAINNET_GENESIS_BLOCK_HASH) {
      // TODO: Update for mainnet!!!
      this.sudtInfo = {
        cellDep: new CellDep(new OutPoint('0x0e7153f243ba4c980bfd7cd77a90568bb70fd393cb572b211a2f884de63d103d', '0'), DepType.Code),
        codeHash: '0x48dbf59b4c7ee1547238021b4869bceedf4eea6b43772e5d66ef8865b6ae7212',
        hashType: ScriptHashType.Data
      }
      this.anyoneCanPayInfo = {
        cellDep: new CellDep(new OutPoint('0x9af66408df4703763acb10871365e4a21f2c3d3bdc06b0ae634a3ad9f18a6525', '0'), DepType.DepGroup),
        codeHash: '0x6a3982f9d018be7e7228f9e0b765f28ceff6d36e634490856d2b186acf78e79b',
        hashType: ScriptHashType.Type
      }
      this.sudtDeployHeight = BigInt(14922)
    } else {
      // TODO: Update for testnet!!!
      this.sudtInfo = {
        cellDep: new CellDep(new OutPoint('0xc1b2ae129fad7465aaa9acc9785f842ba3e6e8b8051d899defa89f5508a77958', '0'), DepType.Code),
        codeHash: '0x48dbf59b4c7ee1547238021b4869bceedf4eea6b43772e5d66ef8865b6ae7212',
        hashType: ScriptHashType.Data
      }
      this.anyoneCanPayInfo = {
        cellDep: new CellDep(new OutPoint('0x4f32b3e39bd1b6350d326fdfafdfe05e5221865c3098ae323096f0bfc69e0a8c', '0'), DepType.DepGroup),
        codeHash: '0x86a1c6987a4acbe1a887cca4c9dd2ac9fcb07405bbeda51b861b18bbf7492c4b',
        hashType: ScriptHashType.Type
      }
      this.sudtDeployHeight = BigInt(20913)
    }
  }

  public get sudtCellDep(): CellDep {
    return this.sudtInfo.cellDep
  }

  public get anyoneCanPayCellDep(): CellDep {
    return this.anyoneCanPayInfo.cellDep
  }

  public get anyoneCanPayCodeHash(): string {
    return this.anyoneCanPayInfo.codeHash
  }

  public generateSudtScript(args: string): Script {
    return new Script(this.sudtInfo.codeHash, args, this.sudtInfo.hashType)
  }

  public generateAnyoneCanPayScript(args: string): Script {
    const info = this.anyoneCanPayInfo
    return new Script(info.codeHash, args, info.hashType)
  }

  public isSudtScript(script: Script): boolean {
    return script.codeHash === this.sudtInfo.codeHash && script.hashType === this.sudtInfo.hashType
  }

  public isAnyoneCanPayScript(script: Script): boolean {
    return script.codeHash === this.anyoneCanPayInfo.codeHash && script.hashType === this.anyoneCanPayInfo.hashType
  }
}
