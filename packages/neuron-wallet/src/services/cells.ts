import { getConnection, In } from 'typeorm'
import { scriptToAddress } from '@nervosnetwork/ckb-sdk-utils'
import { CapacityNotEnough, CapacityNotEnoughForChange, LiveCapacityNotEnough } from 'exceptions'
import FeeMode from 'models/fee-mode'
import OutputEntity from 'database/chain/entities/output'
import InputEntity from 'database/chain/entities/input'
import TransactionEntity from 'database/chain/entities/transaction'
import TransactionSize from 'models/transaction-size'
import TransactionFee from 'models/transaction-fee'
import Cell, { OutputStatus } from 'models/chain/output'
import { TransactionStatus } from 'models/chain/transaction'
import OutPoint from 'models/chain/out-point'
import Input from 'models/chain/input'
import WitnessArgs from 'models/chain/witness-args'
import MultiSign from 'models/multi-sign'
import BufferUtils from 'utils/buffer'
import LiveCell from 'models/chain/live-cell'
import Output from 'models/chain/output'
import SystemScriptInfo from 'models/system-script-info'
import Script, { ScriptHashType } from 'models/chain/script'
import LiveCellService from './live-cell-service'
import AssetAccountInfo from 'models/asset-account-info'
import NFT from 'models/nft'

export const MIN_CELL_CAPACITY = '6100000000'

export interface PaginationResult<T = any> {
  totalCount: number
  items: T[]
}

export enum CustomizedLock {
  SingleMultiSign = 'SingleMultiSign',
  Cheque = 'Cheque'
}

export enum CustomizedType {
  NFT = 'NFT',
  NFTClass = 'NFTClass',
  NFTIssuer = 'NFTIssuer',
  Unknown = 'Unknown'
}

export default class CellsService {
  private static ANYONE_CAN_PAY_CKB_CELL_MIN = BigInt(61 * 10 ** 8)
  private static ANYONE_CAN_PAY_SUDT_CELL_MIN = BigInt(142 * 10 ** 8)

  public static async getBalancesByWalletId(
    walletId: string
  ): Promise<{
    liveBalances: Map<string, string>
    sentBalances: Map<string, string>
    pendingBalances: Map<string, string>
  }> {
    const cells: {
      status: string
      lockHash: string
      sumOfCapacity: string
      txCount: number
    }[] = await getConnection().getRepository(OutputEntity).manager.query(`
        select
            CAST(SUM(CAST(output.capacity AS UNSIGNED BIG INT)) AS VARCHAR) as sumOfCapacity,
            lockHash,
            lockArgs,
            status
        from
            output
        where
            output.lockArgs in (
                select
                    publicKeyInBlake160
                from
                    hd_public_key_info
                where
                    walletId = '${walletId}'
            ) AND
            output.hasData = false AND
            output.typeHash is null
        group by output.lockHash, output.status
      `)

    const liveBalances = new Map<string, string>()
    const sentBalances = new Map<string, string>()
    const pendingBalances = new Map<string, string>()

    cells.forEach(c => {
      const lockHash: string = c.lockHash

      const sumOfCapacity: string = c.sumOfCapacity
      if (c.status === OutputStatus.Live) {
        liveBalances.set(lockHash, sumOfCapacity)
      } else if (c.status === OutputStatus.Sent) {
        sentBalances.set(lockHash, sumOfCapacity)
      } else if (c.status === OutputStatus.Pending) {
        pendingBalances.set(lockHash, sumOfCapacity)
      }
    })

    return {
      liveBalances,
      sentBalances,
      pendingBalances
    }
  }

  public static async usedByAnyoneCanPayBlake160s(
    anyoneCanPayLockHashes: string[],
    blake160s: string[]
  ): Promise<string[]> {
    const blake160Set = new Set(blake160s)
    const liveCells = await getConnection()
      .getRepository(OutputEntity)
      .createQueryBuilder('output')
      .where({
        lockHash: In(anyoneCanPayLockHashes)
      })
      .getMany()

    const lockArgs = liveCells.filter(c => blake160Set.has(c.lockArgs)).map(c => c.lockArgs)

    const uniqueLockArgs = [...new Set(lockArgs)]
    return uniqueLockArgs
  }

