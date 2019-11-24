import { createCkbRunnerTask, killCkbRunnerTask } from 'startup/ckb-runner'
import { ResponseCode } from 'utils/const'

export default class NodeController {
  public static async startNode() {
    createCkbRunnerTask()

    return {
      status: ResponseCode.Success,
      result: true
    }
  }

  public static async stopNode() {
    killCkbRunnerTask()

    return {
      status: ResponseCode.Success,
      result: true
    }
  }
}
