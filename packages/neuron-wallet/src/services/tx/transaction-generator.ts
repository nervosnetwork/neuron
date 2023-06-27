import CellsService from '../../services/cells'
import {
  CapacityTooSmall,
  MigrateSudtCellNoTypeError,
  SudtAcpHaveDataError,
  TargetOutputNotFoundError,
} from '../../exceptions'
import FeeMode from '../../models/fee-mode'
import TransactionSize from '../../models/transaction-size'
import TransactionFee from '../../models/transaction-fee'
import { CapacityNotEnough, CurrentWalletNotSet, LiveCapacityNotEnough } from '../../exceptions/wallet'
import Output from '../../models/chain/output'
import Input from '../../models/chain/input'
import OutPoint from '../../models/chain/out-point'
import Script, { ScriptHashType } from '../../models/chain/script'
import Transaction from '../../models/chain/transaction'
import WitnessArgs from '../../models/chain/witness-args'
import AddressParser from '../../models/address-parser'
import Multisig from '../../models/multisig'
import RpcService from '../../services/rpc-service'
import NodeService from '../../services/node'
import BlockHeader from '../../models/chain/block-header'
import CellDep from '../../models/chain/cell-dep'
import SystemScriptInfo from '../../models/system-script-info'
import ArrayUtils from '../../utils/array'
import AssetAccountInfo from '../../models/asset-account-info'
import BufferUtils from '../../utils/buffer'
import assert from 'assert'
import AssetAccount from '../../models/asset-account'
import AddressService from '../../services/addresses'
import { config, helpers } from '@ckb-lumos/lumos'
import MultisigConfigModel from '../../models/multisig-config'
import WalletService from '../../services/wallets'
import { MIN_CELL_CAPACITY, MIN_SUDT_CAPACITY } from '../../utils/const'
import AssetAccountService from '../../services/asset-account-service'
import LiveCellService from '../../services/live-cell-service'

export interface TargetOutput {
  address: string
  capacity: string
  date?: string // timestamp
}

export class TransactionGenerator {
  public static CHANGE_OUTPUT_SIZE = 101
  public static CHANGE_OUTPUT_DATA_SIZE = 8
  public static MIN_NFT_CELL_SIZE = BigInt(133 * 10 ** 8)

  public static generateTransferNftTx = async (
    walletId: string,
    outPoint: OutPoint,
    prevOutput: Output,
    receiveAddress: string,
    changeAddress: string,
    fee: string = '0',
    feeRate: string = '0'
  ) => {
    const assetAccount = new AssetAccountInfo()
    const secpCellDep = await SystemScriptInfo.getInstance().getSecpCellDep()
    const nftCellDep = assetAccount.getNftInfo().cellDep
    const op = new OutPoint(outPoint.txHash, outPoint.index)
    const nftCell = await CellsService.getLiveCell(op)
    const receiverLockScript = AddressParser.parse(receiveAddress)
    const assetAccountInfo = new AssetAccountInfo()
    const anyoneCanPayDep = assetAccountInfo.anyoneCanPayCellDep

    if (nftCell === undefined) {
      throw new Error('NFT cell not found')
    }
    const cellDeps = [secpCellDep, nftCellDep]
    const outputLock = new Script(prevOutput.lock.codeHash, prevOutput.lock.args, prevOutput.lock.hashType)
    if (assetAccountInfo.isDefaultAnyoneCanPayScript(outputLock)) {
      cellDeps.push(anyoneCanPayDep)
    }

    const nftInput = Input.fromObject({
      previousOutput: op,
      capacity: nftCell.capacity,
      lock: outputLock,
      type: nftCell.type ? new Script(nftCell.type.codeHash, nftCell.type.args, nftCell.type.hashType) : null,
      data: nftCell.data,
      since: '0',
    })

    const append = {
      input: nftInput,
      witness: WitnessArgs.emptyLock(),
    }

    nftCell.setLock(receiverLockScript)
    const outputs: Output[] = [nftCell]
    const tx = Transaction.fromObject({
      version: '0',
      cellDeps: [secpCellDep, nftCellDep, anyoneCanPayDep],
      headerDeps: [],
      inputs: [nftInput],
      outputs,
      outputsData: outputs.map(output => output.data || '0x'),
      witnesses: [],
    })

    const txSize = TransactionSize.tx(tx)
    tx.fee = TransactionFee.fee(txSize, BigInt(feeRate)).toString()
    const outputCapacity = BigInt(nftCell.capacity) - BigInt(tx.fee)
    // if there is enough capacity left to cover tx fee
    if (outputCapacity >= TransactionGenerator.MIN_NFT_CELL_SIZE) {
      tx.outputs[0].capacity = outputCapacity.toString()
      return tx
    }

    tx.inputs = []
    const baseSize: number = TransactionSize.tx(tx)

    const { inputs, capacities, finalFee, hasChangeOutput } = await CellsService.gatherInputs(
      '0',
      walletId,
      fee,
      feeRate,
      baseSize,
      TransactionGenerator.CHANGE_OUTPUT_SIZE,
      TransactionGenerator.CHANGE_OUTPUT_DATA_SIZE,
      append
    )
    const finalFeeInt = BigInt(finalFee)

    if (finalFeeInt === BigInt(0)) {
      throw new LiveCapacityNotEnough()
    }

    tx.inputs = inputs
    tx.fee = finalFee

    // change
    if (hasChangeOutput) {
      const changeBlake160: string = AddressParser.toBlake160(changeAddress)
      const changeCapacity = BigInt(capacities) - finalFeeInt

      const changeOutput = new Output(changeCapacity.toString(), SystemScriptInfo.generateSecpScript(changeBlake160))

      tx.addOutput(changeOutput)
    }

    return tx
  }

