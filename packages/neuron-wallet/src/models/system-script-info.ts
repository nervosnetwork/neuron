import OutPoint from "./chain/out-point"
import CellDep, { DepType } from "./chain/cell-dep"
import NetworksService from "services/networks"
import RpcService from "services/rpc-service"

export default class SystemScriptInfo {
  static MAINNET_GENESIS_BLOCK_HASH = "0x92b197aa1fba0f63633922c61c92375c9c074a93e85963554f5499fe1450d0e5"
  static TESTNET_GENESIS_BLOCK_HASH = "0x184ac4658ed0c04a126551257990db132366cac22ab6270bbbc1f8c3220f302d"
  static DEFAULT_DEVNET_GENESIS_BLOCK_HASH = "0x823b2ff5785b12da8b1363cac9a5cbe566d8b715a4311441b119c39a0367488c"

  static SECP_CODE_HASH = "0x9bd7e06f3ecf4be0f2fcd2188b23f1b9fcc88e5d4b65a8637b17723bbda3cce8"
  static DAO_CODE_HASH = "0x82d76d1b75fe2fd9a27dfbaa65a039221a380d76c926f378d3f81cf3e7e13f2e"
  static MULTI_SIGN_CODE_HASH = "0x5c5069eb0857efc65e1bca0c07df34c31663b3622fd3876c876320fc9634e2a8"

  private static instance: SystemScriptInfo
  static getInstance(): SystemScriptInfo {
    if (!SystemScriptInfo.instance) {
      SystemScriptInfo.instance = new SystemScriptInfo()
    }

    return SystemScriptInfo.instance
  }

  // key = genesisBlockHash, value = OutPoint
  private secpOutPointInfo = new Map<string, OutPoint>([
    [SystemScriptInfo.MAINNET_GENESIS_BLOCK_HASH, new OutPoint('0x71a7ba8fc96349fea0ed3a5c47992e3b4084b031a42264a018e0072e8172e46c', '0')],
    [SystemScriptInfo.TESTNET_GENESIS_BLOCK_HASH, new OutPoint('0x84dcb061adebff4ef93d57c975ba9058a9be939d79ea12ee68003f6492448890', '0')],
    [SystemScriptInfo.DEFAULT_DEVNET_GENESIS_BLOCK_HASH, new OutPoint('0xace5ea83c478bb866edf122ff862085789158f5cbff155b7bb5f13058555b708', '0')],
  ])

  private daoOutPointInfo = new Map<string, OutPoint>([
    [SystemScriptInfo.MAINNET_GENESIS_BLOCK_HASH, new OutPoint('0xe2fb199810d49a4d8beec56718ba2593b665db9d52299a0f9e6e75416d73ff5c', '2')],
    [SystemScriptInfo.TESTNET_GENESIS_BLOCK_HASH, new OutPoint('0x15fb8111fc78fa36da6af96c45ac4714cc9a33974fdae13cc524b29e1a488c7f', '2')],
    [SystemScriptInfo.DEFAULT_DEVNET_GENESIS_BLOCK_HASH, new OutPoint('0xa563884b3686078ec7e7677a5f86449b15cf2693f3c1241766c6996f206cc541', '2')],
  ])

  private multiSignOutPointInfo = new Map<string, OutPoint>([
    [SystemScriptInfo.MAINNET_GENESIS_BLOCK_HASH, new OutPoint('0x71a7ba8fc96349fea0ed3a5c47992e3b4084b031a42264a018e0072e8172e46c', '1')],
    [SystemScriptInfo.TESTNET_GENESIS_BLOCK_HASH, new OutPoint('0x84dcb061adebff4ef93d57c975ba9058a9be939d79ea12ee68003f6492448890', '1')],
    [SystemScriptInfo.DEFAULT_DEVNET_GENESIS_BLOCK_HASH, new OutPoint('0xace5ea83c478bb866edf122ff862085789158f5cbff155b7bb5f13058555b708', '1')],
  ])

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
