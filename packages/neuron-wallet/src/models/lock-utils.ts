import { scriptToHash } from '@nervosnetwork/ckb-sdk-utils'
import NodeService from 'services/node'
import { OutPoint, Script, ScriptHashType } from 'types/cell-types'
import env from 'env'
import ConvertTo from 'types/convert-to'
import { SystemScriptSubject } from 'models/subjects/system-script'

const { core } = NodeService.getInstance()

export interface SystemScript {
  codeHash: string
  outPoint: OutPoint
  hashType: ScriptHashType
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

    const systemCell = await core.loadSecp256k1Dep()
    let { codeHash } = systemCell
    const { outPoint, hashType } = systemCell
    let { txHash } = outPoint
    const { index } = outPoint

    if (!codeHash.startsWith('0x')) {
      codeHash = `0x${codeHash}`
    }

    if (!txHash.startsWith('0x')) {
      txHash = `0x${txHash}`
    }

    const systemScriptInfo = {
      codeHash,
      outPoint: {
        txHash,
        index,
      },
      hashType: hashType as ScriptHashType,
    }

    this.systemScriptInfo = systemScriptInfo

    return systemScriptInfo
  }

  static setSystemScript(info: SystemScript) {
    LockUtils.systemScriptInfo = info
    SystemScriptSubject.next({ codeHash: info.codeHash })
  }

  static computeScriptHash = (script: Script): string => {
    const ckbScript: CKBComponents.Script = ConvertTo.toSdkScript(script)
    const hash: string = scriptToHash(ckbScript)
    if (!hash.startsWith('0x')) {
      return `0x${hash}`
    }
    return hash
  }

  // use SDK lockScriptToHash
  static lockScriptToHash = (lock: Script) => {
    return LockUtils.computeScriptHash(lock)
  }

  static async addressToLockScript(address: string, hashType: ScriptHashType = ScriptHashType.Type): Promise<Script> {
    const systemScript = await this.systemScript()

    const lock: Script = {
      codeHash: systemScript.codeHash,
      args: LockUtils.addressToBlake160(address),
      hashType,
    }
    return lock
  }

  static async addressToLockHash(address: string, hashType: ScriptHashType = ScriptHashType.Type): Promise<string> {
    const lock: Script = await this.addressToLockScript(address, hashType)
    const lockHash: string = this.lockScriptToHash(lock)

    return lockHash
  }

  static async addressToAllLockHashes(address: string): Promise<string[]> {
    const dataLockHash = await LockUtils.addressToLockHash(address)
    return [dataLockHash]
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
    const blake160: string = lock.args!
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
    const result: string = core.utils.parseAddress(address, 'hex') as string
    const hrp: string = `0100`
    let blake160: string = result.slice(hrp.length + 2, result.length)
    if (!blake160.startsWith('0x')) {
      blake160 = `0x${blake160}`
    }
    return blake160
  }
}
