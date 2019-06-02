import nodeService from '../startup/nodeService'
import { CellOutPoint, OutPoint, Script } from '../app-types/types'

const { core } = nodeService

export default class LockUtils {
  static systemScriptInfo: { codeHash: string; outPoint: OutPoint } | undefined

  static async systemScript() {
    if (this.systemScriptInfo) {
      return this.systemScriptInfo
    }

    const genesisBlock = await core.rpc.getBlockByNumber('0')
    const systemScriptTx = genesisBlock.transactions[0]
    const blake2b = core.utils.blake2b(32)
    const systemScriptCell = systemScriptTx.outputs[0]
    const { data } = systemScriptCell
    if (typeof data === 'string') {
      blake2b.update(core.utils.hexToBytes(data))
    } else {
      // if Uint8Array
      blake2b.update(data)
    }
    const codeHash: string = blake2b.digest('hex')
    const cellOutPoint: CellOutPoint = {
      txHash: systemScriptTx.hash,
      index: '1',
    }
    const outPoint: OutPoint = {
      cell: cellOutPoint,
    }

    const systemScriptInfo = {
      codeHash,
      outPoint,
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
    const result: string = core.utils.parseAddress(address, core.utils.AddressPrefix.Testnet, 'hex') as string
    const hrp: string = `01${Buffer.from('P2PH').toString('hex')}`
    let blake160: string = result.slice(hrp.length, result.length)
    if (!blake160.startsWith('0x')) {
      blake160 = `0x${blake160}`
    }
    const systemScript = await this.systemScript()

    const lock: Script = {
      codeHash: systemScript.codeHash,
      args: [blake160],
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
    return core.utils.bech32Address(blake160, {
      prefix: core.utils.AddressPrefix.Testnet,
      type: core.utils.AddressType.BinIdx,
      binIdx: core.utils.AddressBinIdx.P2PH,
    })
  }
}
