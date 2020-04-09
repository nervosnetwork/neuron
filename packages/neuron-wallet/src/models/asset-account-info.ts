import CellDep, { DepType } from "./chain/cell-dep"
import Script, { ScriptHashType } from "./chain/script"
import OutPoint from "./chain/out-point"
import NetworksService from "services/networks"

interface ScriptCellInfo {
  cellDep: CellDep
  codeHash: string
  hashType: ScriptHashType
}

export default class AssetAccountInfo {
  // <genesisBlockHash, sudtScriptCellInfo>
  private sudtInfo: Map<string, ScriptCellInfo>
  private anyoneCanPayInfo: Map<string, ScriptCellInfo>

  private currentGenesisBlockHash: string

  constructor(genesisBlockHash: string = NetworksService.getInstance().getCurrent().genesisHash) {
    this.currentGenesisBlockHash = genesisBlockHash

    this.sudtInfo = new Map()
    this.anyoneCanPayInfo = new Map()

    // TODO: not set yet
    // const mainnetGenesisBlockHash = '0x92b197aa1fba0f63633922c61c92375c9c074a93e85963554f5499fe1450d0e5'
    // const mainnetSudtCellInfo: ScriptCellInfo = {
    //   cellDep: new CellDep(new OutPoint('', '0'), DepType.Code),
    //   codeHash: '',
    //   hashType: ScriptHashType.Type
    // }
    // const mainnetAnyoneCanPayCellInfo: ScriptCellInfo = {
    //   cellDep: new CellDep(new OutPoint('', '0'), DepType.DepGroup),
    //   codeHash: '',
    //   hashType: ScriptHashType.Type
    // }

    // this.sudtInfo.set(mainnetGenesisBlockHash, mainnetSudtCellInfo)
    // this.anyoneCanPayInfo.set(mainnetGenesisBlockHash, mainnetAnyoneCanPayCellInfo)

    const testnetGenesisBlockHash = '0x63547ecf6fc22d1325980c524b268b4a044d49cda3efbd584c0a8c8b9faaf9e1'
    const testnetSudtCellInfo: ScriptCellInfo = {
      cellDep: new CellDep(new OutPoint('0x0e7153f243ba4c980bfd7cd77a90568bb70fd393cb572b211a2f884de63d103d', '0'), DepType.Code),
      codeHash: '0x48dbf59b4c7ee1547238021b4869bceedf4eea6b43772e5d66ef8865b6ae7212',
      hashType: ScriptHashType.Data
    }
    const testnetAnyoneCanPayCellInfo: ScriptCellInfo = {
      cellDep: new CellDep(new OutPoint('0x9af66408df4703763acb10871365e4a21f2c3d3bdc06b0ae634a3ad9f18a6525', '0'), DepType.DepGroup),
      codeHash: '0x6a3982f9d018be7e7228f9e0b765f28ceff6d36e634490856d2b186acf78e79b',
      hashType: ScriptHashType.Type
    }
    this.sudtInfo.set(testnetGenesisBlockHash, testnetSudtCellInfo)
    this.anyoneCanPayInfo.set(testnetGenesisBlockHash, testnetAnyoneCanPayCellInfo)
  }

  public getSudtCellDep(): CellDep {
    return this.getCurrentSudtInfo().cellDep
  }

  public getAnyoneCanPayCellDep(): CellDep {
    return this.getCurrentAnyoneCanPayInfo().cellDep
  }

  public generateSudtScript(args: string): Script {
    const sudtInfo = this.getCurrentSudtInfo()
    return new Script(sudtInfo.codeHash, args, sudtInfo.hashType)
  }

  public generateAnyoneCanPayScript(args: string): Script {
    const info = this.getCurrentAnyoneCanPayInfo()
    return new Script(info.codeHash, args, info.hashType)
  }

  private getCurrentSudtInfo(): ScriptCellInfo {
    const info = this.sudtInfo.get(this.currentGenesisBlockHash)
    if (!info) {
      // TODO: better i18n error description
      throw new Error('Only support mainnet / testnet now!')
    }
    return info
  }

  private getCurrentAnyoneCanPayInfo(): ScriptCellInfo {
    const info = this.sudtInfo.get(this.currentGenesisBlockHash)
    if (!info) {
      throw new Error('Only support mainnet / testnet now!')
    }
    return info
  }
}