  public static async getDaoCells(walletId: string): Promise<Cell[]> {
    const outputs: OutputEntity[] = await getConnection()
      .getRepository(OutputEntity)
      .createQueryBuilder('output')
      .leftJoinAndSelect('output.transaction', 'tx')
      .where(
        `
        output.daoData IS NOT NULL AND
        (
          output.status = :liveStatus OR
          output.status = :sentStatus OR
          tx.status = :failedStatus OR
          (
            (
              output.status = :deadStatus OR
              output.status = :pendingStatus
            ) AND
            output.depositTxHash is not null
          )
        ) AND
        output.lockArgs in (
          SELECT publicKeyInBlake160
          FROM hd_public_key_info
          WHERE walletId = :walletId
        )`,
        {
          walletId,
          liveStatus: OutputStatus.Live,
          sentStatus: OutputStatus.Sent,
          failedStatus: TransactionStatus.Failed,
          deadStatus: OutputStatus.Dead,
          pendingStatus: OutputStatus.Pending
        }
      )
      .orderBy(`CASE output.daoData WHEN '0x0000000000000000' THEN 1 ELSE 0 END`, 'ASC')
      .addOrderBy('tx.timestamp', 'ASC')
      .getMany()

    // find deposit info
    const depositTxHashes = outputs.map(output => output.depositTxHash).filter(hash => !!hash)
    const depositTxs = await getConnection()
      .getRepository(TransactionEntity)
      .createQueryBuilder('tx')
      .where({
        hash: In(depositTxHashes)
      })
      .getMany()
    const depositTxMap = new Map<string, TransactionEntity>()
    depositTxs.forEach(tx => {
      depositTxMap.set(tx.hash, tx)
    })

    // find unlock info
    const unlockTxKeys: string[] = outputs.map(o => o.outPointTxHash + ':' + o.outPointIndex)
    const inputs: InputEntity[] = await getConnection()
      .getRepository(InputEntity)
      .createQueryBuilder('input')
      .leftJoinAndSelect('input.transaction', 'tx')
      .where(`input.outPointTxHash || ':' || input.outPointIndex IN (:...infos)`, {
        infos: unlockTxKeys
      })
      .getMany()
    const unlockTxMap = new Map<string, TransactionEntity>()
    inputs.forEach(i => {
      const key = i.outPointTxHash + ':' + i.outPointIndex
      unlockTxMap.set(key, i.transaction!)
    })

    const cells: Cell[] = outputs.map(output => {
      const cell = output.toModel()
      if (!output.depositTxHash) {
        // if deposit cell, set depositInfo
        cell.setDepositInfo({
          txHash: output.transaction!.hash,
          timestamp: output.transaction!.timestamp!
        })
      } else {
        // if not deposit cell, set deposit timestamp info, depositInfo, withdrawInfo
        const depositTx = depositTxMap.get(output.depositTxHash)!
        cell.setDepositTimestamp(depositTx.timestamp!)

        cell.setDepositInfo({
          txHash: depositTx.hash,
          timestamp: depositTx.timestamp!
        })

        const withdrawTx = output.transaction
        cell.setWithdrawInfo({
          txHash: withdrawTx!.hash,
          timestamp: withdrawTx!.timestamp!
        })

        if (output.status === OutputStatus.Dead || output.status === OutputStatus.Pending) {
          // if unlocked, set unlockInfo
          const key = output.outPointTxHash + ':' + output.outPointIndex
          const unlockTx = unlockTxMap.get(key)!
          cell.setUnlockInfo({
            txHash: unlockTx.hash,
            timestamp: unlockTx.timestamp!
          })
        }
      }

      return cell
    })

    return cells
  }

