import { CatchControllerError } from 'decorators/errors'
import { ResponseCode } from 'utils/const'
import SkipDataAndType from 'services/settings/skip-data-and-type'

export default class SkipDataAndTypeController {
  @CatchControllerError
  public static async update(skip: boolean): Promise<Controller.Response<boolean>> {
    SkipDataAndType.getInstance().update(skip)

    return {
      status: ResponseCode.Success,
      result: skip,
    }
  }

  @CatchControllerError
  public static async get(): Promise<Controller.Response<boolean>> {
    const skip = SkipDataAndType.getInstance().get()

    return {
      status: ResponseCode.Success,
      result: skip,
    }
  }
}
