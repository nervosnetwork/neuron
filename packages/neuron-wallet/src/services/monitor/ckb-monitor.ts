import NodeService from '../node'
import BaseMonitor from './base'

export default class CkbMonitor extends BaseMonitor {
  async isLiving(): Promise<boolean> {
    return !(await NodeService.getInstance().isDefaultCKBNeedRestart())
  }

  async restart(): Promise<void> {
    return NodeService.getInstance().startNode()
  }

  name: string = 'ckb'
}