  public static generateTx = async (
    walletId: string,
    targetOutputs: TargetOutput[],
    changeAddress: string,
    fee: string = '0',
    feeRate: string = '0',
    lockClass: {
      lockArgs?: string[]
      codeHash: string
      hashType: ScriptHashType
    } = { codeHash: SystemScriptInfo.SECP_CODE_HASH, hashType: ScriptHashType.Type },
    multisigConfig?: MultisigConfigModel
  ): Promise<Transaction> => {
    let cellDep: CellDep
    if (lockClass.codeHash === SystemScriptInfo.MULTI_SIGN_CODE_HASH) {
      cellDep = await SystemScriptInfo.getInstance().getMultiSignCellDep()
    } else {
      cellDep = await SystemScriptInfo.getInstance().getSecpCellDep()
    }
    const tipHeader = await TransactionGenerator.getTipHeader()
    const tipHeaderEpoch = tipHeader.epoch
    const tipHeaderTimestamp = tipHeader.timestamp

    const needCapacities: bigint = targetOutputs
      .map(o => BigInt(o.capacity))
      .reduce((result, c) => result + c, BigInt(0))

    const outputs: Output[] = targetOutputs.map(o => {
      const { capacity, address, date } = o

      const lockScript = AddressParser.parse(address)

      const output = new Output(capacity, lockScript)
      if (date) {
        const blake160 = lockScript.args
        const minutes: number = +((BigInt(date) - BigInt(tipHeaderTimestamp)) / BigInt(1000 * 60)).toString()
        const script = SystemScriptInfo.generateMultiSignScript(new Multisig().args(blake160, +minutes, tipHeaderEpoch))
        output.setLock(script)
        output.setMultiSignBlake160(script.args.slice(0, 42))
      }

      const outputSize = output.calculateBytesize()
      if (BigInt(capacity) < BigInt(outputSize) * BigInt(10 ** 8)) {
        throw new CapacityTooSmall(outputSize.toString())
      }

      return output
    })

    const tx = Transaction.fromObject({
      version: '0',
      cellDeps: [cellDep],
      headerDeps: [],
      inputs: [],
      outputs,
      outputsData: outputs.map(output => output.data || '0x'),
      witnesses: [],
    })

    const baseSize: number = TransactionSize.tx(tx)
    const { inputs, capacities, finalFee, hasChangeOutput } = await CellsService.gatherInputs(
      needCapacities.toString(),
      walletId,
      fee,
      feeRate,
      baseSize,
      TransactionGenerator.CHANGE_OUTPUT_SIZE,
      TransactionGenerator.CHANGE_OUTPUT_DATA_SIZE,
      undefined,
      lockClass,
      multisigConfig ? [multisigConfig] : []
    )
    const finalFeeInt = BigInt(finalFee)
    tx.inputs = inputs
    tx.fee = finalFee

    // change
    if (hasChangeOutput) {
      const changeCapacity = BigInt(capacities) - needCapacities - finalFeeInt
      const isMainnet = changeAddress.startsWith('ckb')
      const lumosOptions = isMainnet ? { config: config.predefined.LINA } : { config: config.predefined.AGGRON4 }

      const output = new Output(
        changeCapacity.toString(),
        Script.fromSDK(helpers.addressToScript(changeAddress, lumosOptions))
      )

      tx.addOutput(output)
    }

    tx.outputs = ArrayUtils.shuffle(tx.outputs)
    tx.outputsData = tx.outputs.map(output => output.data || '0x')

    return tx
  }

  // rest of capacity all send to last target output.
  public static generateSendingAllTx = async (
    walletId: string,
    targetOutputs: TargetOutput[],
    fee: string = '0',
    feeRate: string = '0',
    multisigConfig?: MultisigConfigModel
  ): Promise<Transaction> => {
    let cellDep: CellDep
    if (multisigConfig) {
      cellDep = await SystemScriptInfo.getInstance().getMultiSignCellDep()
    } else {
      cellDep = await SystemScriptInfo.getInstance().getSecpCellDep()
    }
    const tipHeader = await TransactionGenerator.getTipHeader()
    const tipHeaderEpoch = tipHeader.epoch
    const tipHeaderTimestamp = tipHeader.timestamp

    const feeInt = BigInt(fee)
    const feeRateInt = BigInt(feeRate)
    const mode = new FeeMode(feeRateInt)

    const allInputs: Input[] = await CellsService.gatherAllInputs(
      walletId,
      multisigConfig
        ? Script.fromSDK(
            Multisig.getMultisigScript(multisigConfig.blake160s, multisigConfig.r, multisigConfig.m, multisigConfig.n)
          )
        : undefined
    )

    if (allInputs.length === 0) {
      throw new CapacityNotEnough()
    }

    const totalCapacity: bigint = allInputs
      .map(input => BigInt(input.capacity || 0))
      .reduce((result, c) => result + c, BigInt(0))

    const outputs: Output[] = targetOutputs.map((o, index) => {
      const { capacity, address, date } = o

      const lockScript: Script = AddressParser.parse(address)

      const output = new Output(capacity, lockScript)
      if (date) {
        const blake160 = lockScript.args
        const minutes: number = +((BigInt(date) - BigInt(tipHeaderTimestamp)) / BigInt(1000 * 60)).toString()
        const script: Script = SystemScriptInfo.generateMultiSignScript(
          new Multisig().args(blake160, minutes, tipHeaderEpoch)
        )
        output.setLock(script)
        output.setMultiSignBlake160(script.args.slice(0, 42))
      }

      // skip last output
      const outputSize = output.calculateBytesize()
      if (BigInt(capacity) < BigInt(outputSize) * BigInt(10 ** 8) && index !== targetOutputs.length - 1) {
        throw new CapacityTooSmall(outputSize.toString())
      }

      return output
    })

    const tx = Transaction.fromObject({
      version: '0',
      cellDeps: [cellDep],
      headerDeps: [],
      inputs: allInputs,
      outputs,
      witnesses: [],
    })

    // change
    let finalFee: bigint = feeInt
    if (mode.isFeeRateMode()) {
      const lockHashes = new Set(allInputs.map(i => i.lockHash!))
      const keyCount: number = lockHashes.size
      const txSize: number =
        TransactionSize.tx(tx) +
        (multisigConfig
          ? TransactionSize.multiSignWitness(multisigConfig.r, multisigConfig.m, multisigConfig.n)
          : TransactionSize.secpLockWitness() * keyCount) +
        TransactionSize.emptyWitness() * (allInputs.length - keyCount)
      finalFee = TransactionFee.fee(txSize, feeRateInt)
    }

    const capacitiesExceptLast: bigint = outputs
      .slice(0, -1)
      .map(o => BigInt(o.capacity))
      .reduce((result, c) => result + c, BigInt(0))
    tx.outputs[outputs.length - 1].setCapacity((totalCapacity - capacitiesExceptLast - finalFee).toString())
    tx.fee = finalFee.toString()

    // check
    if (
      tx.outputs.map(o => BigInt(o.capacity)).reduce((result, c) => result + c, BigInt(0)) + finalFee !==
      totalCapacity
    ) {
      throw new Error('generateSendingAllTx Error')
    }

    return tx
  }

  private static async getTipHeader(): Promise<BlockHeader> {
    const rpcService = new RpcService(NodeService.getInstance().nodeUrl)
    const tipHeader = await rpcService.getTipHeader()
    return tipHeader
  }

  public static generateDepositTx = async (
    walletId: string,
    capacity: string,
    receiveAddress: string,
    changeAddress: string,
    fee: string = '0',
    feeRate: string = '0'
  ): Promise<Transaction> => {
    const secpCellDep = await SystemScriptInfo.getInstance().getSecpCellDep()
    const daoCellDep = await SystemScriptInfo.getInstance().getDaoCellDep()
    const blake160: string = AddressParser.toBlake160(receiveAddress)

    const capacityInt: bigint = BigInt(capacity)

    const output: Output = new Output(
      capacity,
      SystemScriptInfo.generateSecpScript(blake160),
      SystemScriptInfo.generateDaoScript('0x')
    )
    output.setDaoData('0x0000000000000000')

    const outputs: Output[] = [output]

    const tx = Transaction.fromObject({
      version: '0',
      cellDeps: [secpCellDep, daoCellDep],
      headerDeps: [],
      inputs: [],
      outputs,
      outputsData: outputs.map(output => output.data || '0x'),
      witnesses: [],
    })

    const baseSize: number = TransactionSize.tx(tx)

    const { inputs, capacities, finalFee, hasChangeOutput } = await CellsService.gatherInputs(
      capacityInt.toString(),
      walletId,
      fee,
      feeRate,
      baseSize,
      TransactionGenerator.CHANGE_OUTPUT_SIZE,
      TransactionGenerator.CHANGE_OUTPUT_DATA_SIZE
    )
    const finalFeeInt = BigInt(finalFee)
    tx.inputs = inputs

    // change
    if (hasChangeOutput) {
      const changeBlake160: string = AddressParser.toBlake160(changeAddress)

      const changeCapacity = BigInt(capacities) - capacityInt - finalFeeInt

      const changeOutput = new Output(changeCapacity.toString(), SystemScriptInfo.generateSecpScript(changeBlake160))

      tx.addOutput(changeOutput)
    }

    tx.fee = finalFee

    return tx
  }

