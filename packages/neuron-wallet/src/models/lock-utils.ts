import NodeService from '../services/node'
import { OutPoint, Script, ScriptHashType } from '../types/cell-types'
import env from '../env'
import { SystemScriptSubject } from './subjects/system-script'

const { core } = NodeService.getInstance()

export interface SystemScript {
  codeHash: string
  outPoint: OutPoint
}

const subscribed = (target: any, propertyName: string) => {
  let value: any
  Object.defineProperty(target, propertyName, {
    get: () => value,
    set: (info: { codeHash: string }) => {
      SystemScriptSubject.next({ codeHash: info.codeHash })
      value = info
    },
  })
}

export default class LockUtils {
  @subscribed
  static systemScriptInfo: SystemScript | undefined

  static async systemScript(): Promise<SystemScript> {
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

  static setSystemScript(info: SystemScript) {
    LockUtils.systemScriptInfo = info
    SystemScriptSubject.next({ codeHash: info.codeHash })
  }

  // use SDK lockScriptToHash
  static lockScriptToHash = (lock: Script) => {
    const codeHash: string = lock!.codeHash!
    const args: string[] = lock.args!
    const { hashType } = lock
    // TODO: should support ScriptHashType.Type in the future
    const lockHash: string = core.utils.lockScriptToHash({
      codeHash,
      args,
      hashType,
    })

    if (lockHash.startsWith('0x')) {
      return lockHash
    }

    return `0x${lockHash}`
  }

  static async addressToLockScript(address: string, hashType: ScriptHashType = ScriptHashType.Data): Promise<Script> {
    const systemScript = await this.systemScript()

    const lock: Script = {
      codeHash: systemScript.codeHash,
      args: [LockUtils.addressToBlake160(address)],
      hashType,
    }
    return lock
  }

  static async addressToLockHash(address: string, hashType: ScriptHashType = ScriptHashType.Data): Promise<string> {
    const lock: Script = await this.addressToLockScript(address, hashType)
    const lockHash: string = await this.lockScriptToHash(lock)

    return lockHash
  }

  static async addressToAllLockHashes(address: string): Promise<string[]> {
    const dataLockHash = await LockUtils.addressToLockHash(address, ScriptHashType.Data)
    const typeLockHash = await LockUtils.addressToLockHash(address, ScriptHashType.Type)
    return [dataLockHash, typeLockHash]
  }

  static async addressesToAllLockHashes(addresses: string[]): Promise<string[]> {
    const lockHashes: string[] = (await Promise.all(
      addresses.map(async addr => {
        return LockUtils.addressToAllLockHashes(addr)
      })
    )).reduce((acc, val) => acc.concat(val), [])
    return lockHashes
  }

  static lockScriptToAddress(lock: Script): string {
    const blake160: string = lock.args![0]
    return this.blake160ToAddress(blake160)
  }

  static blake160ToAddress(blake160: string): string {
    const prefix = env.testnet ? core.utils.AddressPrefix.Testnet : core.utils.AddressPrefix.Mainnet
    return core.utils.bech32Address(blake160, {
      prefix,
      type: core.utils.AddressType.HashIdx,
      codeHashIndex: '0x00',
    })
  }

  static addressToBlake160(address: string): string {
    const prefix = env.testnet ? core.utils.AddressPrefix.Testnet : core.utils.AddressPrefix.Mainnet
    const result: string = core.utils.parseAddress(address, prefix, 'hex') as string
    const hrp: string = `0100`
    let blake160: string = result.slice(hrp.length, result.length)
    if (!blake160.startsWith('0x')) {
      blake160 = `0x${blake160}`
    }
    return blake160
  }
}
