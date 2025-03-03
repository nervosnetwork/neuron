import LiveCellService from '../services/live-cell-service'
import AssetAccountInfo from '../models/asset-account-info'
import Script, { ScriptHashType } from '../models/chain/script'
import parseSUDTTokenInfo from '../utils/parse_sudt_token_info'
import { ResponseCode, UDTType } from '../utils/const'
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
      result: { tokenID: params.tokenID, symbol: symbol, tokenName: name, decimal: decimal, udtType: UDTType.SUDT },
    }
  }

  // outpoint
  public async getUDTTokenInfoAndBalance(params: {
    tokenID: string
    holder: string
    outpoint?: CKBComponents.OutPoint
  }): Promise<Controller.Response<SudtTokenInfo & { balance: string; capacity: string }>> {
    const { tokenID, holder, outpoint } = params
    const info = await this.getSUDTTokenInfo({ tokenID })
    if (!info.result) {
      return {
        status: ResponseCode.Fail,
      }
    }

    const balance = await AssetAccountService.calculateUDTAccountBalance(holder, tokenID, info.result.udtType, outpoint)
    const cells = await AssetAccountService.getACPCells(holder, tokenID, info.result.udtType, outpoint)

    let capacity = cells.reduce((a, b) => {
      return a + BigInt(b.capacity as string)
    }, BigInt(0))

    return {
      status: ResponseCode.Success,
      result: { ...info.result, balance: balance.toString(), capacity: capacity.toString() },
    }
  }
}