  public static async getCustomizedAssetCells(
    blake160s: string[],
    pageNo: number,
    pageSize: number
  ): Promise<PaginationResult<Cell>> {
    const blake160Hashes = new Set(blake160s)
    const multiSign = new MultiSign()
    const multiSignHashes = new Set(blake160s.map(blake160 => multiSign.hash(blake160)))
    const assetAccountInfo = new AssetAccountInfo()
    const chequeLockCodeHash = assetAccountInfo.getChequeInfo().codeHash
    const nftIssuerCodehash = assetAccountInfo.getNftIssuerInfo().codeHash
    const nftClassCodehash = assetAccountInfo.getNftClassInfo().codeHash
    const nftCodehash = assetAccountInfo.getNftInfo().codeHash
    const acpCodehash = assetAccountInfo.getAcpCodeHash()
    const sudtCodehash = assetAccountInfo.getSudtCodeHash()
    const secp256k1LockHashes = [...blake160Hashes].map(blake160 =>
      SystemScriptInfo.generateSecpScript(blake160).computeHash()
    )

    const skip = (pageNo - 1) * pageSize

    const allMutiSignOutputs = await getConnection()
      .getRepository(OutputEntity)
      .createQueryBuilder('output')
      .leftJoinAndSelect('output.transaction', 'tx')
      .where(
        `
        output.status = :liveStatus AND
        (
          (
            output.hasData = 0 AND
            output.typeHash IS NULL AND
            output.lockCodeHash = :multiSignlockCodeHash
          )
          OR
          (
            output.hasData = 1 AND
            output.typeHash IS NOT NULL AND
            output.lockCodeHash = :chequeLockCodeHash
          )
          OR
          (
            output.hasData = 1 AND
            output.typeCodeHash = :nftIssuerCodehash
          )
          OR
          (
            output.hasData = 1 AND
            output.typeCodeHash = :nftClassCodehash
          )
          OR
          (
            output.hasData = 1 AND
            output.typeCodeHash = :nftCodehash
          )
          OR
          (
            output.hasData = 1 AND
            output.typeHash IS NOT NULL AND
            output.daoData IS NULL
          )
        )
      `,
        {
          liveStatus: OutputStatus.Live,
          multiSignlockCodeHash: SystemScriptInfo.MULTI_SIGN_CODE_HASH,
          chequeLockCodeHash,
          nftIssuerCodehash,
          nftClassCodehash,
          nftCodehash
        }
      )
      .orderBy('tx.timestamp', 'ASC')
      .getMany()

    const matchedOutputs = allMutiSignOutputs.filter(o => {
      if (o.multiSignBlake160) {
        return multiSignHashes.has(o.multiSignBlake160)
      }
      if (o.lockCodeHash === chequeLockCodeHash) {
        const receiverLockHash = o.lockArgs.slice(0, 42)
        const senderLockHash = o.lockArgs.slice(42)
        return (
          secp256k1LockHashes.find(hash => hash.includes(receiverLockHash)) ||
          secp256k1LockHashes.find(hash => hash.includes(senderLockHash))
        )
      }

      if (o.hasData && o.typeCodeHash === sudtCodehash && o.lockCodeHash === acpCodehash) {
        return false
      }

      if (
        o.typeCodeHash === nftIssuerCodehash ||
        o.typeCodeHash === nftClassCodehash ||
        o.typeCodeHash === nftCodehash ||
        (o.typeCodeHash != null && o.hasData)
      ) {
        return blake160Hashes.has(o.lockArgs)
      }
    })

    const totalCount = matchedOutputs.length

    const cells: Cell[] = matchedOutputs.slice(skip, pageNo * pageSize).map(o => {
      const cell = o.toModel()
      if (o.typeCodeHash === nftIssuerCodehash) {
        cell.setCustomizedAssetInfo({
          lock: '',
          type: CustomizedType.NFTIssuer,
          data: ''
        })
      } else if (o.typeCodeHash === nftClassCodehash) {
        cell.setCustomizedAssetInfo({
          lock: '',
          type: CustomizedType.NFTClass,
          data: ''
        })
      } else if (o.typeCodeHash === nftCodehash) {
        const isTransferable = NFT.fromString(o.data).isTransferable()
        cell.setCustomizedAssetInfo({
          lock: '',
          type: CustomizedType.NFT,
          data: isTransferable ? 'transferable' : ''
        })
      } else if (o.lockCodeHash === chequeLockCodeHash) {
        const receiverLockHash = o.lockArgs.slice(0, 42)
        if (secp256k1LockHashes.find(hash => hash.includes(receiverLockHash))) {
          cell.setCustomizedAssetInfo({
            lock: CustomizedLock.Cheque,
            type: '',
            data: 'claimable'
          })
        } else {
          cell.setCustomizedAssetInfo({
            lock: CustomizedLock.Cheque,
            type: '',
            data: 'withdraw-able'
          })
        }
      } else if (o.lockCodeHash === SystemScriptInfo.MULTI_SIGN_CODE_HASH) {
        cell.setCustomizedAssetInfo({
          lock: CustomizedLock.SingleMultiSign,
          type: '',
          data: ''
        })
      } else {
        cell.setCustomizedAssetInfo({
          lock: '',
          type: CustomizedType.Unknown,
          data: ''
        })
      }
      return cell
    })

    return {
      totalCount: totalCount,
      items: cells
    }
  }

  public static getLiveCell = async (outPoint: OutPoint): Promise<Cell | undefined> => {
    const cellEntity: OutputEntity | undefined = await CellsService.getLiveCellEntity(outPoint)

    if (!cellEntity) {
      return undefined
    }

    return cellEntity.toModel()
  }

  private static getLiveCellEntity = async (outPoint: OutPoint): Promise<OutputEntity | undefined> => {
    const cellEntity: OutputEntity | undefined = await getConnection()
      .getRepository(OutputEntity)
      .findOne({
        outPointTxHash: outPoint.txHash,
        outPointIndex: outPoint.index,
        status: 'live'
      })

    return cellEntity
  }

