import Key from '../keys/key'
import { Controller as ControllerDecorator, CatchControllerError } from '../decorators'
import { Channel, ResponseCode } from '../utils/const'
import { FailToCreateMnemonic } from '../exceptions'

/**
 * @class HelpersController
 * @description handle messages from helpers channel
 */
@ControllerDecorator(Channel.Helpers)
export default class HelpersController {
  @CatchControllerError
  public static async generateMnemonic() {
    const mnemonic = Key.generateMnemonic()
    if (mnemonic) {
      return {
        status: ResponseCode.Success,
        result: mnemonic,
      }
    }
    throw new FailToCreateMnemonic()
  }
}

/* eslint-disable */
declare global {
  module Controller {
    type HelpersMethod = Exclude<keyof typeof HelpersController, keyof typeof Object>
  }
}
/* eslint-enable */
