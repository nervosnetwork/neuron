import { ControllerResponse, SuccessFromController } from 'services/remote/remoteApiWrapper'
import { ResponseCode } from 'utils/const'

export default (res: ControllerResponse): res is SuccessFromController => {
  return res.status === ResponseCode.SUCCESS
}
