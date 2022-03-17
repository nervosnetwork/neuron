import WalletService, { Wallet } from 'services/wallets'
import WalletsService from 'services/wallets'
import NodeService from './node'
import { serializeWitnessArgs, toUint64Le } from '@nervosnetwork/ckb-sdk-utils'
import { TransactionPersistor, TransactionGenerator, TargetOutput } from './tx'
import AddressService from './addresses'
import { Address } from 'models/address'
import { PathAndPrivateKey } from 'models/keys/key'
import { CellIsNotYetLive, TransactionIsNotCommittedYet } from 'exceptions/dao'
import FeeMode from 'models/fee-mode'
import TransactionSize from 'models/transaction-size'
import TransactionFee from 'models/transaction-fee'
import logger from 'utils/logger'
import Keychain from 'models/keys/keychain'
import Input from 'models/chain/input'
import OutPoint from 'models/chain/out-point'
import Output from 'models/chain/output'
import RpcService from 'services/rpc-service'
import WitnessArgs from 'models/chain/witness-args'
import Transaction from 'models/chain/transaction'
import BlockHeader from 'models/chain/block-header'
import Script from 'models/chain/script'
import MultiSign from 'models/multi-sign'
import Blake2b from 'models/blake2b'
import HexUtils from 'utils/hex'
import ECPair from '@nervosnetwork/ckb-sdk-utils/lib/ecpair'
import SystemScriptInfo from 'models/system-script-info'
import AddressParser from 'models/address-parser'
import HardwareWalletService from './hardware'
import { CapacityNotEnoughForChange, CapacityNotEnoughForChangeByTransfer, SignTransactionFailed } from 'exceptions'
import AssetAccountInfo from 'models/asset-account-info'

interface SignInfo {
  witnessArgs: WitnessArgs
  lockHash: string
  witness: string
  lockArgs: string
}

export default class TransactionSender {
  static MULTI_SIGN_ARGS_LENGTH = 58

  private walletService: WalletService

  constructor() {
    this.walletService = WalletsService.getInstance()
  }

  public async sendTx(
    walletID: string = '',
    transaction: Transaction,
    password: string = '',
    skipLastInputs: number = 0,
    skipSign = false
  ) {
    const tx = skipSign
      ? Transaction.fromObject(transaction)
      : await this.sign(walletID, transaction, password, skipLastInputs)

    return this.broadcastTx(walletID, tx)
  }

  public async broadcastTx(walletID: string = '', tx: Transaction) {
    const { ckb } = NodeService.getInstance()
    await ckb.rpc.sendTransaction(tx.toSDKRawTransaction(), 'passthrough')
    const txHash = tx.hash!

    await TransactionPersistor.saveSentTx(tx, txHash)

    const wallet = WalletService.getInstance().get(walletID)
    await wallet.checkAndGenerateAddresses()
    return txHash
  }

