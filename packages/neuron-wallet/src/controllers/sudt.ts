import LiveCellService from "services/live-cell-service";
import env from 'env'
import Script, {ScriptHashType} from "models/chain/script";
import parseSUDTTokenInfo from "utils/parse_sudt_token_info";
import {ResponseCode} from "utils/const";
import {SudtTokenInfo} from "models/chain/transaction";

export default class SUDTController {

  public async getSUDTTokenInfo(params: { tokenID: string }): Promise<Controller.Response<SudtTokenInfo>> {
    let codeHash = process.env.TESTNET_SUDT_INFO_SCRIPT_CODEHASH!
    if (!env.isTestMode) {
      codeHash = process.env.MAINNET_SUDT_INFO_SCRIPT_CODEHASH!
    }
    const typeScript = Script.fromObject({codeHash: codeHash, args: params.tokenID, hashType: ScriptHashType.Type})
    const liveCell = await LiveCellService.getInstance().getOneByLockScriptAndTypeScript(null, typeScript)
    if (liveCell == undefined) {
      return {
        status: ResponseCode.Fail,
      }
    }
    const {decimal, name, symbol} = parseSUDTTokenInfo(liveCell.data)
    return {
      status: ResponseCode.Success,
      result: {tokenID: params.tokenID, symbol: symbol, tokenName: name, decimal: decimal},
    }
  }
}

