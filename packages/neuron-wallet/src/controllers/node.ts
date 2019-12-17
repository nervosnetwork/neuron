import { startCkbNode, stopCkbNode } from 'services/ckb-runner'
import { ResponseCode } from 'utils/const'

export default class NodeController {
  public static async startNode() {
    await startCkbNode()

    return {
      status: ResponseCode.Success,
      result: true
    }
  }

  public static stopNode() {
    stopCkbNode()

    return {
      status: ResponseCode.Success,
      result: true
    }
  }
}