  public async sign(
    walletID: string = '',
    transaction: Transaction,
    password: string = '',
    skipLastInputs: number = 0,
    context?: RPC.RawTransaction[]
  ) {
    const wallet = this.walletService.get(walletID)
    const tx = Transaction.fromObject(transaction)
    const { ckb } = NodeService.getInstance()
    const txHash: string = tx.computeHash()
    if (wallet.isHardware()) {
      let device = HardwareWalletService.getInstance().getCurrent()
      if (!device) {
        const wallet = WalletsService.getInstance().getCurrent()
        const deviceInfo = wallet!.getDeviceInfo()
        device = await HardwareWalletService.getInstance().initHardware(deviceInfo)
        await device.connect()
      }
      try {
        return await device.signTx(walletID, tx, txHash, skipLastInputs, context)
      } catch (err) {
        if (err instanceof TypeError) {
          throw err
        }
        throw new SignTransactionFailed(err.message)
      }
    }

    // Only one multi sign input now.
    const isMultiSign =
      tx.inputs.length === 1 && tx.inputs[0].lock!.args.length === TransactionSender.MULTI_SIGN_ARGS_LENGTH

    const addressInfos = await this.getAddressInfos(walletID)
    const multiSignBlake160s = isMultiSign
      ? addressInfos.map(i => {
          return {
            multiSignBlake160: new MultiSign().hash(i.blake160),
            path: i.path
          }
        })
      : []
    const paths = addressInfos.map(info => info.path)
    const pathAndPrivateKeys = this.getPrivateKeys(wallet, paths, password)
    const findPrivateKey = (args: string) => {
      let path: string | undefined
      if (args.length === TransactionSender.MULTI_SIGN_ARGS_LENGTH) {
        path = multiSignBlake160s.find(i => args.slice(0, 42) === i.multiSignBlake160)!.path
      } else if (args.length === 42) {
        path = addressInfos.find(i => i.blake160 === args)!.path
      } else {
        const addressInfo = AssetAccountInfo.findSignPathForCheque(addressInfos, args)
        path = addressInfo?.path
      }

      const pathAndPrivateKey = pathAndPrivateKeys.find(p => p.path === path)
      if (!pathAndPrivateKey) {
        throw new Error('no private key found')
      }
      return pathAndPrivateKey.privateKey
    }

    const witnessSigningEntries: SignInfo[] = tx.inputs
      .slice(0, tx.inputs.length - skipLastInputs)
      .map((input: Input, index: number) => {
        const lockArgs: string = input.lock!.args!
        const wit: WitnessArgs | string = tx.witnesses[index]
        const witnessArgs: WitnessArgs = wit instanceof WitnessArgs ? wit : WitnessArgs.generateEmpty()
        return {
          // TODO: fill in required DAO's type witness here
          witnessArgs,
          lockHash: input.lockHash!,
          witness: '',
          lockArgs
        }
      })

    const lockHashes = new Set(witnessSigningEntries.map(w => w.lockHash))

    for (const lockHash of lockHashes) {
      const witnessesArgs = witnessSigningEntries.filter(w => w.lockHash === lockHash)
      // A 65-byte empty signature used as placeholder
      witnessesArgs[0].witnessArgs.setEmptyLock()

      const privateKey = findPrivateKey(witnessesArgs[0].lockArgs)

      const serializedWitnesses: (WitnessArgs | string)[] = witnessesArgs.map((value: SignInfo, index: number) => {
        const args = value.witnessArgs
        if (index === 0) {
          return args
        }
        if (args.lock === undefined && args.inputType === undefined && args.outputType === undefined) {
          return '0x'
        }
        return serializeWitnessArgs(args.toSDK())
      })
      let signed: (string | CKBComponents.WitnessArgs | WitnessArgs)[] = []

      if (isMultiSign) {
        const blake160 = addressInfos.find(
          i => witnessesArgs[0].lockArgs.slice(0, 42) === new MultiSign().hash(i.blake160)
        )!.blake160
        const serializedMultiSign: string = new MultiSign().serialize([blake160])
        signed = await TransactionSender.signSingleMultiSignScript(
          privateKey,
          serializedWitnesses,
          txHash,
          serializedMultiSign,
          wallet
        )
        const wit = signed[0] as WitnessArgs
        wit.lock = serializedMultiSign + wit.lock!.slice(2)
        signed[0] = serializeWitnessArgs(wit.toSDK())
      } else {
        signed = ckb.signWitnesses(privateKey)({
          transactionHash: txHash,
          witnesses: serializedWitnesses.map(wit => {
            if (typeof wit === 'string') {
              return wit
            }
            return wit.toSDK()
          })
        })
      }

      for (let i = 0; i < witnessesArgs.length; ++i) {
        witnessesArgs[i].witness = signed[i] as string
      }
    }

    tx.witnesses = witnessSigningEntries.map(w => w.witness)
    tx.hash = txHash

    return tx
  }

  public static async signSingleMultiSignScript(
    privateKeyOrPath: string,
    witnesses: (string | WitnessArgs)[],
    txHash: string,
    serializedMultiSign: string,
    wallet: Wallet
  ) {
    const firstWitness = witnesses[0]
    if (typeof firstWitness === 'string') {
      throw new Error('First witness must be WitnessArgs')
    }
    const restWitnesses = witnesses.slice(1)

    const emptyWitness = WitnessArgs.fromObject({
      ...firstWitness,
      lock: `0x` + serializedMultiSign.slice(2) + '0'.repeat(130)
    })
    const serializedEmptyWitness = serializeWitnessArgs(emptyWitness.toSDK())
    const serialziedEmptyWitnessSize = HexUtils.byteLength(serializedEmptyWitness)
    const blake2b = new Blake2b()
    blake2b.update(txHash)
    blake2b.update(toUint64Le(`0x${serialziedEmptyWitnessSize.toString(16)}`))
    blake2b.update(serializedEmptyWitness)

    restWitnesses.forEach(w => {
      const wit: string = typeof w === 'string' ? w : serializeWitnessArgs(w.toSDK())
      const byteLength = HexUtils.byteLength(wit)
      blake2b.update(toUint64Le(`0x${byteLength.toString(16)}`))
      blake2b.update(wit)
    })

    const message = blake2b.digest()

    if (!wallet.isHardware()) {
      const keyPair = new ECPair(privateKeyOrPath)
      emptyWitness.lock = keyPair.signRecoverable(message)
    }

    return [emptyWitness, ...restWitnesses]
  }

