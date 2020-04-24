import AssetAccount from "models/asset-account"
import Transaction from "models/chain/transaction"
import AssetAccountService from "services/asset-account-service"
import { ServiceHasNoResponse } from "exceptions"
import { ResponseCode } from "utils/const"
import AddressService from "services/addresses"
import NetworksService from "services/networks"
import AddressGenerator from "models/address-generator"
import { AddressPrefix } from "@nervosnetwork/ckb-sdk-utils"
import AssetAccountInfo from "models/asset-account-info"

export interface GenerateCreateAssetAccountTxParams {
  walletID: string
  tokenID: string
  accountName: string
  tokenName: string
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
  accountName?: string,
  tokenName?: string,
  symbol?: string
  decimal?: string
}

export default class AssetAccountController {
  public async getAll(params: { walletID: string }): Promise<Controller.Response<(AssetAccount & { address: string })[]>> {
    const assetAccountInfo = new AssetAccountInfo()
    const blake160s = AddressService.allBlake160sByWalletId(params.walletID)
    const anyoneCanPayLockHashes: string[] = blake160s.map(b => assetAccountInfo.generateAnyoneCanPayScript(b).computeHash())

    const assetAccounts = await AssetAccountService.getAll(params.walletID, anyoneCanPayLockHashes)

    if (!assetAccounts) {
      throw new ServiceHasNoResponse('AssetAccount')
    }


    const addressPrefix = NetworksService.getInstance().isMainnet() ? AddressPrefix.Mainnet : AddressPrefix.Testnet

    const result = assetAccounts.map(aa => {
      return {
        ...aa,
        address: AddressGenerator.generate(
          assetAccountInfo.generateAnyoneCanPayScript(aa.blake160),
          addressPrefix,
        )
      }
    })

    return {
      status: ResponseCode.Success,
      result,
    }
  }

  public async getAccount(params: { walletID: string, id: number }): Promise<Controller.Response<AssetAccount & { address: string }>> {
    const account = await AssetAccountService.getAccount(params)

    if (!account) {
      throw new ServiceHasNoResponse('AssetAccount')
    }

    const assetAccountInfo = new AssetAccountInfo()
    const addressPrefix = NetworksService.getInstance().isMainnet() ? AddressPrefix.Mainnet : AddressPrefix.Testnet

    return {
      status: ResponseCode.Success,
      result: {
        ...account,
        address: AddressGenerator.generate(
          assetAccountInfo.generateAnyoneCanPayScript(account.blake160),
          addressPrefix,
        )
      }
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
      params.accountName,
      params.tokenName,
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
