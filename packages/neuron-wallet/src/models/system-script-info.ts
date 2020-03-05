import OutPoint from "./chain/out-point"
import CellDep, { DepType } from "./chain/cell-dep"
import NetworksService from "services/networks"
import RpcService from "services/rpc-service"
import Script, { ScriptHashType } from "./chain/script"

export default class SystemScriptInfo {
  static SECP_CODE_HASH = "0x9bd7e06f3ecf4be0f2fcd2188b23f1b9fcc88e5d4b65a8637b17723bbda3cce8"
  static DAO_CODE_HASH = "0x82d76d1b75fe2fd9a27dfbaa65a039221a380d76c926f378d3f81cf3e7e13f2e"
  static MULTI_SIGN_CODE_HASH = "0x5c5069eb0857efc65e1bca0c07df34c31663b3622fd3876c876320fc9634e2a8"

  static SECP_HASH_TYPE = ScriptHashType.Type
  static DAO_HASH_TYPE = ScriptHashType.Type
  static MULTI_SIGN_HASH_TYPE = ScriptHashType.Type

  private static instance: SystemScriptInfo
  static getInstance(): SystemScriptInfo {
    if (!SystemScriptInfo.instance) {
      SystemScriptInfo.instance = new SystemScriptInfo()
    }

    return SystemScriptInfo.instance
  }

  // key = genesisBlockHash, value = OutPoint
  private secpOutPointInfo = new Map<string, OutPoint>()

  private daoOutPointInfo = new Map<string, OutPoint>()

  private multiSignOutPointInfo = new Map<string, OutPoint>()

  // need network url and genesisBlockHash
  public async getSecpCellDep(network: {remote: string, genesisHash: string} = NetworksService.getInstance().getCurrent()): Promise<CellDep> {
    const genesisBlockHash = network.genesisHash
    let outPoint = this.secpOutPointInfo.get(genesisBlockHash)
    if (!outPoint) {
      await this.loadInfos(network.remote)
      outPoint = this.secpOutPointInfo.get(genesisBlockHash)!
    }
    return new CellDep(outPoint, DepType.DepGroup)
  }

  public async getDaoCellDep(network: {remote: string, genesisHash: string} = NetworksService.getInstance().getCurrent()): Promise<CellDep> {
    const genesisBlockHash = network.genesisHash
    let outPoint = this.daoOutPointInfo.get(genesisBlockHash)
    if (!outPoint) {
      await this.loadInfos(network.remote)
      outPoint = this.daoOutPointInfo.get(genesisBlockHash)!
    }
    return new CellDep(outPoint, DepType.Code)
  }

  public async getMultiSignCellDep(network: {remote: string, genesisHash: string} = NetworksService.getInstance().getCurrent()): Promise<CellDep> {
    const genesisBlockHash = network.genesisHash
    let outPoint = this.multiSignOutPointInfo.get(genesisBlockHash)
    if (!outPoint) {
      await this.loadInfos(network.remote)
      outPoint = this.multiSignOutPointInfo.get(genesisBlockHash)!
    }
    return new CellDep(outPoint, DepType.DepGroup)
  }

  public static generateSecpScript(args: string): Script {
    return new Script(SystemScriptInfo.SECP_CODE_HASH, args, SystemScriptInfo.SECP_HASH_TYPE)
  }

  public static generateDaoScript(args: string = '0x'): Script {
    return new Script(SystemScriptInfo.DAO_CODE_HASH, args, SystemScriptInfo.DAO_HASH_TYPE)
  }

  public static generateMultiSignScript(args: string): Script {
    return new Script(SystemScriptInfo.MULTI_SIGN_CODE_HASH, args, SystemScriptInfo.MULTI_SIGN_HASH_TYPE)
  }

  private async loadInfos(url: string): Promise<void> {
    const rpcService = new RpcService(url)
    const genesisBlock = (await rpcService.getBlockByNumber('0'))!
    const genesisBlockHash = genesisBlock.header.hash

    // set secp info
    const secpOutPointTxHash = genesisBlock.transactions[1].hash!
    this.secpOutPointInfo.set(genesisBlock.header.hash, new OutPoint(secpOutPointTxHash, '0'))

    // set dao info
    const daoOutPointTxHash = genesisBlock.transactions[0].hash!
    this.daoOutPointInfo.set(genesisBlockHash, new OutPoint(daoOutPointTxHash, '2'))

    // set multi sign info
    const multiSignOutPointTxHash = genesisBlock.transactions[1].hash!
    this.multiSignOutPointInfo.set(genesisBlockHash, new OutPoint(multiSignOutPointTxHash, '1'))
  }
}