  // gather inputs for generateTx
  public static gatherInputs = async (
    capacity: string,
    walletId: string,
    fee: string = '0',
    feeRate: string = '0',
    baseSize: number = 0,
    changeOutputSize: number = 0,
    changeOutputDataSize: number = 0,
    append?: {
      input: Input
      witness: WitnessArgs
    },
    lockClass: {
      codeHash: string
      hashType: ScriptHashType.Type
    } = { codeHash: SystemScriptInfo.SECP_CODE_HASH, hashType: ScriptHashType.Type }
  ): Promise<{
    inputs: Input[]
    capacities: string
    finalFee: string
    hasChangeOutput: boolean
  }> => {
    const capacityInt = BigInt(capacity)
    const feeInt = BigInt(fee)
    const feeRateInt = BigInt(feeRate)
    let needFee = BigInt(0)
    const changeOutputFee: bigint = TransactionFee.fee(changeOutputSize + changeOutputDataSize, feeRateInt)

    const mode = new FeeMode(feeRateInt)

    // use min secp size (without data)
    const minChangeCapacity = BigInt(MIN_CELL_CAPACITY)

    // only live cells, skip which has data or type
    const cellEntities: OutputEntity[] = await getConnection()
      .getRepository(OutputEntity)
      .createQueryBuilder('output')
      .where(
        `
        output.status IN (:...statuses) AND
        hasData = false AND
        typeHash is null AND
        output.lockArgs in (
          SELECT publicKeyInBlake160
          FROM hd_public_key_info
          WHERE walletId = :walletId
        ) AND
        output.lockCodeHash = :lockCodeHash AND
        output.lockHashType = :lockHashType
        `,
        {
          walletId,
          statuses: [OutputStatus.Live, OutputStatus.Sent],
          lockCodeHash: lockClass.codeHash,
          lockHashType: lockClass.hashType
        }
      )
      .getMany()

    const liveCells = cellEntities.filter(c => c.status === OutputStatus.Live)
    const sentBalance: bigint = cellEntities
      .filter(c => c.status === OutputStatus.Sent)
      .map(c => BigInt(c.capacity))
      .reduce((result, c) => result + c, BigInt(0))

    if (
      liveCells.length === 0 &&
      sentBalance === BigInt(0) &&
      ((mode.isFeeRateMode() && feeRateInt !== BigInt(0)) || (mode.isFeeMode() && feeInt !== BigInt(0)))
    ) {
      throw new CapacityNotEnough()
    }
    liveCells.sort((a, b) => {
      const result = BigInt(a.capacity) - BigInt(b.capacity)
      if (result > BigInt(0)) {
        return 1
      }
      if (result === BigInt(0)) {
        return 0
      }
      return -1
    })

    const inputs: Input[] = []
    let inputCapacities: bigint = BigInt(0)
    let totalSize: number = baseSize
    if (append) {
      inputs.push(append.input)
      totalSize += TransactionSize.input()
      totalSize += TransactionSize.witness(append.witness)
    }
    let hasChangeOutput: boolean = false
    liveCells.every(cell => {
      const input: Input = new Input(cell.outPoint(), '0', cell.capacity, cell.lockScript(), cell.lockHash)
      if (inputs.find(el => el.lockHash === cell.lockHash!)) {
        totalSize += TransactionSize.emptyWitness()
      } else {
        totalSize += TransactionSize.secpLockWitness()
      }
      inputs.push(input)
      inputCapacities += BigInt(cell.capacity)
      totalSize += TransactionSize.input()

      if (mode.isFeeRateMode()) {
        needFee = TransactionFee.fee(totalSize, feeRateInt)
        const diff = inputCapacities - capacityInt - needFee
        if (diff === BigInt(0)) {
          hasChangeOutput = false
          return false
        } else if (diff - changeOutputFee >= minChangeCapacity) {
          needFee += changeOutputFee
          hasChangeOutput = true
          return false
        }
        return true
      } else {
        const diff = inputCapacities - capacityInt - feeInt
        if (diff === BigInt(0)) {
          hasChangeOutput = false
          return false
        } else if (diff >= minChangeCapacity) {
          hasChangeOutput = true
          return false
        }
        return true
      }
    })

    // The final fee need in this tx (shannon)
    const finalFee: bigint = mode.isFeeRateMode() ? needFee : feeInt

    const totalCapacities = capacityInt + finalFee

    if (inputCapacities < totalCapacities) {
      if (inputCapacities + sentBalance >= totalCapacities) {
        throw new LiveCapacityNotEnough()
      }
      throw new CapacityNotEnough()
    }

    const diffCapacities = inputCapacities - totalCapacities
    if (!hasChangeOutput && diffCapacities !== BigInt(0)) {
      if (diffCapacities + sentBalance >= minChangeCapacity + changeOutputFee) {
        throw new LiveCapacityNotEnough()
      }
      throw new CapacityNotEnoughForChange()
    }

    return {
      inputs,
      capacities: inputCapacities.toString(),
      finalFee: finalFee.toString(),
      hasChangeOutput
    }
  }

