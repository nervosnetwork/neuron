import { startCkbNode, stopCkbNode } from 'services/ckb-runner'
import { ResponseCode } from 'utils/const'

export default class NodeController {
  public async startNode() {
    await startCkbNode()

    return {
      status: ResponseCode.Success,
      result: true
    }
  }

  public stopNode() {
    stopCkbNode()

    return {
      status: ResponseCode.Success,
      result: true
    }
  }
}
