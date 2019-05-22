import Key from '../keys/key'
import { ResponseCode } from '.'

export enum HelpersMethod {
  GenerateMnemonic = 'generateMnemonic',
}
class HelpersController {
  public static generateMnemonic = (): Controller.Response<string> => {
    const mnemonic = Key.generateMnemonic()
    if (mnemonic) {
      return {
        status: ResponseCode.Success,
        result: mnemonic,
      }
    }
    return {
      status: ResponseCode.Fail,
      result: 'Failed to generate mnemonic',
    }
  }
}

export default HelpersController
