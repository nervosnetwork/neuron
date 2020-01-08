import {
  AddressPrefix,
  bech32Address,
  AddressType,
  parseAddress
} from '@nervosnetwork/ckb-sdk-utils'
import NodeService from 'services/node'
import Core from '@nervosnetwork/ckb-sdk-core'
import OutPoint from './chain/out-point'
import Script, { ScriptHashType } from './chain/script'

export interface SystemScript {
  codeHash: string
  outPoint: OutPoint
  hashType: ScriptHashType
}

export default class LockUtils {
  systemScript: SystemScript

  constructor(systemScript: SystemScript) {
    this.systemScript = systemScript
  }

  private static systemScriptInfo: SystemScript | undefined

  private static previousURL: string | undefined

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
      outPoint: new OutPoint(txHash, index),
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

  static cleanInfo(): void {
    LockUtils.systemScriptInfo = undefined
  }

  static setSystemScript(info: SystemScript) {
    LockUtils.systemScriptInfo = info
    LockUtils.previousURL = NodeService.getInstance().core.rpc.node.url
  }

  addressToLockScript(address: string, hashType: ScriptHashType = ScriptHashType.Type): Script {
    return new Script(
      this.systemScript.codeHash,
      LockUtils.addressToBlake160(address),
      hashType
    )
  }

  addressToLockHash(address: string, hashType: ScriptHashType = ScriptHashType.Type): string {
    return this.addressToLockScript(address, hashType).computeHash()
  }

  addressToAllLockHashes(address: string): string[] {
    return [this.addressToLockHash(address, ScriptHashType.Type)]
  }

  addressesToAllLockHashes(addresses: string[]): string[] {
    return addresses.map(addr => {
      return this.addressToAllLockHashes(addr)
    }).reduce((acc, val) => acc.concat(val), [])
  }

  static lockScriptToAddress(lock: Script, prefix: AddressPrefix = AddressPrefix.Mainnet): string {
    const blake160: string = lock.args!
    return LockUtils.blake160ToAddress(blake160, prefix)
  }

  static blake160ToAddress(blake160: string, prefix: AddressPrefix = AddressPrefix.Mainnet): string {
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