  public static gatherAllInputs = async (
    walletId: string,
    lockClass: {
      codeHash: string
      hashType: ScriptHashType.Type
    } = { codeHash: SystemScriptInfo.SECP_CODE_HASH, hashType: ScriptHashType.Type }
  ): Promise<Input[]> => {
    const cellEntities: OutputEntity[] = await getConnection()
      .getRepository(OutputEntity)
      .createQueryBuilder('output')
      .where(
        `
        output.status IN (:...statuses) AND
        hasData = false AND
        typeHash is null AND
        output.lockArgs in (
          SELECT publicKeyInBlake160
          FROM hd_public_key_info
          WHERE walletId = :walletId
        ) AND
        output.lockCodeHash = :lockCodeHash AND
        output.lockHashType = :lockHashType
        `,
        {
          walletId,
          statuses: [OutputStatus.Live],
          lockCodeHash: lockClass.codeHash,
          lockHashType: lockClass.hashType
        }
      )
      .getMany()

    const inputs: Input[] = cellEntities.map(cell => {
      return new Input(cell.outPoint(), '0', cell.capacity, cell.lockScript(), cell.lockHash)
    })

    return inputs
  }

  public static async gatherAnyoneCanPayCKBInputs(
    capacity: 'all' | string,
    walletId: string,
    anyoneCanPayLocks: Script[],
    changeBlake160: string,
    fee: string = '0',
    feeRate: string = '0',
    baseSize: number = 0,
    changeOutputSize: number = 0,
    changeOutputDataSize: number = 0
  ) {
    const feeInt = BigInt(fee)
    const feeRateInt = BigInt(feeRate)
    const mode = new FeeMode(feeRateInt)

    let needFee = BigInt(0)

    // only live cells, skip which has data or type
    const liveCellService = LiveCellService.getInstance()
    const allAnyoneCanPayLockLiveCells = await liveCellService.getManyByLockScriptsAndTypeScript(
      anyoneCanPayLocks,
      null
    )
    const anyoneCanPayLockLiveCells = allAnyoneCanPayLockLiveCells.filter(cell => cell.data === '0x')

    const allCapacity: bigint = anyoneCanPayLockLiveCells
      .map(c => BigInt(c.capacity))
      .reduce((result, c) => result + c, BigInt(0))
    const capacityInt =
      capacity === 'all'
        ? allCapacity - BigInt(anyoneCanPayLockLiveCells.length) * BigInt(61 * 10 ** 8)
        : BigInt(capacity)

    if (anyoneCanPayLockLiveCells.length === 0) {
      throw new CapacityNotEnough()
    }

    const inputs: Input[] = []
    const inputOriginCells: LiveCell[] = []
    let inputCapacities: bigint = BigInt(0)
    let totalSize: number = baseSize
    anyoneCanPayLockLiveCells.every(cell => {
      const input: Input = new Input(cell.outPoint(), '0', cell.capacity, cell.lock(), cell.lockHash)
      inputCapacities += BigInt(cell.capacity)
      totalSize += TransactionSize.input()
      if (inputs.find(el => el.lockHash === cell.lockHash!)) {
        totalSize += TransactionSize.emptyWitness()
      } else {
        totalSize += TransactionSize.secpLockWitness()
        inputOriginCells.push(cell)
        // capacity - 61CKB, 61CKB remaining for change
        inputCapacities -= this.ANYONE_CAN_PAY_CKB_CELL_MIN
        totalSize += TransactionSize.ckbAnyoneCanPayOutput() + TransactionSize.outputData('0x')
      }
      inputs.push(input)

      needFee = mode.isFeeRateMode() ? TransactionFee.fee(totalSize, feeRateInt) : feeInt

      const diffCapacity = inputCapacities - capacityInt - needFee
      if (diffCapacity >= BigInt(0)) {
        return false
      }
      return true
    })

    if (inputCapacities < capacityInt) {
      throw new CapacityNotEnough()
    }

    let extraNeedFee: bigint = capacityInt + needFee - inputCapacities
    extraNeedFee = extraNeedFee > BigInt(0) ? extraNeedFee : BigInt(0)

    const anyoneCanPayOutputs = inputOriginCells.map(cell => {
      const output = Output.fromObject({
        capacity: this.ANYONE_CAN_PAY_CKB_CELL_MIN.toString(),
        lock: cell.lock(),
        type: cell.type(),
        data: cell.data
      })
      return output
    })
    anyoneCanPayOutputs[anyoneCanPayOutputs.length - 1].capacity =
      extraNeedFee === BigInt(0)
        ? (this.ANYONE_CAN_PAY_CKB_CELL_MIN + inputCapacities - capacityInt - needFee).toString()
        : (this.ANYONE_CAN_PAY_CKB_CELL_MIN + inputCapacities - capacityInt).toString()

    // if anyone-can-pay not enough for fee, using normal cell
    let finalFee: bigint = needFee
    let changeOutput: Output | undefined
    let changeInputs: Input[] = []
    if (extraNeedFee > BigInt(0)) {
      const normalCellInputsInfo = await CellsService.gatherInputs(
        (-extraNeedFee).toString(),
        walletId,
        fee,
        feeRate,
        totalSize,
        changeOutputSize,
        changeOutputDataSize
      )

      changeInputs = normalCellInputsInfo.inputs

      if (normalCellInputsInfo.hasChangeOutput) {
        const changeCapacity =
          BigInt(normalCellInputsInfo.capacities) - BigInt(normalCellInputsInfo.finalFee) + (needFee - extraNeedFee)

        changeOutput = Output.fromObject({
          capacity: changeCapacity.toString(),
          lock: SystemScriptInfo.generateSecpScript(changeBlake160)
        })
      }

      finalFee = BigInt(normalCellInputsInfo.finalFee)
    }

    return {
      anyoneCanPayInputs: inputs,
      changeInputs,
      anyoneCanPayOutputs,
      changeOutput,
      finalFee: finalFee.toString(),
      sendCapacity: capacityInt.toString()
    }
  }

