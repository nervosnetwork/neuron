import SignMessage from "services/sign-message"
import { ServiceHasNoResponse } from "exceptions"
import { ResponseCode } from "utils/const"

export default class SignMessageController {
  public async sign(params: Controller.Params.SignParams): Promise<Controller.Response<string>> {
    const signature: string = SignMessage.sign(
      params.walletID,
      params.address,
      params.password,
      params.message
    )
    if (!signature) {
      throw new ServiceHasNoResponse('Sign')
    }

    return {
      status: ResponseCode.Success,
      result: signature
    }
  }

  public async verify(params: Controller.Params.VerifyParams): Promise<Controller.Response<boolean>> {
    const result: boolean = SignMessage.verify(
      params.address,
      params.signature,
      params.message
    )
    if (!result) {
      throw new ServiceHasNoResponse('Verify')
    }

    return {
      status: ResponseCode.Success,
      result,
    }
  }
}
