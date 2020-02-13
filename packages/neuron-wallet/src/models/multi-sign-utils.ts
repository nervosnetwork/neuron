import { SystemScript } from "./lock-utils"
import NodeService from "services/node"
import OutPoint from "./chain/out-point"
import { ScriptHashType } from "./chain/script"
import RpcService from "services/rpc-service"

export default class MultiSignUtils {
  multiSignScript: SystemScript

  constructor(multiSignScript: SystemScript) {
    this.multiSignScript = multiSignScript
  }

  private static multiSignScriptInfo: SystemScript | undefined

  private static previousURL: string | undefined

  static async loadMultiSignScript(nodeURL: string): Promise<SystemScript> {
    const rpcService = new RpcService(nodeURL)

    const genesisBlock = await rpcService.getBlockByNumber('0')

    const outPoint = new OutPoint(genesisBlock!.transactions[1].hash!, '1')
    const codeHash = genesisBlock!.transactions[0].outputs[4].type!.computeHash()
    const hashType = ScriptHashType.Type

    return {
      codeHash,
      outPoint,
      hashType,
    }
  }

  static async multiSignScript(nodeURL: string = NodeService.getInstance().ckb.rpc.node.url): Promise<SystemScript> {
    if (MultiSignUtils.multiSignScriptInfo && nodeURL === MultiSignUtils.previousURL) {
      return MultiSignUtils.multiSignScriptInfo
    }

    MultiSignUtils.multiSignScriptInfo = await MultiSignUtils.loadMultiSignScript(nodeURL)
    MultiSignUtils.previousURL = nodeURL

    return MultiSignUtils.multiSignScriptInfo
  }

  static cleanInfo(): void {
    MultiSignUtils.multiSignScriptInfo = undefined
  }

  static setMultiSignScript(info: SystemScript) {
    MultiSignUtils.multiSignScriptInfo = info
    MultiSignUtils.previousURL = NodeService.getInstance().ckb.rpc.node.url
  }
}