  public static async gatherAnyoneCanPaySendAllCKBInputs(
    anyoneCanPayLocks: Script[],
    fee: string = '0',
    feeRate: string = '0',
    baseSize: number = 0
  ) {
    const feeInt = BigInt(fee)
    const feeRateInt = BigInt(feeRate)
    const mode = new FeeMode(feeRateInt)

    let needFee = BigInt(0)

    // only live cells, skip which has data or type
    const liveCellService = LiveCellService.getInstance()
    const allAnyoneCanPayLockLiveCells = await liveCellService.getManyByLockScriptsAndTypeScript(
      anyoneCanPayLocks,
      null
    )
    const anyoneCanPayLockLiveCells = allAnyoneCanPayLockLiveCells.filter(cell => cell.data === '0x')

    if (anyoneCanPayLockLiveCells.length === 0) {
      throw new CapacityNotEnough()
    }

    const inputs: Input[] = []
    const inputOriginCells: LiveCell[] = []
    let inputCapacities: bigint = BigInt(0)
    let totalSize: number = baseSize
    anyoneCanPayLockLiveCells.forEach(cell => {
      const input: Input = new Input(cell.outPoint(), '0', cell.capacity, cell.lock(), cell.lockHash)
      inputCapacities += BigInt(cell.capacity)
      totalSize += TransactionSize.input()
      if (inputs.find(el => el.lockHash === cell.lockHash!)) {
        totalSize += TransactionSize.emptyWitness()
      } else {
        totalSize += TransactionSize.secpLockWitness()
        inputOriginCells.push(cell)
        // capacity - 61CKB, 61CKB remaining for change
        inputCapacities -= this.ANYONE_CAN_PAY_CKB_CELL_MIN
        totalSize += TransactionSize.ckbAnyoneCanPayOutput() + TransactionSize.outputData('0x')
      }
      inputs.push(input)

      needFee = mode.isFeeRateMode() ? TransactionFee.fee(totalSize, feeRateInt) : feeInt
    })

    const capacityInt: bigint = inputCapacities - needFee

    const anyoneCanPayOutputs = inputOriginCells.map(cell => {
      const output = Output.fromObject({
        capacity: this.ANYONE_CAN_PAY_CKB_CELL_MIN.toString(),
        lock: cell.lock(),
        type: cell.type(),
        data: cell.data
      })
      return output
    })

    return {
      anyoneCanPayInputs: inputs,
      anyoneCanPayOutputs,
      finalFee: needFee.toString(),
      sendCapacity: capacityInt.toString(),
      changeInputs: [],
      changeOutput: undefined
    }
  }

