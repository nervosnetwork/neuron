import CellDep from './cell-dep'
import Input from './input'
import Output from './output'
import WitnessArgs from './witness-args'
import { BI } from '@ckb-lumos/bi'
import { serializeRawTransaction, serializeWitnessArgs } from '../../utils/serialization'
import BlockHeader from './block-header'
import TypeCheckerUtils from '../../utils/type-checker'
import OutPoint from './out-point'
import { Signatures } from '../../models/offline-sign'
import { utils } from '@ckb-lumos/base'

export enum TransactionStatus {
  Pending = 'pending',
  Success = 'success',
  Failed = 'failed',
}

export interface SudtTokenInfo {
  symbol: string
  tokenID: string
  tokenName: string
  decimal: string
}

export interface SudtInfo {
  sUDT?: SudtTokenInfo
  amount: string
}

export enum NFTType {
  Send = 'send',
  Receive = 'receive',
}

export interface NFTInfo {
  type: NFTType
  data: string
}

export enum AssetAccountType {
  CKB = 'CKB',
  SUDT = 'sUDT',
}

export default class Transaction {
  public version: string
  public cellDeps: CellDep[] = []
  public headerDeps: string[] = []
  public inputs: Input[] = []
  public outputs: Output[] = []
  public outputsData: string[]
  public witnesses: (WitnessArgs | string)[] = []

  public hash?: string

  public timestamp?: string
  public blockNumber?: string
  public blockHash?: string

  public value?: string
  public fee?: string
  public size?: number
  public interest?: string

  public type?: string
  public status?: TransactionStatus
  public description: string = '' // Default to ''

  public nervosDao: boolean = false // Default to false

  public createdAt?: string
  public updatedAt?: string

  public sudtInfo?: SudtInfo

  public anyoneCanPaySendAmount?: string

  public nftInfo?: NFTInfo

  public signatures: Signatures = {}
  public assetAccountType?: AssetAccountType

  constructor(
    version: string,
    cellDeps: CellDep[] = [],
    headerDeps: string[] = [],
    inputs: Input[] = [],
    outputs: Output[] = [],
    outputsData?: string[],
    witnesses: (WitnessArgs | string)[] = [],
    hash?: string,
    timestamp?: string,
    blockNumber?: string,
    blockHash?: string,
    value?: string,
    fee?: string,
    interest?: string,
    type?: string,
    status?: TransactionStatus,
    description: string = '', // Default to ''
    nervosDao: boolean = false, // Default to false
    createdAt?: string,
    updatedAt?: string,
    sudtInfo?: SudtInfo,
    nftType?: NFTInfo,
    signatures: Signatures = {},
    assetAccountType?: AssetAccountType
  ) {
    this.cellDeps = cellDeps
    this.headerDeps = headerDeps
    this.inputs = inputs
    this.outputs = outputs
    this.witnesses = witnesses
    this.hash = hash
    this.blockHash = blockHash
    this.type = type
    this.status = status
    this.description = description
    this.nervosDao = nervosDao
    this.assetAccountType = assetAccountType
    this.version = BigInt(version).toString()
    this.value = value ? BigInt(value).toString() : value
    this.fee = fee ? BigInt(fee).toString() : fee
    this.interest = interest ? BigInt(interest).toString() : interest
    this.blockNumber = blockNumber ? BigInt(blockNumber).toString() : blockNumber
    this.timestamp = timestamp ? BigInt(timestamp).toString() : timestamp
    this.createdAt = createdAt ? BigInt(createdAt).toString() : createdAt
    this.updatedAt = updatedAt ? BigInt(updatedAt).toString() : updatedAt
    this.outputsData = outputsData || this.outputs.map(o => o.data || '0x')

    this.sudtInfo = sudtInfo
    this.nftInfo = nftType
    this.signatures = signatures
    TypeCheckerUtils.hashChecker(...this.headerDeps, this.blockHash)
    TypeCheckerUtils.numberChecker(
      this.version,
      this.value,
      this.fee,
      this.interest,
      this.blockNumber,
      this.timestamp,
      this.createdAt,
      this.updatedAt
    )
  }