  public static generateDepositAllTx = async (
    walletId: string,
    receiveAddress: string,
    changeAddress: string,
    isBalanceReserved = true,
    fee: string = '0',
    feeRate: string = '0'
  ): Promise<Transaction> => {
    const secpCellDep = await SystemScriptInfo.getInstance().getSecpCellDep()
    const daoCellDep = await SystemScriptInfo.getInstance().getDaoCellDep()

    const feeInt = BigInt(fee)
    const feeRateInt = BigInt(feeRate)
    const mode = new FeeMode(feeRateInt)

    const allInputs: Input[] = await CellsService.gatherAllInputs(walletId)
    if (allInputs.length === 0) {
      throw new CapacityNotEnough()
    }

    const reservedBalance = isBalanceReserved ? BigInt(62_00_000_000) : BigInt(0)

    const totalCapacity: bigint =
      allInputs.map(input => BigInt(input.capacity || 0)).reduce((result, c) => result + c, BigInt(0)) - reservedBalance

    const receiveBlake160: string = AddressParser.toBlake160(receiveAddress)
    const output = new Output(
      totalCapacity.toString(),
      SystemScriptInfo.generateSecpScript(receiveBlake160),
      SystemScriptInfo.generateDaoScript('0x')
    )

    output.setDaoData('0x0000000000000000')

    const outputs: Output[] = [output]
    if (isBalanceReserved) {
      const changeBlake160 = AddressParser.toBlake160(changeAddress)
      outputs.push(new Output(reservedBalance.toString(), SystemScriptInfo.generateSecpScript(changeBlake160)))
    }

    const tx = Transaction.fromObject({
      version: '0',
      cellDeps: [secpCellDep, daoCellDep],
      headerDeps: [],
      inputs: allInputs,
      outputs,
      outputsData: outputs.map(output => output.data || '0x'),
      witnesses: [],
    })

    // change
    let finalFee: bigint = feeInt
    if (mode.isFeeRateMode()) {
      const lockHashes = new Set(allInputs.map(i => i.lockHash!))
      const keyCount: number = lockHashes.size
      const txSize: number =
        TransactionSize.tx(tx) +
        TransactionSize.secpLockWitness() * keyCount +
        TransactionSize.emptyWitness() * (allInputs.length - keyCount)
      finalFee = TransactionFee.fee(txSize, feeRateInt)
    }

    tx.outputs[0].capacity = (BigInt(output.capacity) - finalFee).toString()
    tx.fee = finalFee.toString()

    return tx
  }

  public static startWithdrawFromDao = async (
    walletId: string,
    outPoint: OutPoint,
    prevOutput: Output,
    depositBlockNumber: string,
    depositBlockHash: string,
    changeAddress: string,
    fee: string = '0',
    feeRate: string = '0'
  ): Promise<Transaction> => {
    const secpCellDep = await SystemScriptInfo.getInstance().getSecpCellDep()
    const daoCellDep = await SystemScriptInfo.getInstance().getDaoCellDep()

    const output = prevOutput
    const buf = Buffer.alloc(8)
    buf.writeBigUInt64LE(BigInt(depositBlockNumber))
    output.setDaoData(`0x${buf.toString('hex')}`)
    output.setDepositOutPoint(outPoint)

    const outputs: Output[] = [output]

    const tx = Transaction.fromObject({
      version: '0',
      cellDeps: [secpCellDep, daoCellDep],
      headerDeps: [depositBlockHash],
      inputs: [],
      outputs,
      outputsData: outputs.map(o => o.data || '0x'),
      witnesses: [],
    })

    const baseSize: number = TransactionSize.tx(tx)

    const input = new Input(outPoint, '0', output.capacity, output.lock)

    const append = {
      input,
      witness: WitnessArgs.emptyLock(),
    }

    const { inputs, capacities, finalFee, hasChangeOutput } = await CellsService.gatherInputs(
      '0',
      walletId,
      fee,
      feeRate,
      baseSize,
      TransactionGenerator.CHANGE_OUTPUT_SIZE,
      TransactionGenerator.CHANGE_OUTPUT_DATA_SIZE,
      append
    )
    const finalFeeInt = BigInt(finalFee)

    if (finalFeeInt === BigInt(0)) {
      throw new LiveCapacityNotEnough()
    }

    tx.inputs = inputs
    tx.fee = finalFee

    // change
    if (hasChangeOutput) {
      const changeBlake160: string = AddressParser.toBlake160(changeAddress)
      const changeCapacity = BigInt(capacities) - finalFeeInt

      const changeOutput = new Output(changeCapacity.toString(), SystemScriptInfo.generateSecpScript(changeBlake160))

      tx.addOutput(changeOutput)
    }

    return tx
  }

  public static async generateWithdrawMultiSignTx(
    outPoint: OutPoint,
    prevOutput: Output,
    receivingAddress: string,
    fee: string,
    feeRate: string
  ): Promise<Transaction> {
    const multiSignCellDep = await SystemScriptInfo.getInstance().getMultiSignCellDep()

    const feeRateInt = BigInt(feeRate)
    const mode = new FeeMode(feeRateInt)

    const lockScript = AddressParser.parse(receivingAddress)

    // const outputs: Output[] = [output]
    const output = Output.fromObject({
      capacity: prevOutput.capacity,
      lock: lockScript,
    })

    const since = new Multisig().parseSince(prevOutput.lock.args)

    const input = new Input(outPoint, since.toString(), prevOutput.capacity, prevOutput.lock)
    const tx = Transaction.fromObject({
      version: '0',
      cellDeps: [multiSignCellDep],
      headerDeps: [],
      inputs: [input],
      outputs: [output],
      witnesses: [],
    })

    if (mode.isFeeRateMode()) {
      const size = TransactionSize.tx(tx) + TransactionSize.singleMultiSignWitness()
      const fee = TransactionFee.fee(size, feeRateInt)
      tx.fee = fee.toString()
    } else {
      tx.fee = fee
    }

    tx.outputs[0].setCapacity((BigInt(output.capacity) - BigInt(tx.fee)).toString())

    return tx
  }