  // gather inputs for sUDT
  // CKB for fee
  // sUDT for amount
  public static async gatherSudtInputs(
    amount: 'all' | string,
    walletId: string,
    anyoneCanPayLocks: Script[],
    type: Script,
    changeBlake160: string,
    fee: string = '0',
    feeRate: string = '0',
    baseSize: number = 0,
    changeOutputSize: number = 0,
    changeOutputDataSize: number = 0
  ) {
    const feeInt = BigInt(fee)
    const feeRateInt = BigInt(feeRate)
    const mode = new FeeMode(feeRateInt)

    let needFee = BigInt(0)

    const liveCellService = LiveCellService.getInstance()
    const anyoneCanPayLockLiveCells = await liveCellService.getManyByLockScriptsAndTypeScript(anyoneCanPayLocks, type)

    const allAmount: bigint = anyoneCanPayLockLiveCells
      .map(c => BufferUtils.parseAmountFromSUDTData(c.data))
      .reduce((result, c) => result + c, BigInt(0))
    const amountInt = amount === 'all' ? allAmount : BigInt(amount)

    if (anyoneCanPayLockLiveCells.length === 0) {
      throw new CapacityNotEnough()
    }

    const inputs: Input[] = []
    const inputOriginCells: LiveCell[] = []
    let inputCapacities: bigint = BigInt(0)
    let inputAmount: bigint = BigInt(0)
    let totalSize: number = baseSize
    anyoneCanPayLockLiveCells.every(cell => {
      const input: Input = Input.fromObject({
        previousOutput: cell.outPoint(),
        since: '0',
        capacity: cell.capacity,
        lock: cell.lock(),
        lockHash: cell.lockHash,
        type: cell.type(),
        typeHash: cell.typeHash,
        data: cell.data
      })
      inputCapacities += BigInt(cell.capacity)
      totalSize += TransactionSize.input()
      if (inputs.find(el => el.lockHash === cell.lockHash!)) {
        totalSize += TransactionSize.emptyWitness()
      } else {
        totalSize += TransactionSize.secpLockWitness()
        inputOriginCells.push(cell)
        // capacity - 142CKB, 142CKB remaining for change
        inputCapacities -= this.ANYONE_CAN_PAY_SUDT_CELL_MIN
        totalSize += TransactionSize.sudtAnyoneCanPayOutput() + TransactionSize.sudtData()
      }
      inputs.push(input)

      inputAmount += BufferUtils.parseAmountFromSUDTData(cell.data)

      needFee = mode.isFeeRateMode() ? TransactionFee.fee(totalSize, feeRateInt) : feeInt

      const diffAmount = inputAmount - amountInt
      if (diffAmount >= BigInt(0)) {
        return false
      }
      return true
    })

    if (inputAmount < amountInt) {
      throw new CapacityNotEnough()
    }

    let currentFee: bigint = needFee
    const anyoneCanPayOutputs = inputOriginCells.map(cell => {
      const cellCapacity: bigint = inputs
        .filter(i => i.lockHash === cell.lockHash)
        .map(i => BigInt(i.capacity))
        .reduce((result, c) => result + c, BigInt(0))
      let capacity: bigint = BigInt(0)
      if (BigInt(cellCapacity) - this.ANYONE_CAN_PAY_SUDT_CELL_MIN >= currentFee) {
        capacity = BigInt(cellCapacity) - currentFee
        currentFee = BigInt(0)
      } else {
        capacity = this.ANYONE_CAN_PAY_SUDT_CELL_MIN
        currentFee = currentFee - (BigInt(cellCapacity) - this.ANYONE_CAN_PAY_SUDT_CELL_MIN)
      }
      const output = Output.fromObject({
        capacity: capacity.toString(),
        lock: cell.lock(),
        type: cell.type(),
        data: BufferUtils.writeBigUInt128LE(BigInt(0))
      })
      return output
    })
    anyoneCanPayOutputs[anyoneCanPayOutputs.length - 1].data = BufferUtils.writeBigUInt128LE(inputAmount - amountInt)

    // if anyone-can-pay not enough for fee, using normal cell
    let finalFee: bigint = needFee
    let changeOutput: Output | undefined
    let changeInputs: Input[] = []
    if (inputCapacities < needFee) {
      const normalCellInputsInfo = await CellsService.gatherInputs(
        (-inputCapacities).toString(),
        walletId,
        fee,
        feeRate,
        totalSize,
        changeOutputSize,
        changeOutputDataSize
      )

      changeInputs = normalCellInputsInfo.inputs

      if (normalCellInputsInfo.hasChangeOutput) {
        const changeCapacity =
          BigInt(normalCellInputsInfo.capacities) - BigInt(normalCellInputsInfo.finalFee) + inputCapacities

        changeOutput = Output.fromObject({
          capacity: changeCapacity.toString(),
          lock: SystemScriptInfo.generateSecpScript(changeBlake160)
        })
      }

      finalFee = BigInt(normalCellInputsInfo.finalFee)
    }

    return {
      anyoneCanPayInputs: inputs,
      changeInputs,
      anyoneCanPayOutputs,
      changeOutput,
      finalFee: finalFee.toString(),
      amount: amountInt.toString()
    }
  }

