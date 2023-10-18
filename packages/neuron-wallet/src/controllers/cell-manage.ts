import { outPointTransformer } from '../database/chain/entities/cell-local-info'
import Output from '../models/chain/output'
import CellsService, { LockScriptCategory, TypeScriptCategory } from '../services/cells'
import WalletService from '../services/wallets'
import CellLocalInfoService from '../services/cell-local-info'
import { AddressNotFound, CurrentWalletNotSet } from '../exceptions'
import AddressService from '../services/addresses'
import { scriptToAddress } from '../utils/scriptAndAddress'
import SignMessage from '../services/sign-message'
import NetworksService from '../services/networks'

export default class CellManage {
  static async getLiveCells() {
    const currentWallet = WalletService.getInstance().getCurrent()
    if (!currentWallet) throw new CurrentWalletNotSet()
    const liveCells = await CellsService.getLiveCells(currentWallet.id)
    const outPoints = liveCells
      .filter((v): v is Output & { outPoint: CKBComponents.OutPoint } => !!v.outPoint)
      .map(v => v.outPoint)
    const cellLocalInfoMap = await CellLocalInfoService.getCellLocalInfoMap(outPoints)
    return liveCells
      .map<
        Pick<Output, 'capacity' | 'outPoint' | 'lock' | 'type' | 'timestamp'> & {
          lockScriptType: LockScriptCategory
          typeScriptType?: TypeScriptCategory
          description?: string
          locked?: boolean
        }
      >(v => {
        const result = {
          capacity: v.capacity,
          outPoint: v.outPoint,
          lock: v.lock,
          type: v.type,
          data: v.data,
          timestamp: v.timestamp,
          lockScriptType: CellsService.getCellLockType(v),
          typeScriptType: CellsService.getCellTypeType(v),
        }
        if (!v.outPoint) {
          return result
        }
        const outPointKey = outPointTransformer.to(v.outPoint)
        return {
          ...result,
          description: cellLocalInfoMap[outPointKey]?.description,
          locked: cellLocalInfoMap[outPointKey]?.locked,
        }
      })
      .sort((a, b) => +(b.timestamp ?? 0) - +(a.timestamp ?? 0))
  }

  static updateLiveCellLocalInfo(outPoint: CKBComponents.OutPoint, locked?: boolean, description?: string) {
    return CellLocalInfoService.saveCellLocalInfo(outPoint, locked, description)
  }

  static async updateLiveCellsLockStatus(
    outPoints: CKBComponents.OutPoint[],
    locked: boolean,
    lockScripts: CKBComponents.Script[],
    password: string
  ) {
    // check wallet password
    const currentWallet = WalletService.getInstance().getCurrent()
    if (!currentWallet) throw new CurrentWalletNotSet()
    const addresses = new Set((await AddressService.getAddressesByWalletId(currentWallet.id)).map(v => v.address))
    const isMainnet = NetworksService.getInstance().isMainnet()
    if (!lockScripts.every(v => addresses.has(scriptToAddress(v, isMainnet)))) throw new AddressNotFound()
    await SignMessage.sign(currentWallet.id, scriptToAddress(lockScripts[0], isMainnet), password, 'verify password')
    return CellLocalInfoService.updateLiveCellLockStatus(outPoints, locked)
  }

  static async getLockedBalance() {
    const currentWallet = WalletService.getInstance().getCurrent()
    if (!currentWallet) throw new CurrentWalletNotSet()
    const lockedCells = await CellLocalInfoService.getLockedCells(currentWallet.id)
    let lockedBalance = BigInt(0)
    lockedCells.forEach(v => {
      lockedBalance += BigInt(v.capacity)
    })
    return lockedBalance.toString()
  }
}