  // sUDT
  public static async generateCreateAnyoneCanPayTx(
    tokenID: string,
    walletId: string,
    blake160: string,
    changeBlake160: string,
    feeRate: string,
    fee: string
  ): Promise<Transaction> {
    // if tokenID === '' or 'CKBytes', create ckb cell
    const isCKB = tokenID === 'CKBytes' || tokenID === ''

    const secpCellDep = await SystemScriptInfo.getInstance().getSecpCellDep()
    const assetAccountInfo = new AssetAccountInfo()
    const sudtCellDep = assetAccountInfo.sudtCellDep
    const needCapacities = isCKB ? BigInt(61 * 10 ** 8) : BigInt(142 * 10 ** 8)
    const output = Output.fromObject({
      capacity: needCapacities.toString(),
      lock: assetAccountInfo.generateAnyoneCanPayScript(blake160),
      type: isCKB ? null : assetAccountInfo.generateSudtScript(tokenID),
      data: isCKB ? '0x' : BufferUtils.writeBigUInt128LE(BigInt(0)),
    })
    const tx = Transaction.fromObject({
      version: '0',
      headerDeps: [],
      cellDeps: [secpCellDep, sudtCellDep],
      inputs: [],
      outputs: [output],
      outputsData: [output.data],
      witnesses: [],
    })
    const baseSize: number = TransactionSize.tx(tx)
    const { inputs, capacities, finalFee, hasChangeOutput } = await CellsService.gatherInputs(
      needCapacities.toString(),
      walletId,
      fee,
      feeRate,
      baseSize,
      TransactionGenerator.CHANGE_OUTPUT_SIZE,
      TransactionGenerator.CHANGE_OUTPUT_DATA_SIZE
    )
    const finalFeeInt = BigInt(finalFee)
    tx.inputs = inputs
    tx.fee = finalFee

    // change
    if (hasChangeOutput) {
      const changeCapacity = BigInt(capacities) - needCapacities - finalFeeInt

      const output = Output.fromObject({
        capacity: changeCapacity.toString(),
        lock: SystemScriptInfo.generateSecpScript(changeBlake160),
      })

      tx.addOutput(output)
    }

    // amount assertion
    TransactionGenerator.checkTxCapacity(tx, 'generateCreateAnyoneCanPayTx capacity not match!')

    return tx
  }

  public static async generateCreateAnyoneCanPayTxUseAllBalance(
    tokenID: string,
    walletId: string,
    blake160: string,
    feeRate: string,
    fee: string
  ): Promise<Transaction> {
    // if tokenID === '' or 'CKBytes', create ckb cell
    const isCKB = tokenID === 'CKBytes' || tokenID === ''

    const feeRateInt = BigInt(feeRate)
    const mode = new FeeMode(feeRateInt)

    const secpCellDep = await SystemScriptInfo.getInstance().getSecpCellDep()
    const assetAccountInfo = new AssetAccountInfo()
    const sudtCellDep = assetAccountInfo.sudtCellDep

    const allInputs: Input[] = await CellsService.gatherAllInputs(walletId)

    if (allInputs.length === 0) {
      throw new CapacityNotEnough()
    }

    const totalCapacity = allInputs.map(i => BigInt(i.capacity || 0)).reduce((result, c) => result + c, BigInt(0))

    const output = Output.fromObject({
      capacity: totalCapacity.toString(),
      lock: assetAccountInfo.generateAnyoneCanPayScript(blake160),
      type: isCKB ? null : assetAccountInfo.generateSudtScript(tokenID),
      data: isCKB ? '0x' : BufferUtils.writeBigUInt128LE(BigInt(0)),
    })

    const tx = Transaction.fromObject({
      version: '0',
      headerDeps: [],
      cellDeps: [secpCellDep, sudtCellDep],
      inputs: allInputs,
      outputs: [output],
      outputsData: [output.data],
      witnesses: [],
    })
    const keyCount = new Set(allInputs.map(i => i.lockHash!)).size
    const txSize: number =
      TransactionSize.tx(tx) +
      TransactionSize.secpLockWitness() * keyCount +
      TransactionSize.emptyWitness() * (allInputs.length - keyCount)
    tx.fee = mode.isFeeMode() ? fee : TransactionFee.fee(txSize, feeRateInt).toString()
    tx.outputs[0].capacity = (totalCapacity - BigInt(tx.fee)).toString()

    // amount assertion
    TransactionGenerator.checkTxCapacity(tx, 'generateCreateAnyoneCanPayTxUseAllBalance capacity not match!')

    return tx
  }

  public static async generateDestoryAssetAccountTx(
    walletId: string,
    asssetAccountInputs: Input[],
    changeBlake160: string,
    isCKBAccount: boolean
  ) {
    const secpCellDep = await SystemScriptInfo.getInstance().getSecpCellDep()
    const assetAccountInfo = new AssetAccountInfo()

    const cellDeps = [secpCellDep, assetAccountInfo.anyoneCanPayCellDep]
    if (asssetAccountInputs.some(v => v.type && v.data !== '0x' && BigInt(v.data || 0) !== BigInt(0))) {
      throw new SudtAcpHaveDataError()
    }
    if (!isCKBAccount) {
      cellDeps.push(assetAccountInfo.sudtCellDep)
    }

    const output = Output.fromObject({
      capacity: '0',
      lock: SystemScriptInfo.generateSecpScript(changeBlake160),
    })

    const tx = Transaction.fromObject({
      version: '0',
      headerDeps: [],
      cellDeps,
      inputs: asssetAccountInputs,
      outputs: [output],
      outputsData: [output.data],
      witnesses: [],
    })

    let allCapacities = asssetAccountInputs.reduce((a, b) => {
      return a + BigInt(b.capacity as string)
    }, BigInt(0))
    tx.fee = TransactionFee.fee(TransactionSize.tx(tx), BigInt(1e4)).toString()
    const outputCapacity = allCapacities - BigInt(tx.fee)

    if (outputCapacity >= BigInt(MIN_CELL_CAPACITY)) {
      tx.outputs[0].capacity = outputCapacity.toString()
      return tx
    }
    const { inputs: changeInputs } = await CellsService.gatherInputs('0', walletId)
    if (changeInputs.length === 0) {
      throw new CapacityNotEnough()
    }

    tx.inputs.push(changeInputs[0])
    allCapacities = tx.inputs.reduce((a, b) => {
      return a + BigInt(b.capacity as string)
    }, BigInt(0))
    tx.fee = TransactionFee.fee(TransactionSize.tx(tx), BigInt(1e4)).toString()
    tx.outputs[0].capacity = (allCapacities - BigInt(tx.fee)).toString()
    return tx
  }

  // anyone-can-pay lock, CKB
  public static async generateAnyoneCanPayToCKBTx(
    walletId: string,
    anyoneCanPayLocks: Script[],
    targetOutput: Output,
    capacity: 'all' | string,
    changeBlake160: string,
    feeRate: string = '0',
    fee: string = '0'
  ) {
    const secpCellDep = await SystemScriptInfo.getInstance().getSecpCellDep()
    const assetAccountInfo = new AssetAccountInfo()
    const anyoneCanPayDep = assetAccountInfo.anyoneCanPayCellDep
    const sudtDep = assetAccountInfo.sudtCellDep
    const isDefaultLockScript = SystemScriptInfo.isSecpScript(targetOutput.lock)

    const cellDeps = [secpCellDep, anyoneCanPayDep]
    const needCapacities: bigint =
      capacity === 'all' ? BigInt(targetOutput.capacity) : BigInt(targetOutput.capacity) + BigInt(capacity)
    const output = Output.fromObject({
      ...targetOutput,
      capacity: needCapacities.toString(),
    })
    const targetInput = Input.fromObject({
      previousOutput: targetOutput.outPoint!,
      since: '0',
      capacity: targetOutput.capacity,
      lock: targetOutput.lock,
      lockHash: targetOutput.lockHash,
    })

    if (output.type) {
      cellDeps.push(sudtDep)
    }

    const tx = Transaction.fromObject({
      version: '0',
      headerDeps: [],
      cellDeps,
      inputs: [targetInput],
      outputs: [output],
      outputsData: [output.data],
      witnesses: [],
    })

    const deps = assetAccountInfo.determineAdditionalACPCellDepsByTx(tx)
    tx.cellDeps.push(...deps)

    const baseSize: number = TransactionSize.tx(tx)
    const result = await (capacity === 'all'
      ? CellsService.gatherAnyoneCanPaySendAllCKBInputs(anyoneCanPayLocks, fee, feeRate, baseSize)
      : CellsService.gatherAnyoneCanPayCKBInputs(
          capacity,
          walletId,
          anyoneCanPayLocks,
          changeBlake160,
          fee,
          feeRate,
          baseSize,
          TransactionGenerator.CHANGE_OUTPUT_SIZE,
          TransactionGenerator.CHANGE_OUTPUT_DATA_SIZE
        ))

    if (capacity === 'all') {
      tx.outputs[0].capacity = (BigInt(result.sendCapacity) + BigInt(targetOutput.capacity)).toString()
    }

    tx.inputs = isDefaultLockScript
      ? result.anyoneCanPayInputs
      : result.anyoneCanPayInputs.concat(result.changeInputs).concat(tx.inputs)
    tx.outputs = result.anyoneCanPayOutputs.concat(tx.outputs)
    if (result.changeOutput) {
      tx.outputs.push(result.changeOutput)
    }
    tx.outputsData = tx.outputs.map(o => o.data)
    tx.fee = result.finalFee
    tx.anyoneCanPaySendAmount = result.sendCapacity

    // amount assertion
    TransactionGenerator.checkTxCapacity(tx, 'generateAnyoneCanPayToCKBTx capacity not match!')

    return tx
  }