  public generateTx = async (
    walletID: string = '',
    items: TargetOutput[] = [],
    fee: string = '0',
    feeRate: string = '0'
  ): Promise<Transaction> => {
    const targetOutputs = items.map(item => ({
      ...item,
      capacity: BigInt(item.capacity).toString()
    }))

    const changeAddress: string = await this.getChangeAddress()

    try {
      const tx: Transaction = await TransactionGenerator.generateTx(
        walletID,
        targetOutputs,
        changeAddress,
        fee,
        feeRate
      )

      return tx
    } catch (error) {
      if (error instanceof CapacityNotEnoughForChange) {
        throw new CapacityNotEnoughForChangeByTransfer()
      }
      throw error
    }
  }

  public generateSendingAllTx = async (
    walletID: string = '',
    items: TargetOutput[] = [],
    fee: string = '0',
    feeRate: string = '0'
  ): Promise<Transaction> => {
    const targetOutputs = items.map(item => ({
      ...item,
      capacity: BigInt(item.capacity).toString()
    }))

    const tx: Transaction = await TransactionGenerator.generateSendingAllTx(walletID, targetOutputs, fee, feeRate)

    return tx
  }

  public generateTransferNftTx = async (
    walletId: string,
    outPoint: OutPoint,
    receiveAddress: string,
    fee: string = '0',
    feeRate: string = '0'
  ): Promise<Transaction> => {
    const changeAddress: string = await this.getChangeAddress()
    const url: string = NodeService.getInstance().ckb.node.url
    const rpcService = new RpcService(url)
    // for some reason with data won't work
    const cellWithStatus = await rpcService.getLiveCell(new OutPoint(outPoint.txHash, outPoint.index), true)
    const prevOutput = cellWithStatus.cell!.output
    if (!cellWithStatus.isLive()) {
      throw new CellIsNotYetLive()
    }

    const tx = await TransactionGenerator.generateTransferNftTx(
      walletId,
      outPoint,
      prevOutput,
      receiveAddress,
      changeAddress,
      fee,
      feeRate
    )

    return tx
  }

  public generateDepositTx = async (
    walletID: string = '',
    capacity: string,
    fee: string = '0',
    feeRate: string = '0'
  ): Promise<Transaction> => {
    const wallet = WalletService.getInstance().get(walletID)

    const address = await wallet.getNextAddress()

    const changeAddress: string = await this.getChangeAddress()

    const tx = await TransactionGenerator.generateDepositTx(
      walletID,
      capacity,
      address!.address,
      changeAddress,
      fee,
      feeRate
    )

    return tx
  }

  public startWithdrawFromDao = async (
    walletID: string,
    outPoint: OutPoint,
    fee: string = '0',
    feeRate: string = '0'
  ): Promise<Transaction> => {
    // only for check wallet exists
    this.walletService.get(walletID)

    const url: string = NodeService.getInstance().ckb.node.url
    const rpcService = new RpcService(url)
    const cellWithStatus = await rpcService.getLiveCell(outPoint, false)
    if (!cellWithStatus.isLive()) {
      throw new CellIsNotYetLive()
    }
    const prevTx = await rpcService.getTransaction(outPoint.txHash)
    if (!prevTx || !prevTx.txStatus.isCommitted()) {
      throw new TransactionIsNotCommittedYet()
    }

    const depositBlockHeader = await rpcService.getHeader(prevTx.txStatus.blockHash!)

    const wallet = WalletService.getInstance().get(walletID)
    const changeAddress = await wallet.getNextChangeAddress()
    const prevOutput = cellWithStatus.cell!.output
    const tx: Transaction = await TransactionGenerator.startWithdrawFromDao(
      walletID,
      outPoint,
      prevOutput,
      depositBlockHeader!.number,
      depositBlockHeader!.hash,
      changeAddress!.address,
      fee,
      feeRate
    )

    return tx
  }

