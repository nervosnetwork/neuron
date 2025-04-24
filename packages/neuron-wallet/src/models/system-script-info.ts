import OutPoint from './chain/out-point'
import CellDep, { DepType } from './chain/cell-dep'
import NetworksService from '../services/networks'
import RpcService from '../services/rpc-service'
import Script, { ScriptHashType } from './chain/script'
import { systemScripts } from '../utils/systemScripts'
import { NetworkType } from './network'
import { MAINNET_CLIENT_LIST } from '../utils/const'

export default class SystemScriptInfo {
  static SECP_CODE_HASH = process.env.SECP256K1_CODE_HASH!
  static DAO_CODE_HASH = process.env.DAO_CODE_HASH!
  static LEGACY_MULTISIG_CODE_HASH = process.env.LEGACY_MULTISIG_CODE_HASH!
  static MULTISIG_CODE_HASH = process.env.MULTISIG_CODE_HASH!

  static SECP_HASH_TYPE = ScriptHashType.Type
  static DAO_HASH_TYPE = ScriptHashType.Type
  static LEGACY_MULTI_SIGN_HASH_TYPE = ScriptHashType.Type
  static MULTI_SIGN_HASH_TYPE = ScriptHashType.Data1

  static DAO_SCRIPT_HASH = new Script(
    systemScripts.DAO.CODE_HASH,
    '0x',
    systemScripts.DAO.HASH_TYPE as ScriptHashType
  ).computeHash()

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

  private legacyMultiSignOutPointInfo = new Map<string, OutPoint>()
  private multiSignOutPointInfo = new Map<string, OutPoint>()

  public static getMultiSignHashType(lockCodeHash: string): ScriptHashType {
    if (lockCodeHash === SystemScriptInfo.MULTISIG_CODE_HASH) {
      return SystemScriptInfo.MULTI_SIGN_HASH_TYPE
    }
    return SystemScriptInfo.LEGACY_MULTI_SIGN_HASH_TYPE
  }

  // need network url and genesisBlockHash
  public async getSecpCellDep(
    network: { remote: string; genesisHash: string; type: NetworkType } = NetworksService.getInstance().getCurrent()
  ): Promise<CellDep> {
    const genesisBlockHash = network.genesisHash
    let outPoint = this.secpOutPointInfo.get(genesisBlockHash)
    if (!outPoint) {
      await this.loadInfos(network.remote, network.type)
      outPoint = this.secpOutPointInfo.get(genesisBlockHash)!
    }
    return new CellDep(outPoint, DepType.DepGroup)
  }

  public async getDaoCellDep(
    network: { remote: string; genesisHash: string; type: NetworkType } = NetworksService.getInstance().getCurrent()
  ): Promise<CellDep> {
    const genesisBlockHash = network.genesisHash
    let outPoint = this.daoOutPointInfo.get(genesisBlockHash)
    if (!outPoint) {
      await this.loadInfos(network.remote, network.type)
      outPoint = this.daoOutPointInfo.get(genesisBlockHash)!
    }
    return new CellDep(outPoint, DepType.Code)
  }

  public async getMultiSignCellDep(
    lockCodeHash: string = SystemScriptInfo.LEGACY_MULTISIG_CODE_HASH,
    network: {
      remote: string
      genesisHash: string
      type: NetworkType
      chain: string
    } = NetworksService.getInstance().getCurrent()
  ): Promise<CellDep> {
    const genesisBlockHash = network.genesisHash
    const multiSignOutPointInfo =
      lockCodeHash === SystemScriptInfo.MULTISIG_CODE_HASH
        ? this.multiSignOutPointInfo
        : this.legacyMultiSignOutPointInfo

    let outPoint = multiSignOutPointInfo.get(genesisBlockHash)
    if (!outPoint) {
      await this.loadInfos(network.remote, network.type, MAINNET_CLIENT_LIST.includes(network.chain))
      outPoint = multiSignOutPointInfo.get(genesisBlockHash)!
    }
    return new CellDep(outPoint, DepType.DepGroup)
  }

  public static generateSecpScript(args: string): Script {
    return new Script(SystemScriptInfo.SECP_CODE_HASH, args, SystemScriptInfo.SECP_HASH_TYPE)
  }

  public static generateDaoScript(args: string = '0x'): Script {
    return new Script(SystemScriptInfo.DAO_CODE_HASH, args, SystemScriptInfo.DAO_HASH_TYPE)
  }

  public static generateMultiSignScript(args: string, lockCodeHash: string): Script {
    return new Script(lockCodeHash, args, SystemScriptInfo.getMultiSignHashType(lockCodeHash))
  }

  public static isSecpScript(script: Script): boolean {
    return script.codeHash === SystemScriptInfo.SECP_CODE_HASH && script.hashType === SystemScriptInfo.SECP_HASH_TYPE
  }

  public static isMultiSignCodeHash(codeHash: string): boolean {
    return [SystemScriptInfo.LEGACY_MULTISIG_CODE_HASH, SystemScriptInfo.MULTISIG_CODE_HASH].includes(codeHash)
  }

  public static isMultiSignScript(script: Script): boolean {
    return (
      (script.codeHash === SystemScriptInfo.LEGACY_MULTISIG_CODE_HASH &&
        script.hashType === SystemScriptInfo.LEGACY_MULTI_SIGN_HASH_TYPE) ||
      (script.codeHash === SystemScriptInfo.MULTISIG_CODE_HASH &&
        script.hashType === SystemScriptInfo.MULTI_SIGN_HASH_TYPE)
    )
  }

  public static isDaoScript(script: Script): boolean {
    return script.codeHash === SystemScriptInfo.DAO_CODE_HASH && script.hashType === SystemScriptInfo.DAO_HASH_TYPE
  }

  private async loadInfos(url: string, type: NetworkType, isMainnet?: boolean): Promise<void> {
    const rpcService = new RpcService(url, type)
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
    this.legacyMultiSignOutPointInfo.set(genesisBlockHash, new OutPoint(multiSignOutPointTxHash, '1'))

    if (isMainnet) {
      this.multiSignOutPointInfo.set(genesisBlockHash, new OutPoint(process.env.MAINNET_MULTISIG_TXHASH!, '0'))
    } else {
      this.multiSignOutPointInfo.set(genesisBlockHash, new OutPoint(process.env.TESTNET_MULTISIG_TXHASH!, '0'))
    }
  }
}