  // anyone-can-pay lock, sUDT
  // amount: 'all' or integer
  public static async generateAnyoneCanPayToSudtTx(
    walletId: string,
    anyoneCanPayLocks: Script[],
    targetOutput: Output,
    amount: 'all' | string,
    changeBlake160: string,
    feeRate: string = '0',
    fee: string = '0'
  ) {
    const secpCellDep = await SystemScriptInfo.getInstance().getSecpCellDep()
    const assetAccountInfo = new AssetAccountInfo()
    const sudtCellDep = assetAccountInfo.sudtCellDep
    const anyoneCanPayDep = assetAccountInfo.anyoneCanPayCellDep
    const targetAmount: bigint =
      amount === 'all' ? BigInt(0) : BufferUtils.parseAmountFromSUDTData(targetOutput.data) + BigInt(amount)
    const output = Output.fromObject({
      ...targetOutput,
      data: BufferUtils.writeBigUInt128LE(targetAmount),
    })
    const targetInput = targetOutput.outPoint
      ? Input.fromObject({
          previousOutput: targetOutput.outPoint!,
          since: '0',
          capacity: targetOutput.capacity,
          lock: targetOutput.lock,
          lockHash: targetOutput.lockHash,
          type: targetOutput.type,
          data: targetOutput.data,
        })
      : undefined
    const tx = Transaction.fromObject({
      version: '0',
      headerDeps: [],
      cellDeps: [secpCellDep, sudtCellDep, anyoneCanPayDep],
      inputs: targetInput ? [targetInput] : [],
      outputs: [output],
      outputsData: [output.data],
      witnesses: [],
    })

    const deps = assetAccountInfo.determineAdditionalACPCellDepsByTx(tx)
    tx.cellDeps.push(...deps)

    const baseSize: number = TransactionSize.tx(tx)
    const result = await CellsService.gatherSudtInputs(
      amount,
      walletId,
      anyoneCanPayLocks,
      targetOutput.type!,
      changeBlake160,
      fee,
      feeRate,
      baseSize,
      TransactionGenerator.CHANGE_OUTPUT_SIZE,
      TransactionGenerator.CHANGE_OUTPUT_DATA_SIZE,
      targetOutput.outPoint ? '0' : targetOutput.capacity
    )

    if (amount === 'all') {
      tx.outputs[0].data = BufferUtils.writeBigUInt128LE(
        BigInt(result.amount) + BufferUtils.parseAmountFromSUDTData(targetOutput.data)
      )
    }

    tx.inputs = result.anyoneCanPayInputs.concat(result.changeInputs).concat(tx.inputs)
    tx.outputs = result.anyoneCanPayOutputs.concat(tx.outputs)
    if (result.changeOutput) {
      tx.outputs.push(result.changeOutput)
    }
    tx.outputsData = tx.outputs.map(o => o.data)
    tx.fee = result.finalFee

    tx.sudtInfo = amount === 'all' ? { amount: result.amount } : { amount }
    tx.anyoneCanPaySendAmount = tx.sudtInfo.amount

    // amount assertion
    TransactionGenerator.checkTxCapacity(tx, 'generateAnyoneCanPayToSudtTx capacity not match!')
    TransactionGenerator.checkTxSudtAmount(tx, 'generateAnyoneCanPayToSudtTx sUDT amount not match!', assetAccountInfo)

    return tx
  }

  public static async generateMigrateLegacyACPTx(walletId: string): Promise<Transaction | null> {
    const assetAccountInfo = new AssetAccountInfo()
    const legacyACPCells = await CellsService.gatherLegacyACPInputs(walletId)
    if (!legacyACPCells.length) {
      return null
    }
    const legacyACPInputs = legacyACPCells.map(cell => {
      return new Input(cell.outPoint(), '0', cell.capacity, cell.lockScript(), cell.lockHash)
    })
    const ACPCells = legacyACPCells.map(cell => {
      const newACPLockScript = assetAccountInfo.generateAnyoneCanPayScript(cell.lockArgs)

      cell.lockCodeHash = newACPLockScript.codeHash
      cell.lockHashType = newACPLockScript.hashType
      cell.lockArgs = newACPLockScript.args
      cell.lockHash = newACPLockScript.computeHash()

      return cell
    })
    const ACPOutputs = ACPCells.map(cell => cell.toModel())

    const secpCellDep = await SystemScriptInfo.getInstance().getSecpCellDep()
    const sudtCellDep = assetAccountInfo.sudtCellDep
    const anyoneCanPayDep = assetAccountInfo.anyoneCanPayCellDep
    const legacyACPCellDep = assetAccountInfo.getLegacyAnyoneCanPayInfo().cellDep

    const tx = Transaction.fromObject({
      version: '0',
      headerDeps: [],
      cellDeps: [secpCellDep, sudtCellDep, anyoneCanPayDep, legacyACPCellDep],
      inputs: legacyACPInputs,
      outputs: ACPOutputs,
      outputsData: ACPCells.map(o => o.data || '0x'),
      witnesses: [],
    })

    const baseSize = TransactionSize.tx(tx) + TransactionSize.secpLockWitness() * tx.inputs.length

    const inputGatherResult = await CellsService.gatherInputs(
      '0',
      walletId,
      '0',
      '1000',
      baseSize,
      TransactionGenerator.CHANGE_OUTPUT_DATA_SIZE,
      TransactionGenerator.CHANGE_OUTPUT_SIZE
    )
    tx.inputs.push(...inputGatherResult.inputs)

    const originalChangeCapacity = inputGatherResult.inputs.reduce((sum: bigint, input: Input) => {
      return sum + BigInt(input.capacity || 0)
    }, BigInt(0))

    const actualChangeCapacity = originalChangeCapacity - BigInt(inputGatherResult.finalFee)
    tx.fee = inputGatherResult.finalFee

    if (actualChangeCapacity < BigInt(MIN_CELL_CAPACITY)) {
      throw new CapacityNotEnough()
    }

    const changeOutput = new Output(
      actualChangeCapacity.toString(),
      SystemScriptInfo.generateSecpScript(inputGatherResult.inputs[0].lock!.args!)
    )
    tx.outputs.push(changeOutput)
    tx.outputsData.push('0x')

    return tx
  }

