import { addressToScript } from 'utils'
import { ControllerResponse, SuccessFromController } from 'services/remote/remoteApiWrapper'
import {
  ResponseCode,
  DefaultLockInfo,
  AnyoneCanPayLockInfoOnAggron,
  AnyoneCanPayLockInfoOnLina,
  PwAcpLockInfoOnMainNet,
  PwAcpLockInfoOnTestNet,
  UDTType,
} from 'utils/enums'
import { type Script } from '@ckb-lumos/base'
import { predefined } from '@ckb-lumos/config-manager'
import { MAINNET_CLIENT_LIST } from './const'

export const isMainnet = (networks: Readonly<State.Network[]>, networkID: string) => {
  const network = networks.find(n => n.id === networkID)
  return MAINNET_CLIENT_LIST.includes(network?.chain ?? '')
}

export const isSuccessResponse = (res: Pick<ControllerResponse, 'status'>): res is SuccessFromController => {
  return res.status === ResponseCode.SUCCESS
}

export const isReadyByVersion = (targetVersion: string, lastVersion: string | null) => {
  if (lastVersion === null) {
    return false
  }
  const targetVersions = targetVersion.split('.')
  const lastVersions = lastVersion.split('.')
  for (let i = 0; i < targetVersions.length; i++) {
    if (!lastVersions[i] || +targetVersions[i] > +lastVersions[i]) {
      return true
    }
  }
  return false
}

export const isSecp256k1Address = (address: string) => {
  try {
    const script = addressToScript(address)
    return (
      script.codeHash === DefaultLockInfo.CodeHash &&
      script.hashType === DefaultLockInfo.HashType &&
      script.args.length === +DefaultLockInfo.ArgsLen * 2 + 2
    )
  } catch {
    return false
  }
}

export const isAnyoneCanPayAddress = (address: string, isMainnetAddress: boolean) => {
  try {
    const script = addressToScript(address)
    const anyOneScripts = isMainnetAddress
      ? [AnyoneCanPayLockInfoOnLina, PwAcpLockInfoOnMainNet]
      : [AnyoneCanPayLockInfoOnAggron, PwAcpLockInfoOnTestNet]
    return anyOneScripts.some(
      (anyOneScript: { CodeHash: string; HashType: string; ArgsLen: string }) =>
        script.codeHash === anyOneScript.CodeHash &&
        script.hashType === anyOneScript.HashType &&
        anyOneScript.ArgsLen.split(',').some(v => +v * 2 + 2 === script.args.length)
    )
  } catch {
    return false
  }
}

// Add string type to recognize the return type of API from https://github.com/nervosnetwork/neuron/blob/v0.116.2/packages/neuron-wallet/src/models/chain/output.ts#L20
// TODO, make the UDT code hash globally configurable to ensure it can test with the devnet
export const getUdtType = (type: Script | string | null) => {
  if (type === null) return undefined
  if (typeof type === 'string') {
    switch (type) {
      case UDTType.SUDT:
      case UDTType.XUDT:
        return type
      default:
        return undefined
    }
  }
  switch (type.codeHash) {
    case predefined.AGGRON4.SCRIPTS.SUDT.CODE_HASH:
    case predefined.LINA.SCRIPTS.SUDT.CODE_HASH:
      return UDTType.SUDT
    case predefined.AGGRON4.SCRIPTS.XUDT.CODE_HASH:
    case predefined.LINA.SCRIPTS.XUDT.CODE_HASH:
      return UDTType.XUDT
    default:
      return undefined
  }
}