  public withdrawFromDao = async (
    walletID: string,
    depositOutPoint: OutPoint,
    withdrawingOutPoint: OutPoint,
    fee: string = '0',
    feeRate: string = '0'
  ): Promise<Transaction> => {
    const DAO_LOCK_PERIOD_EPOCHS = BigInt(180)

    const feeInt = BigInt(fee)
    const feeRateInt = BigInt(feeRate)
    const mode = new FeeMode(feeRateInt)

    const url: string = NodeService.getInstance().ckb.node.url
    const rpcService = new RpcService(url)

    const cellStatus = await rpcService.getLiveCell(withdrawingOutPoint, true)
    if (!cellStatus.isLive()) {
      throw new CellIsNotYetLive()
    }
    const prevTx = (await rpcService.getTransaction(withdrawingOutPoint.txHash))!
    if (!prevTx.txStatus.isCommitted()) {
      throw new TransactionIsNotCommittedYet()
    }

    const secpCellDep = await SystemScriptInfo.getInstance().getSecpCellDep()
    const daoCellDep = await SystemScriptInfo.getInstance().getDaoCellDep()

    const content = cellStatus.cell!.data!.content
    const buf = Buffer.from(content.slice(2), 'hex')
    const depositBlockNumber: bigint = buf.readBigUInt64LE()
    const depositBlockHeader: BlockHeader = (await rpcService.getHeaderByNumber(depositBlockNumber.toString()))!
    const depositEpoch = this.parseEpoch(BigInt(depositBlockHeader.epoch))
    const depositCapacity: bigint = BigInt(cellStatus.cell!.output.capacity)

    const withdrawBlockHeader = (await rpcService.getHeader(prevTx.txStatus.blockHash!))!
    const withdrawEpoch = this.parseEpoch(BigInt(withdrawBlockHeader.epoch))

    const withdrawFraction = withdrawEpoch.index * depositEpoch.length
    const depositFraction = depositEpoch.index * withdrawEpoch.length
    let depositedEpoches = withdrawEpoch.number - depositEpoch.number
    if (withdrawFraction > depositFraction) {
      depositedEpoches += BigInt(1)
    }
    const lockEpoches =
      ((depositedEpoches + (DAO_LOCK_PERIOD_EPOCHS - BigInt(1))) / DAO_LOCK_PERIOD_EPOCHS) * DAO_LOCK_PERIOD_EPOCHS
    const minimalSinceEpochNumber = depositEpoch.number + lockEpoches
    const minimalSinceEpochIndex = depositEpoch.index
    const minimalSinceEpochLength = depositEpoch.length

    const minimalSince = this.epochSince(minimalSinceEpochLength, minimalSinceEpochIndex, minimalSinceEpochNumber)

    const outputCapacity: bigint = await this.calculateDaoMaximumWithdraw(depositOutPoint, withdrawBlockHeader.hash)

    const wallet = WalletService.getInstance().get(walletID)
    const address = await wallet.getNextAddress()
    const blake160 = AddressParser.toBlake160(address!.address)

    const output: Output = new Output(
      outputCapacity.toString(),
      new Script(SystemScriptInfo.SECP_CODE_HASH, blake160, SystemScriptInfo.SECP_HASH_TYPE),
      undefined,
      '0x'
    )

    const outputs: Output[] = [output]

    const previousOutput = cellStatus.cell!.output
    const input: Input = new Input(
      withdrawingOutPoint,
      minimalSince.toString(),
      previousOutput.capacity,
      previousOutput.lock
    )

    const withdrawWitnessArgs: WitnessArgs = new WitnessArgs(WitnessArgs.EMPTY_LOCK, '0x0000000000000000')
    const tx: Transaction = Transaction.fromObject({
      version: '0',
      cellDeps: [secpCellDep, daoCellDep],
      headerDeps: [depositBlockHeader.hash, withdrawBlockHeader.hash],
      inputs: [input],
      outputs,
      outputsData: outputs.map(o => o.data || '0x'),
      witnesses: [withdrawWitnessArgs],
      interest: (BigInt(outputCapacity) - depositCapacity).toString()
    })
    if (mode.isFeeRateMode()) {
      const txSize: number = TransactionSize.tx(tx)
      const txFee: bigint = TransactionFee.fee(txSize, BigInt(feeRate))
      tx.fee = txFee.toString()
      tx.outputs[0].capacity = (outputCapacity - txFee).toString()
    } else {
      tx.fee = fee
      tx.outputs[0].capacity = (outputCapacity - feeInt).toString()
    }

    logger.debug('withdrawFromDao fee:', tx.fee)

    return tx
  }

