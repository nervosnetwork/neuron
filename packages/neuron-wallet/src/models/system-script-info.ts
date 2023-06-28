import OutPoint from './chain/out-point'
import CellDep, { DepType } from './chain/cell-dep'
import NetworksService from '../services/networks'
import RpcService from '../services/rpc-service'
import Script, { ScriptHashType } from './chain/script'
import { config, utils } from '@ckb-lumos/lumos'

export default class SystemScriptInfo {
  static SECP_CODE_HASH = process.env.SECP256K1_CODE_HASH!
  static DAO_CODE_HASH = process.env.DAO_CODE_HASH!
  static MULTI_SIGN_CODE_HASH = process.env.MULTISIG_CODE_HASH!

  static SECP_HASH_TYPE = ScriptHashType.Type
  static DAO_HASH_TYPE = ScriptHashType.Type
  static MULTI_SIGN_HASH_TYPE = ScriptHashType.Type

  // FIXME: this is werid that `blockchain.Script.pack` will throw error here
  // static DAO_SCRIPT_HASH = new Script(
  //   SystemScriptInfo.DAO_CODE_HASH,
  //   '0x',
  //   SystemScriptInfo.DAO_HASH_TYPE
  // ).computeHash()

  static DAO_SCRIPT_HASH = utils.computeScriptHash({
    codeHash: config.predefined.LINA.SCRIPTS.DAO.CODE_HASH,
    hashType: config.predefined.LINA.SCRIPTS.DAO.HASH_TYPE,
    args: '0x',
  })

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
  public async getSecpCellDep(
    network: { remote: string; genesisHash: string } = NetworksService.getInstance().getCurrent()
  ): Promise<CellDep> {
    const genesisBlockHash = network.genesisHash
    let outPoint = this.secpOutPointInfo.get(genesisBlockHash)
    if (!outPoint) {
      await this.loadInfos(network.remote)
      outPoint = this.secpOutPointInfo.get(genesisBlockHash)!
    }
    return new CellDep(outPoint, DepType.DepGroup)
  }

  public async getDaoCellDep(
    network: { remote: string; genesisHash: string } = NetworksService.getInstance().getCurrent()
  ): Promise<CellDep> {
    const genesisBlockHash = network.genesisHash
    let outPoint = this.daoOutPointInfo.get(genesisBlockHash)
    if (!outPoint) {
      await this.loadInfos(network.remote)
      outPoint = this.daoOutPointInfo.get(genesisBlockHash)!
    }
    return new CellDep(outPoint, DepType.Code)
  }

  public async getMultiSignCellDep(
    network: { remote: string; genesisHash: string } = NetworksService.getInstance().getCurrent()
  ): Promise<CellDep> {
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

  public static isSecpScript(script: Script): boolean {
    return script.codeHash === SystemScriptInfo.SECP_CODE_HASH && script.hashType === SystemScriptInfo.SECP_HASH_TYPE
  }

  public static isMultiSignScript(script: Script): boolean {
    return (
      script.codeHash === SystemScriptInfo.MULTI_SIGN_CODE_HASH &&
      script.hashType === SystemScriptInfo.MULTI_SIGN_HASH_TYPE
    )
  }

  public static isDaoScript(script: Script): boolean {
    return script.codeHash === SystemScriptInfo.DAO_CODE_HASH && script.hashType === SystemScriptInfo.DAO_HASH_TYPE
  }

  private async loadInfos(url: string): Promise<void> {
    const rpcService = new RpcService(url)
    const genesisBlock = (await rpcService.getGenesisBlock())!
    const genesisBlockHash = genesisBlock.header.hash

    // set secp info
    const secpOutPointTxHash = genesisBlock.transactions[1].hash!
    this.secpOutPointInfo.set(genesisBlockHash, new OutPoint(secpOutPointTxHash, '0'))

    // set dao info
    const daoOutPointTxHash = genesisBlock.transactions[0].hash!
    this.daoOutPointInfo.set(genesisBlockHash, new OutPoint(daoOutPointTxHash, '2'))

    // set multi sign info
    const multiSignOutPointTxHash = genesisBlock.transactions[1].hash!
    this.multiSignOutPointInfo.set(genesisBlockHash, new OutPoint(multiSignOutPointTxHash, '1'))
  }
}
