import { addressToScript } from '@nervosnetwork/ckb-sdk-utils'
import { ControllerResponse, SuccessFromController } from 'services/remote/remoteApiWrapper'
import {
  ResponseCode,
  DefaultLockInfo,
  AnyoneCanPayLockInfoOnAggron,
  AnyoneCanPayLockInfoOnLina,
  PwAcpLockInfoOnMainNet,
  PwAcpLockInfoOnTestNet,
} from 'utils/enums'
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
