import { CatchControllerError } from 'decorators/errors'
import { ResponseCode } from 'utils/const'
import SkipDataAndType from 'services/skip-data-and-type'

export default class SkipDataAndTypeController {
  @CatchControllerError
  public static async update(open: boolean): Promise<Controller.Response<boolean>> {
    SkipDataAndType.getInstance().update(open)

    return {
      status: ResponseCode.Success,
      result: open,
    }
  }

  @CatchControllerError
  public static async get(): Promise<Controller.Response<boolean>> {
    const open = SkipDataAndType.getInstance().get()

    return {
      status: ResponseCode.Success,
      result: open,
    }
  }
}