  public static allBlake160s = async (): Promise<string[]> => {
    const outputEntities = await getConnection()
      .getRepository(OutputEntity)
      .createQueryBuilder('output')
      .getMany()
    const blake160s: string[] = outputEntities
      .map(output => {
        const lock = output.lockScript()
        if (!lock) {
          return undefined
        }
        const { args } = lock
        if (!args) {
          return undefined
        }
        return args
      })
      .filter(blake160 => !!blake160) as string[]

    const uniqueBlake160s = [...new Set(blake160s)]

    return uniqueBlake160s
  }

  public static async gatherLegacyACPInputs(walletId: string) {
    const assetAccountInfo = new AssetAccountInfo()
    const legacyACPScriptInfo = assetAccountInfo.getLegacyAnyoneCanPayInfo()
    const outputs = await getConnection()
      .getRepository(OutputEntity)
      .createQueryBuilder('output')
      .where({
        status: OutputStatus.Live,
        lockCodeHash: legacyACPScriptInfo.codeHash,
        lockHashType: legacyACPScriptInfo.hashType
      })
      .andWhere(
        `
        lockArgs IN (
          SELECT publicKeyInBlake160
          FROM hd_public_key_info
          WHERE walletId = :walletId
        )`,
        { walletId }
      )
      .getMany()

    return outputs
  }

  public static async getACPCells(lock: Script, type: Script) {
    const outputs = await getConnection()
      .getRepository(OutputEntity)
      .createQueryBuilder('output')
      .where({
        status: OutputStatus.Live,
        lockCodeHash: lock.codeHash,
        lockHashType: lock.hashType,
        lockArgs: lock.args,
        typeCodeHash: type.codeHash,
        typeHashType: type.hashType,
        typeArgs: type.args
      })
      .getMany()

    return outputs
  }

  public static async searchInputsByLockHash(lockHash: string) {
    const inputs = await getConnection()
      .getRepository(InputEntity)
      .createQueryBuilder('input')
      .where('input.lockHash like :lockHash', {
        lockHash: `%${lockHash}%`
      })
      .getMany()

    return inputs
  }

  public static async getLiveCellsByLockHash(lockHash: string) {
    const outputs = await getConnection()
      .getRepository(OutputEntity)
      .createQueryBuilder('output')
      .where(
        `
        output.status = :status AND
        output.lockHash = :lockHash
      `,
        {
          status: OutputStatus.Live,
          lockHash: lockHash
        }
      )
      .getMany()

    return outputs
  }

  public static async getOutputsByTransactionHash(hash: string) {
    const outputEntities: OutputEntity[] = await getConnection()
      .getRepository(OutputEntity)
      .createQueryBuilder('output')
      .where({
        outPointTxHash: hash
      })
      .getMany()

    return outputEntities
  }

  public static async getMultisigBalance(isMainnet: boolean) {
    const cells: {
      lockArgs: string
      balance: string
    }[] = await getConnection().getRepository(OutputEntity).manager.query(`
        select
            CAST(SUM(CAST(output.capacity AS UNSIGNED BIG INT)) AS VARCHAR) as balance,
            lockArgs
        from
            output
        where
            output.lockCodeHash = '${SystemScriptInfo.MULTI_SIGN_CODE_HASH}' AND
            output.status in ('${OutputStatus.Live}', '${OutputStatus.Sent}') AND
            output.lockHashType = '${SystemScriptInfo.MULTI_SIGN_HASH_TYPE}'
        group by output.lockArgs
      `)

    const balances: Record<string, string> = {}

    cells.forEach(c => {
      balances[
        scriptToAddress(
          {
            args: c.lockArgs,
            codeHash: SystemScriptInfo.MULTI_SIGN_CODE_HASH,
            hashType: SystemScriptInfo.MULTI_SIGN_HASH_TYPE
          },
          isMainnet
        )
      ] = c.balance
    })

    return balances
  }
}