  public generateDepositAllTx = async (
    walletID: string = '',
    isBalanceReserved = true,
    fee: string = '0',
    feeRate: string = '0'
  ): Promise<Transaction> => {
    const wallet = WalletService.getInstance().get(walletID)
    const receiveAddress = await wallet.getNextAddress()
    const changeAddress = await wallet.getNextChangeAddress()

    const tx = await TransactionGenerator.generateDepositAllTx(
      walletID,
      receiveAddress!.address,
      changeAddress!.address,
      isBalanceReserved,
      fee,
      feeRate
    )

    return tx
  }

  public async generateWithdrawMultiSignTx(
    walletID: string,
    outPoint: OutPoint,
    fee: string = '0',
    feeRate: string = '0'
  ) {
    // only for check wallet exists
    this.walletService.get(walletID)

    const url: string = NodeService.getInstance().ckb.node.url
    const rpcService = new RpcService(url)
    const cellWithStatus = await rpcService.getLiveCell(outPoint, false)
    if (!cellWithStatus.isLive()) {
      throw new CellIsNotYetLive()
    }
    const prevTx = await rpcService.getTransaction(outPoint.txHash)
    if (!prevTx || !prevTx.txStatus.isCommitted()) {
      throw new TransactionIsNotCommittedYet()
    }

    const wallet = WalletService.getInstance().get(walletID)
    const receivingAddressInfo = await wallet.getNextAddress()

    const receivingAddress = receivingAddressInfo!.address
    const prevOutput = cellWithStatus.cell!.output
    const tx: Transaction = await TransactionGenerator.generateWithdrawMultiSignTx(
      outPoint,
      prevOutput,
      receivingAddress,
      fee,
      feeRate
    )

    return tx
  }

  public calculateDaoMaximumWithdraw = async (
    depositOutPoint: OutPoint,
    withdrawBlockHash: string
  ): Promise<bigint> => {
    const { ckb } = NodeService.getInstance()
    const result = await ckb.calculateDaoMaximumWithdraw(depositOutPoint.toSDK(), withdrawBlockHash)

    return BigInt(result)
  }

  private parseEpoch = (epoch: bigint) => {
    return {
      length: (epoch >> BigInt(40)) & BigInt(0xffff),
      index: (epoch >> BigInt(24)) & BigInt(0xffff),
      number: epoch & BigInt(0xffffff)
    }
  }

  private epochSince = (length: bigint, index: bigint, number: bigint) => {
    return (BigInt(0x20) << BigInt(56)) + (length << BigInt(40)) + (index << BigInt(24)) + number
  }

  // path is a BIP44 full path such as "m/44'/309'/0'/0/0"
  public getAddressInfos = (walletID: string): Promise<Address[]> => {
    // only for check wallet exists
    this.walletService.get(walletID)
    return AddressService.getAddressesByWalletId(walletID)
  }

  public getChangeAddress = async (): Promise<string> => {
    const wallet = this.walletService.getCurrent()

    const unusedChangeAddress = await wallet!.getNextChangeAddress()

    return unusedChangeAddress!.address
  }

  // Derive all child private keys for specified BIP44 paths.
  public getPrivateKeys = (wallet: Wallet, paths: string[], password: string): PathAndPrivateKey[] => {
    const masterPrivateKey = wallet.loadKeystore().extendedPrivateKey(password)
    const masterKeychain = new Keychain(
      Buffer.from(masterPrivateKey.privateKey, 'hex'),
      Buffer.from(masterPrivateKey.chainCode, 'hex')
    )

    const uniquePaths = paths.filter((value, idx, a) => a.indexOf(value) === idx)
    return uniquePaths.map(path => ({
      path,
      privateKey: `0x${masterKeychain.derivePath(path).privateKey.toString('hex')}`
    }))
  }
}
