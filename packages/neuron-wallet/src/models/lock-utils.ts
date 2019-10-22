import {
  scriptToHash,
  AddressPrefix,
  bech32Address,
  AddressType,
  parseAddress
} from '@nervosnetwork/ckb-sdk-utils'
import NodeService from 'services/node'
import { OutPoint, Script, ScriptHashType } from 'types/cell-types'
import ConvertTo from 'types/convert-to'
import { SystemScriptSubject } from 'models/subjects/system-script'
import Core from '@nervosnetwork/ckb-sdk-core'
import ChainInfo from './chain-info'

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

  static previousURL: string | undefined

  static async systemScript(nodeURL: string = NodeService.getInstance().core.rpc.node.url): Promise<SystemScript> {
    if (this.systemScriptInfo && nodeURL === LockUtils.previousURL) {
      return this.systemScriptInfo
    }

    const core = new Core(nodeURL)

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
    LockUtils.previousURL = nodeURL

    return systemScriptInfo
  }

  static setSystemScript(info: SystemScript) {
    LockUtils.systemScriptInfo = info
    LockUtils.previousURL = NodeService.getInstance().core.rpc.node.url
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

  static async addressToLockScript(
    address: string,
    hashType: ScriptHashType = ScriptHashType.Type,
    nodeURL: string = NodeService.getInstance().core.rpc.node.url
  ): Promise<Script> {
    const systemScript = await this.systemScript(nodeURL)

    const lock: Script = {
      codeHash: systemScript.codeHash,
      args: LockUtils.addressToBlake160(address),
      hashType,
    }
    return lock
  }

  static async addressToLockHash(
    address: string,
    hashType: ScriptHashType = ScriptHashType.Type,
    nodeURL: string = NodeService.getInstance().core.rpc.node.url
  ): Promise<string> {
    const lock: Script = await this.addressToLockScript(address, hashType, nodeURL)
    const lockHash: string = this.lockScriptToHash(lock)

    return lockHash
  }

  static async addressToAllLockHashes(
    address: string,
    nodeURL: string = NodeService.getInstance().core.rpc.node.url
  ): Promise<string[]> {
    const dataLockHash = await LockUtils.addressToLockHash(address, ScriptHashType.Type, nodeURL)
    return [dataLockHash]
  }

  static async addressesToAllLockHashes(
    addresses: string[],
    nodeURL: string = NodeService.getInstance().core.rpc.node.url
  ): Promise<string[]> {
    const lockHashes: string[] = (await Promise.all(
      addresses.map(async addr => {
        return LockUtils.addressToAllLockHashes(addr, nodeURL)
      })
    )).reduce((acc, val) => acc.concat(val), [])
    return lockHashes
  }

  static lockScriptToAddress(lock: Script): string {
    const blake160: string = lock.args!
    return this.blake160ToAddress(blake160)
  }

  static blake160ToAddress(blake160: string): string {
    const prefix = ChainInfo.getInstance().isMainnet() ? AddressPrefix.Mainnet : AddressPrefix.Testnet
    return bech32Address(blake160, {
      prefix,
      type: AddressType.HashIdx,
      codeHashOrCodeHashIndex: '0x00',
    })
  }

  static addressToBlake160(address: string): string {
    const result: string = parseAddress(address, 'hex') as string
    const hrp: string = `0100`
    let blake160: string = result.slice(hrp.length + 2, result.length)
    if (!blake160.startsWith('0x')) {
      blake160 = `0x${blake160}`
    }
    return blake160
  }
}
