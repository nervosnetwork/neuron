import LiveCellService from "services/live-cell-service";
import env from 'env'
import Script, {ScriptHashType} from "models/chain/script";
import parseSUDTTokenInfo from "utils/parse_sudt_token_info";
import {ResponseCode} from "utils/const";

export interface TokenInfo {
  tokenId: string
  symbol: string
  tokenName: string
  decimal: string
}

export default class SUDTController {
  private liveCellService = new LiveCellService()

  public async getSUDTTokenInfo(params: { tokenId: string }): Promise<Controller.Response<TokenInfo>> {
    let codeHash = process.env.TESTNET_SUDT_INFO_SCRIPT_CODEHASH!
    if (!env.isTestMode) {
      codeHash = process.env.MAINNET_SUDT_INFO_SCRIPT_CODEHASH!
    }
    const typeScript = Script.fromObject({codeHash: codeHash, args: params.tokenId, hashType: ScriptHashType.Type})
    const liveCell = await this.liveCellService.getOneByLockScriptAndTypeScript(null, typeScript)
    if (liveCell == undefined) {
      return {
        status: ResponseCode.Fail,
      }
    }
    const {decimal, name, symbol} = parseSUDTTokenInfo(liveCell.data)
    return {
      status: ResponseCode.Success,
      result: {tokenId: params.tokenId, symbol: symbol, tokenName: name, decimal: decimal},
    }
  }
}

