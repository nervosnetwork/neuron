import NodeService from '../services/node'
import { OutPoint, Script } from '../app-types/types'
import env from '../env'

const { core } = NodeService.getInstance()

export default class LockUtils {
  static systemScriptInfo: { codeHash: string; outPoint: OutPoint } | undefined

  static async systemScript() {
    if (this.systemScriptInfo) {
      return this.systemScriptInfo
    }

    const systemCell = await core.loadSystemCell()
    let { codeHash } = systemCell
    const { outPoint } = systemCell
    let { blockHash } = outPoint
    let { txHash } = outPoint.cell
    const { index } = outPoint.cell

    if (!codeHash.startsWith('0x')) {
      codeHash = `0x${codeHash}`
    }

    if (!blockHash.startsWith('0x')) {
      blockHash = `0x${blockHash}`
    }

    if (!txHash.startsWith('0x')) {
      txHash = `0x${txHash}`
    }

    const systemScriptInfo = {
      codeHash,
      outPoint: {
        blockHash,
        cell: {
          txHash,
          index,
        },
      },
    }

    this.systemScriptInfo = systemScriptInfo

    return systemScriptInfo
  }

  // use SDK lockScriptToHash
  static lockScriptToHash = (lock: Script) => {
    const codeHash: string = lock!.codeHash!
    const args: string[] = lock.args!
    const lockHash: string = core.utils.lockScriptToHash({
      codeHash,
      args,
    })

    if (lockHash.startsWith('0x')) {
      return lockHash
    }

    return `0x${lockHash}`
  }

  static async addressToLockScript(address: string): Promise<Script> {
    const systemScript = await this.systemScript()

    const lock: Script = {
      codeHash: systemScript.codeHash,
      args: [LockUtils.addressToBlake160(address)],
    }
    return lock
  }

  static async addressToLockHash(address: string): Promise<string> {
    const lock: Script = await this.addressToLockScript(address)
    const lockHash: string = await this.lockScriptToHash(lock)

    return lockHash
  }

  static lockScriptToAddress(lock: Script): string {
    const blake160: string = lock.args![0]
    return this.blake160ToAddress(blake160)
  }

  static blake160ToAddress(blake160: string): string {
    const prefix = env.testnet ? core.utils.AddressPrefix.Testnet : core.utils.AddressPrefix.Mainnet
    return core.utils.bech32Address(blake160, {
      prefix,
      type: core.utils.AddressType.BinIdx,
      binIdx: core.utils.AddressBinIdx.P2PH,
    })
  }

  static addressToBlake160(address: string): string {
    const prefix = env.testnet ? core.utils.AddressPrefix.Testnet : core.utils.AddressPrefix.Mainnet
    const result: string = core.utils.parseAddress(address, prefix, 'hex') as string
    const hrp: string = `01${Buffer.from('P2PH').toString('hex')}`
    let blake160: string = result.slice(hrp.length, result.length)
    if (!blake160.startsWith('0x')) {
      blake160 = `0x${blake160}`
    }
    return blake160
  }
}
