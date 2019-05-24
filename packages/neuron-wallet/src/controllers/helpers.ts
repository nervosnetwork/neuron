import Key from '../keys/key'
import { ResponseCode } from '.'
import { CatchControllerError } from '../utils/decorators'
import i18n from '../utils/i18n'

export enum HelpersMethod {
  GenerateMnemonic = 'generateMnemonic',
}

/**
 * @class HelpersController
 * @description handle messages from helpers channel
 */
class HelpersController {
  @CatchControllerError
  public static async generateMnemonic() {
    const mnemonic = Key.generateMnemonic()
    if (mnemonic) {
      return {
        status: ResponseCode.Success,
        result: mnemonic,
      }
    }
    throw new Error(i18n.t('messages.failed-to-create-mnemonic'))
  }
}

export default HelpersController
