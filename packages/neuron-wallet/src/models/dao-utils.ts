import NodeService from 'services/node'
import Core from '@nervosnetwork/ckb-sdk-core'
import { SystemScript } from './lock-utils'
import { scriptToHash } from '@nervosnetwork/ckb-sdk-utils'
import { ScriptHashType } from './chain/script'
import OutPoint from 'models/chain/out-point'

export default class DaoUtils {
  daoScript: SystemScript

  constructor(daoScript: SystemScript) {
    this.daoScript = daoScript
  }

  static daoScriptInfo: SystemScript | undefined

  static previousURL: string | undefined

  static async loadDaoScript(nodeURL: string): Promise<SystemScript> {
    const core = new Core(nodeURL)

    const genesisBlock = await core.rpc.getBlockByNumber(BigInt(0))
    const systemCellTransaction = genesisBlock.transactions[0]
    const daoOutPoint = new OutPoint({
      txHash: systemCellTransaction.hash,
      index: '0x2'
    })

    const daoTypeHash = scriptToHash(systemCellTransaction.outputs[2].type!)

    return {
      codeHash: daoTypeHash,
      outPoint: daoOutPoint,
      hashType: ScriptHashType.Type
    }
  }

  static async daoScript(nodeURL: string = NodeService.getInstance().core.rpc.node.url): Promise<SystemScript> {
    if (DaoUtils.daoScriptInfo && nodeURL === DaoUtils.previousURL) {
      return DaoUtils.daoScriptInfo
    }

    DaoUtils.daoScriptInfo = await DaoUtils.loadDaoScript(nodeURL)
    DaoUtils.previousURL = nodeURL

    return DaoUtils.daoScriptInfo
  }

  static cleanInfo(): void {
    DaoUtils.daoScriptInfo = undefined
  }

  static setDaoScript(info: SystemScript) {
    DaoUtils.daoScriptInfo = info
    DaoUtils.previousURL = NodeService.getInstance().core.rpc.node.url
  }
}
