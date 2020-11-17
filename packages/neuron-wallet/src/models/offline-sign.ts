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
  status: SignStatus
  type: SignType
  context: RPC.RawTransaction[]
  description?: string
  assetAccount?: AssetAccount
  multisig_configs?: MultisigConfigs
  signatures?: Signatures
}

export interface OfflineSignJSON {
  transaction: Transaction
  status: SignStatus
  type: SignType
  context: RPC.RawTransaction[]
  description?: string
  asset_account?: AssetAccount
  multisig_configs?: MultisigConfigs
  signatures?: Signatures
}

export default class OfflineSign implements OfflineSignProps {
  public transaction: Transaction
  public assetAccount?: AssetAccount
  public status: SignStatus
  public type: SignType
  public context: RPC.RawTransaction[]
  public description: string

  constructor(
    transaction: Transaction,
    signType: SignType,
    status: SignStatus,
    context: RPC.RawTransaction[],
    assetAcount?: AssetAccount,
    description: string = ''
  ) {
    this.transaction = transaction
    this.assetAccount = assetAcount
    this.type = signType
    this.status = status
    this.context = context
    this.description = description
  }

  public toJSON(): OfflineSignJSON {
    const json: OfflineSignJSON = {
      transaction: this.transaction,
      type: this.type,
      status: this.status,
      context: this.context
    }

    if (this.assetAccount) {
      json.asset_account = this.assetAccount
    }

    if (this.description) {
      json.description = this.description
    }

    return json
  }

  public static fromJSON({
    transaction,
    type: signType,
    asset_account: assetAcount,
    status,
    context,
    description
  }: OfflineSignJSON) {
    return new OfflineSign(transaction, signType, status, context, assetAcount, description)
  }

  public setStatus(status: SignStatus) {
    this.status = status
  }
}
