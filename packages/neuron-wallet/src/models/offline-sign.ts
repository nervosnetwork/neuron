import AssetAccount from "./asset-account";
import Transaction from "./chain/transaction";

export enum SignStatus {
  Signed = 'Signed',
  Unsigned = 'Unsigned',
  PartiallySigned = 'PartiallySigned'
}

export enum SignType {
  Regular = 'Regular',
  UnlockDAO = 'UnlockDAO',
  CreateSUDTAccount = 'CreateSUDTAccount',
  SendSUDT = 'SendSUDT'
}

interface MultisigConfigs {
  [hash: string]: {
    sighash_addresses: string[],
    require_first_n: number,
    threshold: number
  }
}

interface Signatures {
  [hash: string]: string[]
}

export interface OfflineSignProps {
  transaction: Transaction
  // for frond-end
  status: SignStatus
  type: SignType
  // for sudt
  assetAccount?: AssetAccount
  // for multisig
  multisig_configs?: MultisigConfigs
  signatures?: Signatures
}

export interface OfflineSignJSON {
  transaction: Transaction
  // for frond-end
  status: SignStatus
  type: SignType
  // for sudt
  asset_account?: AssetAccount
  // for multisig
  multisig_configs?: MultisigConfigs
  signatures?: Signatures
}

export default class OfflineSign implements OfflineSignProps {
  public transaction: Transaction
  public assetAccount?: AssetAccount
  public status: SignStatus
  public type: SignType

  constructor (transaction: Transaction, signType: SignType, status: SignStatus, assetAcount?: AssetAccount) {
    this.transaction = transaction
    this.assetAccount = assetAcount
    this.type = signType
    this.status = status
  }

  public toJSON (): OfflineSignJSON {
    const json: OfflineSignJSON = {
      transaction: this.transaction,
      type: this.type,
      status: this.status
    }

    if (this.assetAccount) {
      json.asset_account = this.assetAccount
    }

    return json
  }

  public static fromJSON ({ transaction, type: signType, asset_account: assetAcount, status }: OfflineSignJSON) {
    return new OfflineSign(transaction, signType, status, assetAcount)
  }

  public setStatus (status: SignStatus) {
    this.status = status
  }
}
