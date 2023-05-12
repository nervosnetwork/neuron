import { stopCkbNode } from '../../services/ckb-runner'
import NodeService from '../node'
import BaseMonitor from './base'

export default class CkbMonitor extends BaseMonitor {
  async isLiving(): Promise<boolean> {
    return !(await NodeService.getInstance().isDefaultCKBNeedRestart())
  }

  async restart(): Promise<void> {
    return NodeService.getInstance().startNode()
  }

  async stop(): Promise<void> {
    await stopCkbNode()
  }

  name: string = 'ckb'
}
