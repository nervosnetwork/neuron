import { ControllerResponse, SuccessFromController } from 'services/remote/remoteApiWrapper'
import { ResponseCode } from 'utils/enums'
import { MAINNET_TAG } from './const'

export const isMainnet = (networks: Readonly<State.Network[]>, networkID: string) => {
  return (networks.find(n => n.id === networkID) || {}).chain === MAINNET_TAG
}

export const isSuccessResponse = (res: ControllerResponse): res is SuccessFromController => {
  return res.status === ResponseCode.SUCCESS
}
