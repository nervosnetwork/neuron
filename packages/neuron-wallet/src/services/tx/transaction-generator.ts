import CellsService from 'services/cells'
import { CapacityTooSmall } from 'exceptions'
import FeeMode from 'models/fee-mode'
import TransactionSize from 'models/transaction-size'
import TransactionFee from 'models/transaction-fee'
import { CapacityNotEnough } from 'exceptions/wallet'
import Output from 'models/chain/output'
import Input from 'models/chain/input'
import OutPoint from 'models/chain/out-point'
import Script from 'models/chain/script'
import Transaction from 'models/chain/transaction'
import WitnessArgs from 'models/chain/witness-args'
import AddressParser from 'models/address-parser'
import MultiSign from 'models/multi-sign'
import RpcService from 'services/rpc-service'
import NodeService from 'services/node'
import BlockHeader from 'models/chain/block-header'
import SystemScriptInfo from 'models/system-script-info'
import ArrayUtils from 'utils/array'
import AssetAccountInfo from 'models/asset-account-info'
import BufferUtils from 'utils/buffer'

export interface TargetOutput {
  address: string
  capacity: string
  date?: string // timestamp
}

export class TransactionGenerator {
  public static CHANGE_OUTPUT_SIZE = 101
  public static CHANGE_OUTPUT_DATA_SIZE = 8

  public static generateTx = async (
    lockHashes: string[],
    targetOutputs: TargetOutput[],
    changeAddress: string,
    fee: string = '0',
    feeRate: string = '0'
  ): Promise<Transaction> => {
    const secpCellDep = await SystemScriptInfo.getInstance().getSecpCellDep()
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
        const script = SystemScriptInfo.generateMultiSignScript(new MultiSign().args(blake160, +minutes, tipHeaderEpoch))
        output.setLock(script)
        output.setMultiSignBlake160(script.args.slice(0, 42))
      }

      const outputSize = output.calculateBytesize()
      if (BigInt(capacity) < BigInt(outputSize) * BigInt(10**8)) {
        throw new CapacityTooSmall(outputSize.toString())
      }

      return output
    })

    const tx = Transaction.fromObject({
      version: '0',
      cellDeps: [secpCellDep],
      headerDeps: [],
      inputs: [],
      outputs,
      outputsData: outputs.map(output => output.data || '0x'),
      witnesses: [],
    })

  const baseSize: number = TransactionSize.tx(tx)
  const {
    inputs,
    capacities,
    finalFee,
    hasChangeOutput,
  } = await CellsService.gatherInputs(
    needCapacities.toString(),
    lockHashes,
    fee,
    feeRate,
    baseSize,
    TransactionGenerator.CHANGE_OUTPUT_SIZE,
    TransactionGenerator.CHANGE_OUTPUT_DATA_SIZE,
  )
  const finalFeeInt = BigInt(finalFee)
  tx.inputs = inputs
  tx.fee = finalFee

  // change
  if (hasChangeOutput) {
    const changeBlake160: string = AddressParser.toBlake160(changeAddress)

    const changeCapacity = BigInt(capacities) - needCapacities - finalFeeInt

    const output = new Output(
      changeCapacity.toString(),
      SystemScriptInfo.generateSecpScript(changeBlake160)
    )

    tx.addOutput(output)
  }

  tx.outputs = ArrayUtils.shuffle(tx.outputs)
  tx.outputsData = tx.outputs.map(output => output.data || '0x')

  return tx
}

