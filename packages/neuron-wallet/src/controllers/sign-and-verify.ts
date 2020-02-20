import SignAndVerify from "services/sign-and-verify"
import { ServiceHasNoResponse } from "exceptions"
import { ResponseCode } from "utils/const"

export default class SignAndVerifyController {
  public async sign(params: Controller.Params.SignParams): Promise<Controller.Response<string>> {
    const signature: string = SignAndVerify.sign(
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
    const result: boolean = SignAndVerify.verify(
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
