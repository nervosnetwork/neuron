import { startCkbNode, stopCkbNode } from 'startup/ckb-runner'
import { ResponseCode } from 'utils/const'

export default class NodeController {
  public static async startNode() {
    startCkbNode()

    return {
      status: ResponseCode.Success,
      result: true
    }
  }

  public static async stopNode() {
    stopCkbNode()

    return {
      status: ResponseCode.Success,
      result: true
    }
  }
}
