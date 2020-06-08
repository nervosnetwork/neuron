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
      this.sudtInfo = {
        cellDep: new CellDep(new OutPoint(process.env.mainnet_sudt_dep_txhash!, process.env.mainnet_sudt_dep_index!), 
          process.env.mainnet_sudt_dep_type! as DepType),
        codeHash: process.env.mainnet_sudt_script_codehash!,
        hashType: process.env.mainnet_sudt_script_hashtype! as ScriptHashType
      }
      this.anyoneCanPayInfo = {
        cellDep: new CellDep(new OutPoint(process.env.mainnet_acp_dep_txhash!, process.env.mainnet_acp_dep_index!),
          process.env.mainnet_acp_dep_type! as DepType),
        codeHash: process.env.mainnet_acp_script_codehash!,
        hashType: process.env.mainnet_acp_script_hashtype! as ScriptHashType
      }
      this.sudtDeployHeight = BigInt(process.env.mainnet_sudt_height!)
    } else {
      this.sudtInfo = {
        cellDep: new CellDep(new OutPoint(process.env.testnet_sudt_dep_txhash!, process.env.testnet_sudt_dep_index!), 
          process.env.testnet_sudt_dep_type! as DepType),
        codeHash: process.env.testnet_sudt_script_codehash!,
        hashType: process.env.testnet_sudt_script_hashtype! as ScriptHashType
      }
      this.anyoneCanPayInfo = {
        cellDep: new CellDep(new OutPoint(process.env.testnet_acp_dep_txhash!, process.env.testnet_acp_dep_index!),
          process.env.testnet_acp_dep_type! as DepType),
        codeHash: process.env.testnet_acp_script_codehash!,
        hashType: process.env.testnet_acp_script_hashtype! as ScriptHashType
      }
      this.sudtDeployHeight = BigInt(process.env.testnet_sudt_height!)
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