  public static async generateCreateChequeTx(
    walletId: string,
    amount: string,
    assetAccount: AssetAccount,
    receiverAddress: string,
    changeAddress: string,
    fee: string = '0',
    feeRate: string = '0',
    description: string = ''
  ) {
    const assetAccountInfo = new AssetAccountInfo()

    const secpCellDep = await SystemScriptInfo.getInstance().getSecpCellDep()
    const sudtCellDep = assetAccountInfo.sudtCellDep
    const anyoneCanPayDep = assetAccountInfo.anyoneCanPayCellDep

    const senderAcpScript = assetAccountInfo.generateAnyoneCanPayScript(assetAccount.blake160)
    const receiverLockScript = AddressParser.parse(receiverAddress)

    const chequeCellTmp = Output.fromObject({
      capacity: BigInt(162 * 10 ** 8).toString(),
      lock: assetAccountInfo.generateChequeScript('0'.repeat(40), '0'.repeat(40)),
      type: assetAccountInfo.generateSudtScript(assetAccount.tokenID),
    })

    const tx = Transaction.fromObject({
      version: '0',
      headerDeps: [],
      cellDeps: [secpCellDep, sudtCellDep, anyoneCanPayDep],
      inputs: [],
      outputs: [],
      outputsData: [],
      witnesses: [],
      description,
    })

    const changeBlake160: string = AddressParser.toBlake160(changeAddress)
    const baseSize: number = TransactionSize.tx(tx)

    const gatheredSudtInputResult = await CellsService.gatherSudtInputs(
      amount,
      walletId,
      [senderAcpScript],
      chequeCellTmp.type!,
      changeBlake160,
      undefined,
      undefined,
      baseSize,
      TransactionGenerator.CHANGE_OUTPUT_SIZE,
      TransactionGenerator.CHANGE_OUTPUT_DATA_SIZE
    )

    tx.inputs = gatheredSudtInputResult.anyoneCanPayInputs
      .concat(gatheredSudtInputResult.changeInputs)
      .concat(tx.inputs)
    tx.outputs.push(...gatheredSudtInputResult.anyoneCanPayOutputs)
    tx.outputsData = tx.outputs.map(output => output.data || '0x')

    const newBaseSize: number =
      TransactionSize.tx(tx) +
      TransactionSize.secpLockWitness() * tx.inputs.length +
      TransactionSize.output(chequeCellTmp) +
      TransactionSize.outputData(BufferUtils.writeBigUInt128LE(BigInt(0)))

    const gatheredCKBInputResult = await CellsService.gatherInputs(
      chequeCellTmp.capacity,
      walletId,
      fee,
      feeRate,
      newBaseSize,
      TransactionGenerator.CHANGE_OUTPUT_SIZE,
      TransactionGenerator.CHANGE_OUTPUT_DATA_SIZE
    )

    tx.inputs.push(...gatheredCKBInputResult.inputs)

    const senderDefaultCell = tx.inputs.find(input => input.lock!.codeHash === SystemScriptInfo.SECP_CODE_HASH)
    if (!senderDefaultCell) {
      throw new Error('Default cells not found')
    }

    const chequeCell = Output.fromObject({
      ...chequeCellTmp,
      // recreate lockHash
      lockHash: undefined,
      data: BufferUtils.writeBigUInt128LE(BigInt(gatheredSudtInputResult.amount)),
      lock: assetAccountInfo.generateChequeScript(
        receiverLockScript.computeHash(),
        senderDefaultCell.lock!.computeHash()
      ),
    })
    tx.outputs.unshift(chequeCell)
    tx.outputsData.unshift(chequeCell.data)

    const finalFeeInt = BigInt(gatheredCKBInputResult.finalFee)
    tx.fee = finalFeeInt.toString()

    if (gatheredCKBInputResult.hasChangeOutput) {
      const changeBlake160: string = AddressParser.toBlake160(changeAddress)

      const changeCapacity = BigInt(gatheredCKBInputResult.capacities) - finalFeeInt - BigInt(chequeCell.capacity)

      const output = new Output(changeCapacity.toString(), SystemScriptInfo.generateSecpScript(changeBlake160))

      tx.addOutput(output)
    }

    tx.sudtInfo = amount === 'all' ? { amount: gatheredSudtInputResult.amount } : { amount }
    tx.anyoneCanPaySendAmount = tx.sudtInfo.amount

    TransactionGenerator.checkTxCapacity(tx, 'generateCreateChequeTx capacity not match!')
    TransactionGenerator.checkTxSudtAmount(tx, 'generateCreateChequeTx sUDT amount not match!', assetAccountInfo)

    return tx
  }