// rest of capacity all send to last target output.
public static generateSendingAllTx = async (
  lockHashes: string[],
  targetOutputs: TargetOutput[],
  fee: string = '0',
  feeRate: string = '0'
): Promise<Transaction> => {
  const secpCellDep = await SystemScriptInfo.getInstance().getSecpCellDep()
  const tipHeader = await TransactionGenerator.getTipHeader()
  const tipHeaderEpoch = tipHeader.epoch
  const tipHeaderTimestamp = tipHeader.timestamp

  const feeInt = BigInt(fee)
  const feeRateInt = BigInt(feeRate)
  const mode = new FeeMode(feeRateInt)

  const allInputs: Input[] = await CellsService.gatherAllInputs(lockHashes)

  if (allInputs.length === 0) {
    throw new CapacityNotEnough()
  }

  const totalCapacity: bigint = allInputs
    .map(input => BigInt(input.capacity))
    .reduce((result, c) => result + c, BigInt(0))

  const outputs: Output[] = targetOutputs.map((o, index) => {
    const { capacity, address, date } = o

    const lockScript: Script = AddressParser.parse(address)

    const output = new Output(capacity, lockScript)
    if (date) {
      const blake160 = lockScript.args
        const minutes: number = +((BigInt(date) - BigInt(tipHeaderTimestamp)) / BigInt(1000 * 60)).toString()
        const script: Script = SystemScriptInfo.generateMultiSignScript(new MultiSign().args(blake160, minutes, tipHeaderEpoch))
        output.setLock(script)
        output.setMultiSignBlake160(script.args.slice(0, 42))
      }

      // skip last output
      const outputSize = output.calculateBytesize()
      if (BigInt(capacity) < (BigInt(outputSize) * BigInt(10**8)) && index !== targetOutputs.length - 1) {
        throw new CapacityTooSmall(outputSize.toString())
      }

      return output
    })

    const tx = Transaction.fromObject({
      version: '0',
      cellDeps: [secpCellDep],
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
      const txSize: number = TransactionSize.tx(tx) +
        TransactionSize.secpLockWitness() * keyCount +
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
    if (tx.outputs.map(o => BigInt(o.capacity)).reduce((result, c) => result + c, BigInt(0)) + finalFee !== totalCapacity) {
      throw new Error('generateSendingAllTx Error')
    }

    return tx
  }

  private static async getTipHeader(): Promise<BlockHeader> {
    const rpcService = new RpcService(NodeService.getInstance().ckb.node.url)
    const tipHeader = await rpcService.getTipHeader()
    return tipHeader
  }

  public static generateDepositTx = async (
    lockHashes: string[],
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
      cellDeps: [
        secpCellDep,
        daoCellDep
      ],
      headerDeps: [],
      inputs: [],
      outputs,
      outputsData: outputs.map(output => output.data || '0x'),
      witnesses: []
    })

    const baseSize: number = TransactionSize.tx(tx)

    const {
      inputs,
      capacities,
      finalFee,
      hasChangeOutput,
    } = await CellsService.gatherInputs(
      capacityInt.toString(),
      lockHashes,
      fee,
      feeRate,
      baseSize,
      TransactionGenerator.CHANGE_OUTPUT_SIZE,
      TransactionGenerator.CHANGE_OUTPUT_DATA_SIZE,
    )
    const finalFeeInt = BigInt(finalFee)
    tx.inputs = inputs

    // change
    if (hasChangeOutput) {
      const changeBlake160: string = AddressParser.toBlake160(changeAddress)

      const changeCapacity = BigInt(capacities) - capacityInt - finalFeeInt

      const changeOutput = new Output(
        changeCapacity.toString(),
        SystemScriptInfo.generateSecpScript(changeBlake160)
      )

      tx.addOutput(changeOutput)
    }

    tx.fee = finalFee

    return tx
  }

  public static generateDepositAllTx = async (
    lockHashes: string[],
    receiveAddress: string,
    fee: string = '0',
    feeRate: string = '0'
  ): Promise<Transaction> => {
    const secpCellDep = await SystemScriptInfo.getInstance().getSecpCellDep()
    const daoCellDep = await SystemScriptInfo.getInstance().getDaoCellDep()
    const blake160: string = AddressParser.toBlake160(receiveAddress)

    const feeInt = BigInt(fee)
    const feeRateInt = BigInt(feeRate)
    const mode = new FeeMode(feeRateInt)

    const allInputs: Input[] = await CellsService.gatherAllInputs(lockHashes)
    if (allInputs.length === 0) {
      throw new CapacityNotEnough()
    }
    const totalCapacity: bigint = allInputs
      .map(input => BigInt(input.capacity))
      .reduce((result, c) => result + c, BigInt(0))

    const output = new Output(
      totalCapacity.toString(),
      SystemScriptInfo.generateSecpScript(blake160),
      SystemScriptInfo.generateDaoScript('0x')
    )
    output.setDaoData('0x0000000000000000')

    const outputs: Output[] = [output]

    const tx = Transaction.fromObject({
      version: '0',
      cellDeps: [
        secpCellDep,
        daoCellDep
      ],
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
      const txSize: number = TransactionSize.tx(tx) +
        TransactionSize.secpLockWitness() * keyCount +
        TransactionSize.emptyWitness() * (allInputs.length - keyCount)
      finalFee = TransactionFee.fee(txSize, feeRateInt)
    }

    tx.outputs[0].capacity = (BigInt(output.capacity) - finalFee).toString()
    tx.fee = finalFee.toString()

    return tx
  }

  public static startWithdrawFromDao = async (
    lockHashes: string[],
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
      cellDeps: [
        secpCellDep,
        daoCellDep
      ],
      headerDeps: [
        depositBlockHash,
      ],
      inputs: [],
      outputs,
      outputsData: outputs.map(o => o.data || '0x'),
      witnesses: [],
    })

    const baseSize: number = TransactionSize.tx(tx)

    const input = new Input(
      outPoint,
      '0',
      output.capacity,
      output.lock,
    )

    const append = {
      input,
      witness: WitnessArgs.emptyLock()
    }

    const {
      inputs,
      capacities,
      finalFee,
      hasChangeOutput,
    } = await CellsService.gatherInputs(
      '0',
      lockHashes,
      fee,
      feeRate,
      baseSize,
      TransactionGenerator.CHANGE_OUTPUT_SIZE,
      TransactionGenerator.CHANGE_OUTPUT_DATA_SIZE,
      append
    )
    const finalFeeInt = BigInt(finalFee)

    tx.inputs = inputs
    tx.fee = finalFee

    // change
    if (hasChangeOutput) {
      const changeBlake160: string = AddressParser.toBlake160(changeAddress)
      const changeCapacity = BigInt(capacities) - finalFeeInt

      const changeOutput = new Output(
        changeCapacity.toString(),
        SystemScriptInfo.generateSecpScript(changeBlake160)
      )

      tx.addOutput(changeOutput)
    }

    return tx
  }

  public static async generateWithdrawMultiSignTx(
    outPoint: OutPoint,
    prevOutput: Output,
    receivingAddress: string,
    fee: string,
    feeRate: string,
  ): Promise<Transaction> {
    const multiSignCellDep = await SystemScriptInfo.getInstance().getMultiSignCellDep()

    const feeRateInt = BigInt(feeRate)
    const mode = new FeeMode(feeRateInt)

    const lockScript = AddressParser.parse(receivingAddress)

    // const outputs: Output[] = [output]
    const output = Output.fromObject({
      capacity: prevOutput.capacity,
      lock: lockScript
    })

    const since = new MultiSign().parseSince(prevOutput.lock.args)

    const input = new Input(
      outPoint,
      since.toString(),
      prevOutput.capacity,
      prevOutput.lock,
    )
    const tx = Transaction.fromObject({
      version: '0',
      cellDeps: [
        multiSignCellDep
      ],
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
    lockHashes: string[],
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
    const needCapacities = isCKB ? BigInt(61 * 10**8) : BigInt(142 * 10**8)
    const output = Output.fromObject({
      capacity: needCapacities.toString(),
      lock: assetAccountInfo.generateAnyoneCanPayScript(blake160),
      type: isCKB ? null : assetAccountInfo.generateSudtScript(tokenID),
      data: isCKB ? '0x' : BufferUtils.writeBigUInt128LE(BigInt(0)),
    })
    const tx =  Transaction.fromObject({
      version: '0',
      headerDeps: [],
      cellDeps: [secpCellDep, sudtCellDep],
      inputs: [],
      outputs: [output],
      outputsData: [output.data],
      witnesses: []
    })
    const baseSize: number = TransactionSize.tx(tx)
    const {
      inputs,
      capacities,
      finalFee,
      hasChangeOutput
    } = await CellsService.gatherInputs(
      needCapacities.toString(),
      lockHashes,
      fee,
      feeRate,
      baseSize,
      TransactionGenerator.CHANGE_OUTPUT_SIZE,
      TransactionGenerator.CHANGE_OUTPUT_DATA_SIZE,
    )
    const finalFeeInt = BigInt(finalFee)
    tx.inputs = inputs
    tx.fee = finalFee

    // change
    if (hasChangeOutput) {
      const changeCapacity = BigInt(capacities) - needCapacities - finalFeeInt

      const output = Output.fromObject({
        capacity: changeCapacity.toString(),
        lock: SystemScriptInfo.generateSecpScript(changeBlake160)
      })

      tx.addOutput(output)
    }

    return tx
  }

  // anyone-can-pay lock, CKB
  public static async generateAnyoneCanPayToCKBTx(
    defaultLockHashes: string[],
    anyoneCanPayLockHashes: string[],
    targetOutput: Output,
    capacity: string,
    changeBlake160: string,
    feeRate: string = '0',
    fee: string = '0',
  ) {
    const secpCellDep = await SystemScriptInfo.getInstance().getSecpCellDep()
    const assetAccountInfo = new AssetAccountInfo()
    const anyoneCanPayDep = assetAccountInfo.anyoneCanPayCellDep
    const needCapacities: bigint = BigInt(targetOutput.capacity) + BigInt(capacity)
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
    const tx =  Transaction.fromObject({
      version: '0',
      headerDeps: [],
      cellDeps: [secpCellDep, anyoneCanPayDep],
      inputs: [targetInput],
      outputs: [output],
      outputsData: [output.data],
      witnesses: []
    })

    const baseSize: number = TransactionSize.tx(tx)
    const result = await CellsService.gatherAnyoneCanPayCKBInputs(
      capacity,
      defaultLockHashes,
      anyoneCanPayLockHashes,
      changeBlake160,
      fee,
      feeRate,
      baseSize,
      TransactionGenerator.CHANGE_OUTPUT_SIZE,
      TransactionGenerator.CHANGE_OUTPUT_DATA_SIZE,
    )
    tx.inputs = result.anyoneCanPayInputs.concat(result.changeInputs).concat(tx.inputs)
    tx.outputs = result.anyoneCanPayOutputs.concat(tx.outputs)
    if (result.changeOutput) {
      tx.outputs.push(result.changeOutput)
    }
    tx.outputsData = tx.outputs.map(o => o.data)
    tx.fee = result.finalFee

    return tx
  }

  // anyone-can-pay lock, sUDT
  public static async generateAnyoneCanPayToSudtTx(
    defaultLockHashes: string[],
    anyoneCanPayLockHashes: string[],
    targetOutput: Output,
    amount: string,
    changeBlake160: string,
    feeRate: string = '0',
    fee: string = '0',
  ) {
    const secpCellDep = await SystemScriptInfo.getInstance().getSecpCellDep()
    const assetAccountInfo = new AssetAccountInfo()
    const sudtCellDep = assetAccountInfo.sudtCellDep
    const anyoneCanPayDep = assetAccountInfo.anyoneCanPayCellDep
    const targetAmount: bigint = BufferUtils.readBigUInt128LE(targetOutput.data) + BigInt(amount)
    const output = Output.fromObject({
      ...targetOutput,
      data: BufferUtils.writeBigUInt128LE(targetAmount),
    })
    const targetInput = Input.fromObject({
      previousOutput: targetOutput.outPoint!,
      since: '0',
      capacity: targetOutput.capacity,
      lock: targetOutput.lock,
      lockHash: targetOutput.lockHash,
    })
    const tx =  Transaction.fromObject({
      version: '0',
      headerDeps: [],
      cellDeps: [secpCellDep, sudtCellDep, anyoneCanPayDep],
      inputs: [targetInput],
      outputs: [output],
      outputsData: [output.data],
      witnesses: []
    })

    const baseSize: number = TransactionSize.tx(tx)
    const result = await CellsService.gatherSudtInputs(
      amount,
      defaultLockHashes,
      anyoneCanPayLockHashes,
      targetOutput.typeHash!,
      changeBlake160,
      fee,
      feeRate,
      baseSize,
      TransactionGenerator.CHANGE_OUTPUT_SIZE,
      TransactionGenerator.CHANGE_OUTPUT_DATA_SIZE,
    )
    tx.inputs = result.anyoneCanPayInputs.concat(result.changeInputs).concat(tx.inputs)
    tx.outputs = result.anyoneCanPayOutputs.concat(tx.outputs)
    if (result.changeOutput) {
      tx.outputs.push(result.changeOutput)
    }
    tx.outputsData = tx.outputs.map(o => o.data)
    tx.fee = result.finalFee

    return tx
  }
}

export default TransactionGenerator
