import { utils } from '@ckb-lumos/lumos'
import LiveCellService from '../services/live-cell-service'
import AssetAccountInfo from '../models/asset-account-info'
import Script, { ScriptHashType } from '../models/chain/script'
import parseSUDTTokenInfo from '../utils/parse_sudt_token_info'
import { ResponseCode } from '../utils/const'
import { SudtTokenInfo } from '../models/chain/transaction'
import AssetAccountService from '../services/asset-account-service'

export default class SUDTController {
  public async getSUDTTokenInfo(params: { tokenID: string }): Promise<Controller.Response<SudtTokenInfo>> {
    const tokenList = await AssetAccountService.getTokenInfoList()
    const sudtInfo = tokenList.find(sudtInfo => sudtInfo.tokenID === params.tokenID)
    if (sudtInfo) {
      return {
        status: ResponseCode.Success,
        result: { ...sudtInfo, tokenID: params.tokenID },
      }
    }

    const typeScript = Script.fromObject({
      codeHash: new AssetAccountInfo().sudtInfoCodeHash,
      args: params.tokenID,
      hashType: ScriptHashType.Type,
    })
    const liveCell = await LiveCellService.getInstance().getOneByLockScriptAndTypeScript(null, typeScript)
    if (!liveCell) {
      return {
        status: ResponseCode.Fail,
      }
    }
    const { decimal, name, symbol } = parseSUDTTokenInfo(liveCell.data)
    return {
      status: ResponseCode.Success,
      result: { tokenID: params.tokenID, symbol: symbol, tokenName: name, decimal: decimal },
    }
  }

  public getSUDTTypeScriptHash(params: { tokenID: string }): Controller.Response<string> {
    const assetAcount = new AssetAccountInfo()
    const script = new Script(assetAcount.infos.sudt.codeHash, params.tokenID, assetAcount.infos.sudt.hashType)
    return {
      status: ResponseCode.Success,
      result: utils.computeScriptHash(script.toSDK()),
    }
  }
}
