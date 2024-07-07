import SignMessage from '../services/sign-message'
import { ServiceHasNoResponse } from '../exceptions'
import { ResponseCode } from '../utils/const'

export default class SignMessageController {
  public async sign(params: Controller.Params.SignParams): Promise<Controller.Response<string>> {
    const signature: string = await SignMessage.sign({
      ...params,
      address: params.address?.trim(),
    })
    if (!signature) {
      throw new ServiceHasNoResponse('Sign')
    }

    return {
      status: ResponseCode.Success,
      result: signature,
    }
  }

  public async verify(params: Controller.Params.VerifyParams): Promise<Controller.Response<'old-sign' | 'new-sign'>> {
    const result = SignMessage.verifyOldAndNew(params.address.trim(), params.signature, params.message)
    if (!result) {
      throw new ServiceHasNoResponse('Verify')
    }

    return {
      status: ResponseCode.Success,
      result,
    }
  }
}
