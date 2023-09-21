import type { Agent as HttpsAgent } from 'node:https'
import type { Agent as HttpAgent } from 'node:http'

declare global {
  declare namespace CKBComponents {
    type DAO = string
    type Hash = string
    type Number = string
    type Hash256 = string
    type UInt32 = string
    type UInt64 = string
    type U256 = string
    type Index = string
    type Version = string
    type Count = string
    type Difficulty = string
    type BlockNumber = string
    type EpochInHeader = string
    type Capacity = string
    type ProposalShortId = string
    type Timestamp = string
    type Nonce = string
    type Cycles = string
    type Size = string
    type OutputsValidator = 'default' | 'passthrough' | undefined
    type RationalU256 = Record<'denom' | 'numer', string>
    type ProposalWindow = Record<'closest' | 'farthest', BlockNumber>
    type EpochNumberWithFraction = string
    type EpochNumber = string
    enum TransactionStatus {
      Pending = 'pending',
      Proposed = 'proposed',
      Committed = 'committed',
    }
    type ScriptHashType = api.HashType
    type DepType = 'code' | 'depGroup'
    type JsonBytes = string
    /**
     * @typedef Bytes, keep consistent with CKB
     * @description Bytes will be serialized to string
     * @see https://github.com/nervosnetwork/ckb/blob/develop/util/jsonrpc-types/src/blockchain.rs#L19
     */
    type Bytes = string
    type Since = string
    interface Node {
      url: string
      httpAgent?: HttpAgent
      httpsAgent?: HttpsAgent
    }
    interface Method {
      name: string
      method: string
      paramsFormatters: function[]
      resultFormatters?: function
    }
    /**
     * RPC Units
     */
    type Witness = Bytes
    type Script = api.Script
    type CellInput = api.Input
    type CellOutput = api.Output
    type Cell = CellOutput
    type OutPoint = api.OutPoint
    type CellDep = api.CellDep
    type RawTransaction = api.RawTransaction & {
      witnesses: Witness[]
    }
    type Transaction = Required<api.Transaction>
    type TransactionWithStatus = api.TransactionWithStatus
    type BlockHeader = api.Header
    type Block = api.Block
    type UncleBlock = api.UncleBlock
    type LiveCell = api.LiveCell
    type AlertMessage = api.AlertMessage
    type BlockchainInfo = api.ChainInfo
    type LocalNodeInfo = api.LocalNode
    type RemoteNodeInfo = api.RemoteNode
    type TxPoolInfo = api.TxPoolInfo
    type Epoch = api.Epoch
    type RunDryResult = api.DryRunResult
    type BannedAddress = api.BannedAddr
    type WitnessArgs = api.WitnessArgs
    type BlockEconomicState = api.BlockEconomicState
    type SyncState = api.SyncState
    type TransactionProof = api.TransactionProof
    type TxVerbosity = api.TxVerbosity
    type TxPoolVerbosity = api.TxPoolVerbosity
    type RawTxPool = api.RawTxPool
    type Consensus = api.Consensus
    type HardForks = api.HardForks
    type HardForkFeature = api.HardforkFeature
    type SoftForkStatus = api.SoftForkStatus
    type SoftFork = api.SoftFork
    type Buried = api.Buried
    type Rfc0043 = api.Rfc0043
    type Ratio = api.Ratio
    type Deployment = api.Deployment
    type QueryOptions = api.QueryOptions
    interface TransactionPoint {
      blockNumber: BlockNumber
      index: Index
      txHash: Hash256
    }
    interface TransactionByLockHash {
      consumedBy: undefined | TransactionPoint
      createdBy: TransactionPoint
    }
    type TransactionsByLockHash = TransactionByLockHash[]
    interface FeeRate {
      feeRate: string
    }
    interface CellIncludingOutPoint {
      blockHash: Hash256
      capacity: Capacity
      lock: Script
      outPoint: OutPoint
      cellbase: boolean
      outputDataLen: string
    }
    type TransactionTrace = {
      action: string
      info: string
      time: Timestamp
    }[]
    enum CellStatus {
      Live = 'live',
      Unknown = 'unknown',
    }
    interface LiveCellByLockHash {
      cellOutput: CellOutput
      createdBy: TransactionPoint
      cellbase: boolean
      outputDataLen: string
    }
    type LiveCellsByLockHash = LiveCellByLockHash[]
    interface PeersState {
      lastUpdated: string
      blocksInFlight: string
      peer: string
    }
    interface LockHashIndexState {
      blockHash: Hash256
      blockNumber: BlockNumber
      lockHash: Hash256
    }
    type LockHashIndexStates = LockHashIndexState[]
    type BannedAddresses = BannedAddress[]
    interface CellbaseOutputCapacityDetails {
      primary: string
      proposalReward: string
      secondary: string
      total: string
      txFee: string
    }
    interface RawTransactionToSign extends Omit<RawTransaction, 'witnesses'> {
      witnesses: (WitnessArgs | Witness)[]
    }
    interface CapacityByLockHash {
      blockNumber: BlockNumber
      capacity: Capacity
      cellsCount: string
    }
    type TxPoolIds = Record<'pending' | 'proposed', Array<Hash256>>
    interface Tip {
      blockNumber: BlockNumber
      blockHash: Hash256
    }
    type ScriptType = 'type' | 'lock'
    type Order = 'asc' | 'desc'
    type IOType = 'input' | 'output' | 'both'
    type ScriptSearchMode = 'prefix' | 'exact'
    interface IndexerCell {
      blockNumber: BlockNumber
      outPoint: OutPoint
      output: {
        capacity: Capacity
        lock: Script
        type?: Script
      }
      outputData: string
      txIndex: string
    }
    interface IndexerCellWithoutData extends Omit<IndexerCell, 'outputData'> {
      outputData: null
    }
    interface GetCellsResult<WithData extends boolean = true> {
      lastCursor: string
      objects: WithData extends true ? IndexerCell[] : IndexerCellWithoutData[]
    }
    type IndexerTransaction<Grouped extends boolean = false> = Grouped extends true
      ? GroupedIndexerTransaction
      : UngroupedIndexerTransaction
    type UngroupedIndexerTransaction = {
      txHash: Hash256
      blockNumber: BlockNumber
      ioIndex: number
      ioType: IOType
      txIndex: number
    }
    type GroupedIndexerTransaction = {
      txHash: Hash256
      blockNumber: BlockNumber
      txIndex: number
      cells: Array<[IOType, number]>
    }
    interface GetTransactionsResult<Grouped extends boolean = false> {
      lastCursor: Hash256
      objects: IndexerTransaction<Grouped>[]
    }
    interface CKBIndexerQueryOptions extends QueryOptions {
      outputDataLenRange?: HexadecimalRange
      outputCapacityRange?: HexadecimalRange
      scriptLenRange?: HexadecimalRange
      bufferSize?: number
      withData?: boolean
      groupByTransaction?: boolean
    }
    type HexadecimalRange = [string, string]
    interface SearchFilter {
      script?: Script
      scriptLenRange?: HexadecimalRange
      outputDataLenRange?: HexadecimalRange
      outputCapacityRange?: HexadecimalRange
      blockRange?: HexadecimalRange
    }
    interface SearchKey {
      script: Script
      scriptType: ScriptType
      filter?: SearchFilter
      scriptSearchMode?: ScriptSearchMode
    }
    interface GetLiveCellsResult<WithData extends boolean = true> {
      lastCursor: string
      objects: WithData extends true ? IndexerCell[] : IndexerCellWithoutData[]
    }
    interface GetCellsSearchKey<WithData extends boolean = boolean> extends SearchKey {
      withData?: WithData
    }
    interface GetTransactionsSearchKey<Group extends boolean = boolean> extends SearchKey {
      groupByTransaction?: Group
    }
    interface CellsCapacity {
      capacity: Capacity
      blockHash: Hash256
      blockNumber: BlockNumber
    }
    interface BlockFilter {
      data: api.HexString
      hash: api.Hash
    }
    interface TransactionAndWitnessProof {
      blockHash: Hash256
      transactionsProof: api.MerkleProof
      witnessesProof: api.MerkleProof
    }
    type TransactionView = api.Transaction & {
      hash: api.Hash
    }
    interface BlockView {
      header: BlockHeader
      uncles: UncleBlock[]
      transactions: TransactionView[]
      proposals: ProposalShortId[]
    }
    type SerializedBlock = api.HexString
    interface FeeRateStatistics {
      mean: UInt64
      median: UInt64
    }
    interface EstimateCycles {
      cycles: UInt64
    }
    type DeploymentPos = api.DeploymentPos
    type DeploymentState = api.DeploymentState
    type DeploymentInfo = api.DeploymentInfo
    type DeploymentsInfo = api.DeploymentsInfo
  }
  //# sourceMappingURL=api.d.ts.map
}