  public static async generateClaimChequeTx(
    walletId: string,
    chequeCell: Output,
    changeAddress: string,
    fee: string = '0',
    feeRate: string = '0'
  ) {
    const receiverLockHash20 = chequeCell.lock.args.slice(0, 42)
    const allAddressInfos = await AddressService.getAddressesByWalletId(walletId)
    const receiverAddressInfo = allAddressInfos.find(info => {
      const lockHash = SystemScriptInfo.generateSecpScript(info.blake160).computeHash()
      return lockHash.startsWith(receiverLockHash20)
    })
    if (!receiverAddressInfo) {
      throw new Error('Receiver lock hash not found in wallet')
    }

    const receiverLockArgs = receiverAddressInfo?.blake160
    const senderLockHash = chequeCell.lock.args.slice(42)

    const senderInputsByLockHash = await CellsService.searchInputsByLockHash(senderLockHash)
    if (!senderInputsByLockHash.length) {
      throw new Error('sender input cell could not be found')
    }
    const chequeSenderLock = senderInputsByLockHash[0].lockScript()

    const acpCellCapacity = BigInt(142 * 10 ** 8)
    const assetAccountInfo = new AssetAccountInfo()

    const secpCellDep = await SystemScriptInfo.getInstance().getSecpCellDep()
    const sudtCellDep = assetAccountInfo.sudtCellDep
    const anyoneCanPayDep = assetAccountInfo.anyoneCanPayCellDep
    const chequeDep = assetAccountInfo.getChequeInfo().cellDep

    const chequeInput = Input.fromObject({
      previousOutput: chequeCell.outPoint!,
      since: '0',
      capacity: chequeCell.capacity,
      lock: chequeCell.lock,
      type: chequeCell.type,
      lockHash: chequeCell.lockHash,
      data: chequeCell.data,
    })

    const senderOutput = Output.fromObject({
      capacity: chequeCell.capacity,
      lock: chequeSenderLock!,
    })

    const tx = Transaction.fromObject({
      version: '0',
      cellDeps: [secpCellDep, sudtCellDep, anyoneCanPayDep, chequeDep],
      headerDeps: [],
      inputs: [chequeInput],
      outputs: [senderOutput],
      outputsData: [senderOutput.data],
      witnesses: [],
    })

    const receiverAcpScript = assetAccountInfo.generateAnyoneCanPayScript(receiverLockArgs)
    const receiverAcpCells = await CellsService.getACPCells(receiverAcpScript, chequeCell.type!)

    let requiredCapacity = BigInt(0)
    if (receiverAcpCells.length) {
      const originalReceiverAcpOutput = receiverAcpCells[0]

      const receiverAcpInputAmount = BufferUtils.readBigUInt128LE(originalReceiverAcpOutput.data)
      const chequeCellAmount = BufferUtils.readBigUInt128LE(chequeCell.data)
      const receiverAcpOutputAmount = receiverAcpInputAmount + chequeCellAmount

      const newReceiverAcpOutput = Output.fromObject({
        capacity: originalReceiverAcpOutput.capacity,
        lock: originalReceiverAcpOutput.lockScript(),
        type: originalReceiverAcpOutput.typeScript(),
        data: BufferUtils.writeBigUInt128LE(receiverAcpOutputAmount),
      })

      const receiverAcpInput = Input.fromObject({
        previousOutput: originalReceiverAcpOutput.outPoint(),
        since: '0',
        capacity: originalReceiverAcpOutput.capacity,
        lock: originalReceiverAcpOutput.lockScript(),
        type: originalReceiverAcpOutput.typeScript(),
        data: originalReceiverAcpOutput.data,
      })
      tx.inputs.push(receiverAcpInput)
      tx.outputs.push(newReceiverAcpOutput)
    } else {
      requiredCapacity = acpCellCapacity

      const receiverAcpOutput = Output.fromObject({
        capacity: acpCellCapacity.toString(),
        lock: receiverAcpScript,
        type: chequeCell.type,
        data: chequeCell.data,
      })

      tx.outputs.push(receiverAcpOutput)
    }

    tx.outputsData = tx.outputs.map(output => output.data || '0x')

    const baseSize: number = TransactionSize.tx(tx) + TransactionSize.secpLockWitness() * tx.inputs.length
    const { inputs, capacities, finalFee, hasChangeOutput } = await CellsService.gatherInputs(
      acpCellCapacity.toString(),
      walletId,
      fee,
      feeRate,
      baseSize,
      TransactionGenerator.CHANGE_OUTPUT_SIZE,
      TransactionGenerator.CHANGE_OUTPUT_DATA_SIZE
    )

    const finalFeeInt = BigInt(finalFee)
    tx.inputs.push(...inputs)
    tx.fee = finalFee

    if (hasChangeOutput) {
      const changeBlake160: string = AddressParser.toBlake160(changeAddress)

      const changeCapacity = BigInt(capacities) - finalFeeInt - requiredCapacity

      const output = new Output(changeCapacity.toString(), SystemScriptInfo.generateSecpScript(changeBlake160))

      tx.addOutput(output)
    }

    TransactionGenerator.checkTxCapacity(tx, 'generateClaimChequeTx capacity not match!')
    TransactionGenerator.checkTxSudtAmount(tx, 'generateClaimChequeTx sUDT amount not match!', assetAccountInfo)

    return tx
  }

  public static async generateWithdrawChequeTx(
    chequeCell: Output,
    fee: string = '0',
    feeRate: string = '0'
  ): Promise<Transaction> {
    const senderLockHash = '0x' + chequeCell.lock.args.slice(42)

    const assetAccountInfo = new AssetAccountInfo()
    const outputEntities = await CellsService.getOutputsByTransactionHash(chequeCell.outPoint!.txHash)
    const chequeSenderAcpOutput = outputEntities.find(
      output =>
        assetAccountInfo.isDefaultAnyoneCanPayScript(output.lockScript()) && output.typeHash === chequeCell.typeHash!
    )

    const chequeSenderLiveAcpOutputs = await CellsService.getLiveCellsByLockHash(chequeSenderAcpOutput!.lockHash)
    const chequeSenderLiveAcpCell = chequeSenderLiveAcpOutputs.find(
      output => output.typeHash === chequeSenderAcpOutput!.typeHash
    )

    if (!chequeSenderLiveAcpCell) {
      throw new Error('sender ACP cell not found')
    }

    const relativeEpoch = '0xa000000000000006'
    const chequeInput = Input.fromObject({
      previousOutput: chequeCell.outPoint!,
      since: relativeEpoch,
      capacity: chequeCell.capacity,
      lock: chequeCell.lock,
      type: chequeCell.type,
      lockHash: chequeCell.lockHash,
      data: chequeCell.data,
    })

    const chequeSenderAcpInput = Input.fromObject({
      previousOutput: chequeSenderLiveAcpCell.outPoint(),
      since: '0',
      capacity: chequeSenderLiveAcpCell.capacity,
      lock: chequeSenderLiveAcpCell.lockScript(),
      type: chequeSenderLiveAcpCell.typeScript(),
      data: chequeSenderLiveAcpCell.data,
    })

    const senderInputsByLockHash = await CellsService.searchInputsByLockHash(senderLockHash)
    const senderDefaultLockInput = senderInputsByLockHash[0]
    if (!senderDefaultLockInput) {
      throw new Error('sender default lock inputs could not be found')
    }

    const senderDefaultLockOutput = Output.fromObject({
      capacity: chequeCell.capacity,
      lock: senderDefaultLockInput.lockScript()!,
    })

    const senderAcpInputAmount = BufferUtils.readBigUInt128LE(chequeSenderAcpInput.data!)
    const chequeCellAmount = BufferUtils.readBigUInt128LE(chequeCell.data)
    const senderAcpOutputAmount = senderAcpInputAmount + chequeCellAmount

    const senderAcpOutput = Output.fromObject({
      capacity: chequeSenderAcpInput.capacity!,
      lock: chequeSenderAcpInput.lock!,
      type: chequeSenderAcpInput.type!,
      data: BufferUtils.writeBigUInt128LE(senderAcpOutputAmount),
    })

    const secpCellDep = await SystemScriptInfo.getInstance().getSecpCellDep()
    const sudtCellDep = assetAccountInfo.sudtCellDep
    const anyoneCanPayDep = assetAccountInfo.anyoneCanPayCellDep
    const chequeDep = assetAccountInfo.getChequeInfo().cellDep

    const tx = Transaction.fromObject({
      version: '0',
      cellDeps: [secpCellDep, sudtCellDep, anyoneCanPayDep, chequeDep],
      headerDeps: [],
      inputs: [chequeSenderAcpInput, chequeInput],
      outputs: [senderAcpOutput],
      outputsData: [],
      witnesses: [],
    })

    tx.outputsData = tx.outputs.map(output => output.data || '0x')

    if (BigInt(fee) !== BigInt(0)) {
      tx.fee = fee
    } else {
      const txSize =
        TransactionSize.tx(tx) +
        TransactionSize.output(senderDefaultLockOutput) +
        TransactionSize.outputData('0x') +
        TransactionSize.secpLockWitness() * tx.inputs.length
      tx.fee = TransactionFee.fee(txSize, BigInt(feeRate)).toString()
    }

    const capacityAfterFee = BigInt(senderDefaultLockOutput.capacity) - BigInt(tx.fee)
    senderDefaultLockOutput.capacity = capacityAfterFee.toString()
    tx.outputs.push(senderDefaultLockOutput)
    tx.outputsData.push('0x')

    TransactionGenerator.checkTxCapacity(tx, 'generateWithdrawChequeTx capacity not match!')
    TransactionGenerator.checkTxSudtAmount(tx, 'generateWithdrawChequeTx sUDT amount not match!', assetAccountInfo)

    return tx
  }

