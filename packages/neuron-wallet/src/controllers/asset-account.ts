import AssetAccount from "models/asset-account"
import Transaction from "models/chain/transaction"
import AssetAccountService from "services/asset-account-service"
import { ServiceHasNoResponse } from "exceptions"
import { ResponseCode } from "utils/const"
import AddressService from "services/addresses"
import NetworksService from "services/networks"
import AddressGenerator from "models/address-generator"
import { AddressPrefix } from "@nervosnetwork/ckb-sdk-utils"

export interface GenerateCreateAssetAccountTxParams {
  walletID: string
  tokenID: string
  fullName: string
  symbol: string
  decimal: string
  feeRate: string
  fee: string
}

export interface SendCreateAssetAccountTxParams {
  walletID: string
  assetAccount: AssetAccount
  tx: Transaction
  password: string
}

export interface UpdateAssetAccountParams {
  id: number
  fullName?: string,
  symbol?: string
  decimal?: string
}

export default class AssetAccountController {
  public async getAll(params: { walletID: string }): Promise<Controller.Response<(AssetAccount & { address: string })[]>> {
    const assetAccounts = await AssetAccountService.getAll(params.walletID)

    if (!assetAccounts) {
      throw new ServiceHasNoResponse('AssetAccount')
    }

    const addressPrefix = NetworksService.getInstance().isMainnet() ? AddressPrefix.Mainnet : AddressPrefix.Testnet

    const result = assetAccounts.map(aa => {
      return {
        ...aa,
        address: AddressGenerator.toShortByBlake160(aa.blake160, addressPrefix)
      }
    })

    return {
      status: ResponseCode.Success,
      result,
    }
  }

  public async generateCreateTx(params: GenerateCreateAssetAccountTxParams): Promise<Controller.Response<{
    assetAccount: AssetAccount,
    tx: Transaction
  }>> {
    const lockHashes: string[] = AddressService.allLockHashesByWalletId(params.walletID)
    const result = await AssetAccountService.generateCreateTx(
      params.walletID,
      lockHashes,
      params.tokenID,
      params.symbol,
      params.fullName,
      params.decimal,
      params.feeRate,
      params.fee
    )

    if (!result) {
      throw new ServiceHasNoResponse('AssetAccount')
    }

    return {
      status: ResponseCode.Success,
      result,
    }
  }

  public async sendCreateTx(params: SendCreateAssetAccountTxParams): Promise<Controller.Response<string>> {
    const tx = Transaction.fromObject(params.tx)
    const assetAccount = AssetAccount.fromObject(params.assetAccount)
    const txHash = await AssetAccountService.sendTx(params.walletID, assetAccount, tx, params.password)

    if (!txHash) {
      throw new ServiceHasNoResponse('AssetAccount')
    }

    return {
      status: ResponseCode.Success,
      result: txHash,
    }
  }

  public async update(params: UpdateAssetAccountParams) {
    await AssetAccountService.update(params.id, params)

    return {
      status: ResponseCode.Success,
      result: undefined,
    }
  }
}