  public static fromObject({
    version,
    cellDeps,
    headerDeps,
    inputs,
    outputs,
    outputsData,
    witnesses,
    hash,
    timestamp,
    blockNumber,
    blockHash,
    value,
    fee,
    interest,
    type,
    status,
    description,
    nervosDao = false,
    createdAt,
    updatedAt,
    sudtInfo,
    nftInfo,
    signatures = {},
    assetAccountType,
  }: {
    version: string
    cellDeps?: CellDep[]
    headerDeps?: string[]
    inputs?: Input[]
    outputs?: Output[]
    outputsData?: string[]
    witnesses?: (WitnessArgs | string)[]
    hash?: string
    timestamp?: string
    blockNumber?: string
    blockHash?: string
    value?: string
    fee?: string
    interest?: string
    type?: string
    status?: TransactionStatus
    description?: string // Default to ''
    nervosDao?: boolean // Default to false
    createdAt?: string
    updatedAt?: string
    sudtInfo?: SudtInfo
    nftInfo?: NFTInfo
    signatures?: Signatures
    assetAccountType?: AssetAccountType
  }): Transaction {
    return new Transaction(
      version,
      (cellDeps || []).map(cd => CellDep.fromObject(cd)),
      headerDeps || [],
      (inputs || []).map(i => Input.fromObject(i)),
      (outputs || []).map(o => Output.fromObject(o)),
      outputsData,
      (witnesses || []).map(wit => {
        if (typeof wit === 'string') {
          return wit
        }
        return WitnessArgs.fromObject(wit)
      }),
      hash,
      timestamp,
      blockNumber,
      blockHash,
      value,
      fee,
      interest,
      type,
      status,
      description || '',
      nervosDao || false,
      createdAt,
      updatedAt,
      sudtInfo,
      nftInfo,
      signatures,
      assetAccountType
    )
  }

  public setValue(v: string | undefined) {
    this.value = v ? BigInt(v).toString() : v
  }

  public setFee(value: string | undefined) {
    this.fee = value ? BigInt(value).toString() : value
  }

  public setInterest(value: string | undefined) {
    this.interest = value ? BigInt(value).toString() : value
  }

  public setSignatures(lockHash: string, blake160: string) {
    if (this.signatures[lockHash]) {
      this.signatures[lockHash].push(blake160)
    } else {
      this.signatures[lockHash] = [blake160]
    }
  }

  public witnessesAsString(): string[] {
    return this.witnesses.map(wit => {
      if (typeof wit === 'string') {
        return wit
      }
      return serializeWitnessArgs(wit.toSDK())
    })
  }

  public setBlockHeader(blockHeader: BlockHeader) {
    this.timestamp = blockHeader.timestamp
    this.blockHash = blockHeader.hash
    this.blockNumber = blockHeader.number
  }

  public addOutput(output: Output) {
    this.outputs.push(output)
    this.outputsData.push(output.data || '0x')
  }

  public computeHash(): string {
    return utils.ckbHash(serializeRawTransaction(this.toSDKRawTransaction()))
  }

  public toSDKRawTransaction(): CKBComponents.RawTransaction {
    return {
      version: BI.from(this.version).toHexString(),
      inputs: this.inputs.map(i => i.toSDK()),
      outputs: this.outputs.map(o => o.toSDK()),
      cellDeps: this.cellDeps.map(cd => cd.toSDK()),
      headerDeps: this.headerDeps,
      outputsData: this.outputsData,
      witnesses: this.witnessesAsString(),
    }
  }

  // if no hash set, will compute one
  public toSDK(): CKBComponents.Transaction {
    const hash = this.hash || this.computeHash()
    return {
      ...this.toSDKRawTransaction(),
      hash,
    }
  }

  public static fromSDK(
    tx: CKBComponents.RawTransaction | CKBComponents.Transaction,
    blockHeader?: BlockHeader
  ): Transaction {
    const txHash: string | undefined = (tx as CKBComponents.Transaction).hash
    const outputs = tx.outputs.map((o: CKBComponents.CellOutput, i: number) => {
      const output = Output.fromSDK(o)
      if (txHash) {
        output.setOutPoint(new OutPoint(txHash, i.toString()))
      }
      return output
    })
    return new Transaction(
      tx.version,
      tx.cellDeps.map((cd: CKBComponents.CellDep) => CellDep.fromSDK(cd)),
      tx.headerDeps,
      tx.inputs.map((i: CKBComponents.CellInput) => Input.fromSDK(i)),
      outputs,
      tx.outputsData,
      tx.witnesses,
      txHash,
      blockHeader?.timestamp,
      blockHeader?.number,
      blockHeader?.hash
    )
  }
}
