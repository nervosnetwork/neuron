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
  systemScript: SystemScript

  constructor(systemScript: SystemScript) {
    this.systemScript = systemScript
  }

  @subscribed
  static systemScriptInfo: SystemScript | undefined

  static previousURL: string | undefined

  static async loadSystemScript(nodeURL: string): Promise<SystemScript> {
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

    return {
      codeHash,
      outPoint: { txHash, index },
      hashType: hashType as ScriptHashType
    }
  }

  static async systemScript(nodeURL: string = NodeService.getInstance().core.rpc.node.url): Promise<SystemScript> {
    if (LockUtils.systemScriptInfo && nodeURL === LockUtils.previousURL) {
      return LockUtils.systemScriptInfo
    }

    LockUtils.systemScriptInfo = await LockUtils.loadSystemScript(nodeURL)
    LockUtils.previousURL = nodeURL

    return LockUtils.systemScriptInfo
  }

  static setSystemScript(info: SystemScript) {
    LockUtils.systemScriptInfo = info
    LockUtils.previousURL = NodeService.getInstance().core.rpc.node.url
    SystemScriptSubject.next({ codeHash: info.codeHash })
  }

  addressToLockScript(address: string, hashType: ScriptHashType = ScriptHashType.Type): Script {
    return {
      codeHash: this.systemScript.codeHash,
      args: LockUtils.addressToBlake160(address),
      hashType,
    }
  }

  addressToLockHash(address: string, hashType: ScriptHashType = ScriptHashType.Type): string {
    const lock = this.addressToLockScript(address, hashType)
    return LockUtils.lockScriptToHash(lock)
  }

  addressToAllLockHashes(address: string): string[] {
    return [this.addressToLockHash(address, ScriptHashType.Type)]
  }

  addressesToAllLockHashes(addresses: string[]): string[] {
    return addresses.map(addr => {
      return this.addressToAllLockHashes(addr)
    }).reduce((acc, val) => acc.concat(val), [])
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

  static lockScriptToAddress(lock: Script): string {
    const blake160: string = lock.args!
    return LockUtils.blake160ToAddress(blake160)
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
