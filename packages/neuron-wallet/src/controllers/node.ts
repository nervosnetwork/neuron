import { startCkbNode, stopCkbNode, ckbDataPath } from 'services/ckb-runner'
import { ResponseCode } from 'utils/const'
import { deleteFolderRecursive } from 'block-sync-renderer/sync/indexer-folder-manager'

export default class NodeController {
  public async startNode() {
    await startCkbNode()

    return {
      status: ResponseCode.Success,
      result: true
    }
  }

  public async clearCache() {
    await this.stopNode()
    deleteFolderRecursive(ckbDataPath())
    await this.startNode()
    return {
      status: ResponseCode.Success,
      result: true
    }
  }

  public async stopNode() {
    await stopCkbNode()

    return {
      status: ResponseCode.Success,
      result: true
    }
  }
}
