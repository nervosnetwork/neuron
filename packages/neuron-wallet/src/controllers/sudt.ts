import LiveCellService from '../services/live-cell-service'
import AssetAccountInfo from '../models/asset-account-info'
import Script, { ScriptHashType } from '../models/chain/script'
import parseSUDTTokenInfo from '../utils/parse_sudt_token_info'
import { ResponseCode, UDTType, MIN_SUDT_CAPACITY } from '../utils/const'
import { SudtTokenInfo } from '../models/chain/transaction'
import SudtTokenInfoService from '../services/sudt-token-info'
import AssetAccountService from '../services/asset-account-service'

export default class SUDTController {
  public async getSUDTTokenInfo(params: { tokenID: string }): Promise<Controller.Response<SudtTokenInfo>> {
    const tokenList = await SudtTokenInfoService.getAllSudtTokenInfo()
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

  public async getUDTTokenInfoAndBalance(params: {
    tokenID: string
    holder: string
    udtType: UDTType
  }): Promise<Controller.Response<SudtTokenInfo & { balance: string; capacity: string }>> {
    const { tokenID, holder, udtType } = params
    const info = await this.getSUDTTokenInfo({ tokenID })
    if (!info.result) {
      return {
        status: ResponseCode.Fail,
      }
    }
    const balance = await AssetAccountService.calculateUDTAccountBalance(holder, tokenID, udtType)
    const ckbBalance = await AssetAccountService.calculateAvailableCKBBalance(holder)

    const capacity = BigInt(MIN_SUDT_CAPACITY) + BigInt(ckbBalance)

    return {
      status: ResponseCode.Success,
      result: { ...info.result, balance: balance.toString(), capacity: capacity.toString() },
    }
  }
}