  public static async generateSudtMigrateAcpTx(
    sudtCell: Output,
    acpAddress?: string,
    fee: string = '0',
    feeRate: string = '1000'
  ) {
    const currentWallet = WalletService.getInstance().getCurrent()
    if (!currentWallet) {
      throw new CurrentWalletNotSet()
    }
    const inputSudtCell = new Output(
      sudtCell.capacity,
      sudtCell.lock,
      sudtCell.type,
      sudtCell.data,
      sudtCell.lockHash,
      sudtCell.typeHash,
      sudtCell.outPoint,
      sudtCell.status,
      sudtCell.daoData,
      sudtCell.timestamp,
      sudtCell.blockNumber,
      sudtCell.blockHash,
      sudtCell.depositOutPoint,
      sudtCell.depositTimestamp,
      sudtCell.multiSignBlake160
    )
    const assetAccountInfo = new AssetAccountInfo()
    const sudtMigrateAcpInputs = [
      Input.fromObject({
        previousOutput: inputSudtCell.outPoint!,
        capacity: inputSudtCell.capacity,
        lock: inputSudtCell.lock,
        type: inputSudtCell.type,
        lockHash: inputSudtCell.lockHash,
        data: inputSudtCell.data,
        since: '0',
      }),
    ]

    const secpCellDep = await SystemScriptInfo.getInstance().getSecpCellDep()
    const sudtCellDep = assetAccountInfo.sudtCellDep
    const anyoneCanPayDep = assetAccountInfo.anyoneCanPayCellDep
    let outputs: Output[] = []
    let acpInputCell: Input | null = null
    if (acpAddress) {
      if (!inputSudtCell.type) {
        throw new MigrateSudtCellNoTypeError()
      }
      const isMainnet = acpAddress.startsWith('ckb')
      const lumosOptions = isMainnet ? { config: config.predefined.LINA } : { config: config.predefined.AGGRON4 }
      const receiverAcpCell = await LiveCellService.getInstance().getOneByLockScriptAndTypeScript(
        Script.fromSDK(helpers.addressToScript(acpAddress, lumosOptions)),
        inputSudtCell.type
      )
      if (!receiverAcpCell) {
        throw new TargetOutputNotFoundError()
      }
      const receiverAcpInputAmount = BufferUtils.readBigUInt128LE(receiverAcpCell.data)
      const sudtCellAmount = BufferUtils.readBigUInt128LE(inputSudtCell.data)
      const receiverAcpOutputAmount = receiverAcpInputAmount + sudtCellAmount
      inputSudtCell.setData('0x')
      inputSudtCell.setType(null)
      outputs = [
        inputSudtCell,
        Output.fromObject({
          capacity: receiverAcpCell.capacity,
          lock: receiverAcpCell.lock(),
          type: receiverAcpCell.type(),
          data: BufferUtils.writeBigUInt128LE(receiverAcpOutputAmount),
        }),
      ]
      acpInputCell = Input.fromObject({
        previousOutput: receiverAcpCell.outPoint(),
        capacity: receiverAcpCell.capacity,
        lock: receiverAcpCell.lock(),
        type: receiverAcpCell.type(),
        lockHash: receiverAcpCell.lockHash,
        data: receiverAcpCell.data,
        since: '0',
      })
      sudtMigrateAcpInputs.push(acpInputCell)
    } else {
      const addresses = await currentWallet.getNextReceivingAddresses()
      const usedBlake160s = new Set(
        currentWallet.isHDWallet() ? await AssetAccountService.blake160sOfAssetAccounts() : []
      )
      const addrObj = addresses.find(a => !usedBlake160s.has(a.blake160))!
      inputSudtCell.setLock(assetAccountInfo.generateAnyoneCanPayScript(addrObj.blake160))
      outputs = [inputSudtCell]
    }

    const tx = Transaction.fromObject({
      version: '0',
      headerDeps: [],
      cellDeps: [secpCellDep, sudtCellDep, anyoneCanPayDep],
      inputs: sudtMigrateAcpInputs,
      outputs: outputs,
      outputsData: outputs.map(v => v.data || '0x'),
      witnesses: [],
    })

    const txSize = TransactionSize.tx(tx) + TransactionSize.secpLockWitness() * tx.inputs.length
    tx.fee = TransactionFee.fee(txSize, BigInt(feeRate)).toString()
    const outputCapacity = BigInt(inputSudtCell.capacity) - BigInt(tx.fee)
    if (outputCapacity >= BigInt(MIN_SUDT_CAPACITY)) {
      tx.outputs[0].capacity = outputCapacity.toString()
      return tx
    }
    tx.inputs = []
    const baseSize: number = TransactionSize.tx(tx)

    const { inputs, capacities, finalFee, hasChangeOutput } = await CellsService.gatherInputs(
      '0',
      currentWallet.id,
      fee,
      feeRate,
      baseSize,
      TransactionGenerator.CHANGE_OUTPUT_SIZE,
      TransactionGenerator.CHANGE_OUTPUT_DATA_SIZE,
      sudtMigrateAcpInputs.map(v => ({
        input: v,
        witness: WitnessArgs.emptyLock(),
      }))
    )
    const finalFeeInt = BigInt(finalFee)

    if (finalFeeInt === BigInt(0)) {
      throw new LiveCapacityNotEnough()
    }

    if (acpInputCell) {
      // if migrate to exist address, the exist address cell should at last
      tx.inputs = inputs.sort((a, b) =>
        a.lockHash === acpInputCell!.lockHash ? 1 : b.lockHash === acpInputCell?.lockHash ? -1 : 0
      )
    } else {
      tx.inputs = inputs
    }
    tx.fee = finalFee

    if (hasChangeOutput) {
      const unusedChangeAddress = await currentWallet.getNextChangeAddress()
      const changeBlake160: string = AddressParser.toBlake160(unusedChangeAddress!.address)
      const changeCapacity = BigInt(capacities) - finalFeeInt
      const changeOutput = new Output(changeCapacity.toString(), SystemScriptInfo.generateSecpScript(changeBlake160))
      tx.addOutput(changeOutput)
    }
    return tx
  }

  private static checkTxCapacity(tx: Transaction, msg: string) {
    const inputCapacity = tx.inputs.map(i => BigInt(i.capacity!)).reduce((result, c) => result + c, BigInt(0))
    const outputCapacity = tx.outputs.map(o => BigInt(o.capacity!)).reduce((result, c) => result + c, BigInt(0))
    assert.equal(
      inputCapacity.toString(),
      (outputCapacity + BigInt(tx.fee!)).toString(),
      `${msg}: ${JSON.stringify(tx)}`
    )
  }

  private static checkTxSudtAmount(tx: Transaction, msg: string, assetAccountInfo: AssetAccountInfo) {
    const inputAmount = tx.inputs
      .filter(i => i.type && assetAccountInfo.isSudtScript(i.type))
      .map(i => BufferUtils.parseAmountFromSUDTData(i.data!))
      .reduce((result, c) => result + c, BigInt(0))

    const outputAmount = tx.outputs
      .filter(o => o.type && assetAccountInfo.isSudtScript(o.type))
      .map(o => BufferUtils.parseAmountFromSUDTData(o.data!))
      .reduce((result, c) => result + c, BigInt(0))

    assert.equal(inputAmount.toString(), outputAmount.toString(), `${msg}: ${JSON.stringify(tx)}`)
  }
}

export default TransactionGenerator
