import { addressToScript } from '@nervosnetwork/ckb-sdk-utils'
import { ControllerResponse, SuccessFromController } from 'services/remote/remoteApiWrapper'
import { ResponseCode, DefaultLockInfo } from 'utils/enums'
import { MAINNET_TAG } from './const'

export const isMainnet = (networks: Readonly<State.Network[]>, networkID: string) => {
  return (networks.find(n => n.id === networkID) || {}).chain === MAINNET_TAG
}

export const isSuccessResponse = (res: Pick<ControllerResponse, 'status'>): res is SuccessFromController => {
  return res.status === ResponseCode.SUCCESS
}

export const isReadyByVersion = (targetVersion: number, lastVersion: number | null) => {
  if (lastVersion === null) {
    return true
  }
  if (lastVersion < targetVersion) {
    return true
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
