import Core from '@nervosnetwork/ckb-sdk-core'
import NodeService from '../services/node'

export default class Blake2b {
  private b: any
  private core: Core

  constructor() {
    this.core = NodeService.getInstance().core
    this.b = this.core.utils.blake2b(32, null, null, this.core.utils.PERSONAL)
  }

  public update = (message: string): void => {
    const msg = this.core.utils.hexToBytes(message.replace(/0x/, ''))
    this.b.update(msg)
  }

  public digest = (): string => {
    return `0x${this.b.digest('hex')}`
  }

  public static digest = (message: string): string => {
    const blake2b = new Blake2b()
    blake2b.update(message)
    return blake2b.digest()
  }
}
