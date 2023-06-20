import signWitnesses from '@nervosnetwork/ckb-sdk-core/lib/signWitnesses'
import NodeService from './node'
import { TransactionPersistor, TransactionGenerator, TargetOutput } from './tx'
import AddressService from './addresses'
import WalletService, { Wallet } from '../services/wallets'
import RpcService from '../services/rpc-service'
import { PathAndPrivateKey } from '../models/keys/key'
import { Address } from '../models/address'
import FeeMode from '../models/fee-mode'
import TransactionSize from '../models/transaction-size'
import TransactionFee from '../models/transaction-fee'
import Keychain from '../models/keys/keychain'
import Input from '../models/chain/input'
import OutPoint from '../models/chain/out-point'
import Output from '../models/chain/output'
import WitnessArgs from '../models/chain/witness-args'
import Transaction from '../models/chain/transaction'
import Script from '../models/chain/script'
import Multisig from '../models/multisig'
import logger from '../utils/logger'
import HexUtils from '../utils/hex'
import SystemScriptInfo from '../models/system-script-info'
import AddressParser from '../models/address-parser'
import HardwareWalletService from './hardware'
import {
  CapacityNotEnoughForChange,
  CapacityNotEnoughForChangeByTransfer,
  MultisigConfigNeedError,
  NoMatchAddressForSign,
  SignTransactionFailed,
  CellIsNotYetLive,
  TransactionIsNotCommittedYet,
} from '../exceptions'
import AssetAccountInfo from '../models/asset-account-info'
import MultisigConfigModel from '../models/multisig-config'
import { Hardware } from './hardware/hardware'
import MultisigService from './multisig'
import { getMultisigStatus } from '../utils/multisig'
import { SignStatus } from '../models/offline-sign'
import NetworksService from './networks'
import { generateRPC } from '../utils/ckb-rpc'
import CKB from '@nervosnetwork/ckb-sdk-core'
import CellsService from './cells'
import { config, hd, helpers } from '@ckb-lumos/lumos'
import { utils } from '@ckb-lumos/lumos'
import { blockchain } from '@ckb-lumos/base'
import { bytes, number } from '@ckb-lumos/codec'

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
    this.walletService = WalletService.getInstance()
  }

  public async sendTx(
    walletID: string = '',
    transaction: Transaction,
    password: string = '',
    skipLastInputs: boolean = true,
    skipSign = false
  ) {
    const tx = skipSign
      ? Transaction.fromObject(transaction)
      : await this.sign(walletID, transaction, password, skipLastInputs)

    return this.broadcastTx(walletID, tx)
  }

  public async sendMultisigTx(
    walletID: string = '',
    transaction: Transaction,
    password: string = '',
    multisigConfigs: MultisigConfigModel[],
    skipSign = false
  ) {
    const tx = skipSign
      ? Transaction.fromObject(transaction)
      : await this.signMultisig(walletID, transaction, password, multisigConfigs)

    return this.broadcastTx(walletID, tx)
  }

  public async broadcastTx(walletID: string = '', tx: Transaction) {
    const rpc = generateRPC(NodeService.getInstance().nodeUrl)
    await rpc.sendTransaction(tx.toSDKRawTransaction(), 'passthrough')
    const txHash = tx.hash!

    await TransactionPersistor.saveSentTx(tx, txHash)
    await MultisigService.saveSentMultisigOutput(tx)

    const wallet = WalletService.getInstance().get(walletID)
    await wallet.checkAndGenerateAddresses()
    return txHash
  }

  public async sign(
    walletID: string = '',
    transaction: Transaction,
    password: string = '',
    skipLastInputs: boolean = true,
    context?: RPC.RawTransaction[]
  ) {
    const wallet = this.walletService.get(walletID)
    const tx = Transaction.fromObject(transaction)
    const txHash: string = tx.computeHash()
    if (wallet.isHardware()) {
      let device = HardwareWalletService.getInstance().getCurrent()
      if (!device) {
        const wallet = WalletService.getInstance().getCurrent()
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
    const isMultisig =
      tx.inputs.length === 1 && tx.inputs[0].lock!.args.length === TransactionSender.MULTI_SIGN_ARGS_LENGTH

    const addressInfos = await this.getAddressInfos(walletID)
    const multiSignBlake160s = isMultisig
      ? addressInfos.map(i => {
          return {
            multiSignBlake160: Multisig.hash([i.blake160]),
            path: i.path,
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
      .slice(0, skipLastInputs ? -1 : tx.inputs.length)
      .map((input: Input, index: number) => {
        const lockArgs: string = input.lock!.args!
        const wit: WitnessArgs | string = tx.witnesses[index]
        const witnessArgs: WitnessArgs = wit instanceof WitnessArgs ? wit : WitnessArgs.generateEmpty()
        return {
          // TODO: fill in required DAO's type witness here
          witnessArgs,
          lockHash: input.lockHash!,
          witness: '',
          lockArgs,
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
        return bytes.hexify(blockchain.WitnessArgs.pack(args.toSDK()))
      })
      let signed: (string | CKBComponents.WitnessArgs | WitnessArgs)[] = []

      if (isMultisig) {
        const blake160 = addressInfos.find(
          i => witnessesArgs[0].lockArgs.slice(0, 42) === Multisig.hash([i.blake160])
        )!.blake160
        const serializedMultisig: string = Multisig.serialize([blake160])
        signed = await TransactionSender.signSingleMultiSignScript(
          privateKey,
          serializedWitnesses,
          txHash,
          serializedMultisig,
          wallet
        )
        const wit = signed[0] as WitnessArgs
        wit.lock = serializedMultisig + wit.lock!.slice(2)
        signed[0] = bytes.hexify(blockchain.WitnessArgs.pack(wit.toSDK()))
      } else {
        signed = signWitnesses(privateKey)({
          transactionHash: txHash,
          witnesses: serializedWitnesses.map(wit => {
            if (typeof wit === 'string') {
              return wit
            }
            return wit.toSDK()
          }),
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

  public async signMultisig(
    walletID: string = '',
    transaction: Transaction,
    password: string = '',
    multisigConfigs: MultisigConfigModel[],
    context?: RPC.RawTransaction[]
  ) {
    const wallet = this.walletService.get(walletID)
    const tx = Transaction.fromObject(transaction)
    const txHash: string = tx.computeHash()
    const addressInfos = await this.getAddressInfos(walletID)
    const paths = addressInfos.map(info => info.path)
    let device: Hardware | undefined
    let pathAndPrivateKeys: PathAndPrivateKey[] | undefined
    if (wallet.isHardware()) {
      device = HardwareWalletService.getInstance().getCurrent()
      if (!device) {
        const wallet = WalletService.getInstance().getCurrent()
        const deviceInfo = wallet!.getDeviceInfo()
        device = await HardwareWalletService.getInstance().initHardware(deviceInfo)
        await device.connect()
      }
    } else {
      pathAndPrivateKeys = this.getPrivateKeys(wallet, paths, password)
    }
    const findPrivateKeyAndBlake160 = (argsList: string[], signedBlake160s?: string[]) => {
      let path: string | undefined
      let matchArgs: string | undefined
      argsList.some(args => {
        if (signedBlake160s?.includes(args)) {
          return false
        }
        if (args.length === 42) {
          const matchAddress = addressInfos.find(i => i.blake160 === args)
          path = matchAddress?.path
          matchArgs = matchAddress?.blake160
        } else {
          const addressInfo = AssetAccountInfo.findSignPathForCheque(addressInfos, args)
          path = addressInfo?.path
          matchArgs = addressInfo?.blake160
        }
        return !!path
      })
      if (!path) {
        throw new NoMatchAddressForSign()
      }
      if (!pathAndPrivateKeys) {
        return [path, matchArgs]
      }
      const pathAndPrivateKey = pathAndPrivateKeys.find(p => p.path === path)
      if (!pathAndPrivateKey) {
        throw new Error('no private key found')
      }
      return [pathAndPrivateKey.privateKey, matchArgs]
    }

    const witnessSigningEntries: SignInfo[] = tx.inputs.map((input: Input, index: number) => {
      const lockArgs: string = input.lock!.args!
      const wit: WitnessArgs | string = tx.witnesses[index]
      const witnessArgs: WitnessArgs = wit instanceof WitnessArgs ? wit : WitnessArgs.generateEmpty()
      return {
        witnessArgs,
        lockHash: input.lockHash!,
        witness: '',
        lockArgs,
      }
    })

    const lockHashes = new Set(witnessSigningEntries.map(w => w.lockHash))
    const multisigConfigMap: Record<string, MultisigConfigModel> = multisigConfigs.reduce(
      (pre, cur) => ({
        ...pre,
        [cur.getLockHash()]: cur,
      }),
      {}
    )
    for (const lockHash of lockHashes) {
      const multisigConfig = multisigConfigMap[lockHash]
      if (!multisigConfig) {
        throw new MultisigConfigNeedError()
      }
      const [privateKey, blake160] = findPrivateKeyAndBlake160(multisigConfig.blake160s, tx.signatures?.[lockHash])

      const witnessesArgs = witnessSigningEntries.filter(w => w.lockHash === lockHash)
      const serializedWitnesses: (WitnessArgs | string)[] = witnessesArgs.map((value: SignInfo, index: number) => {
        const args = value.witnessArgs
        if (index === 0) {
          return args
        }
        if (args.lock === undefined && args.inputType === undefined && args.outputType === undefined) {
          return '0x'
        }
        return bytes.hexify(blockchain.WitnessArgs.pack(args.toSDK()))
      })
      let witnesses: (string | WitnessArgs)[] = []
      const serializedMultiSign: string = Multisig.serialize(
        multisigConfig.blake160s,
        multisigConfig.r,
        multisigConfig.m,
        multisigConfig.n
      )
      witnesses = await TransactionSender.signSingleMultiSignScript(
        privateKey!,
        serializedWitnesses,
        txHash,
        serializedMultiSign,
        wallet,
        multisigConfig.m
      )
      const wit = witnesses[0] as WitnessArgs
      if (wallet.isHardware()) {
        wit.lock = await device!.signTransaction(
          walletID,
          tx,
          witnesses.map(w => (typeof w === 'string' ? w : bytes.hexify(blockchain.WitnessArgs.pack(w.toSDK())))),
          privateKey!,
          context
        )
      } else {
        wit.lock = wit.lock!.slice(2)
      }
      if (!witnessesArgs[0].witnessArgs.lock) {
        wit.lock = serializedMultiSign + wit.lock
      } else {
        wit.lock = witnessesArgs[0].witnessArgs.lock + wit.lock
      }
      tx.setSignatures(lockHash, blake160!)
      const signStatus = getMultisigStatus(multisigConfig, tx.signatures)
      if (signStatus === SignStatus.Signed) {
        witnesses[0] = bytes.hexify(blockchain.WitnessArgs.pack(wit.toSDK()))
      } else {
        witnesses[0] = wit
      }

      for (let i = 0; i < witnessesArgs.length; ++i) {
        witnessesArgs[i].witness = witnesses[i] as string
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
    wallet: Wallet,
    m: number = 1
  ) {
    const firstWitness = witnesses[0]
    if (typeof firstWitness === 'string') {
      throw new Error('First witness must be WitnessArgs')
    }
    const restWitnesses = witnesses.slice(1)

    const emptyWitness = WitnessArgs.fromObject({
      ...firstWitness,
      lock: `0x` + serializedMultiSign.slice(2) + '0'.repeat(130 * m),
    })
    const serializedEmptyWitness = bytes.hexify(blockchain.WitnessArgs.pack(emptyWitness.toSDK()))
    const serialziedEmptyWitnessSize = HexUtils.byteLength(serializedEmptyWitness)
    const ckbHasher = new utils.CKBHasher()
    ckbHasher.update(txHash)
    ckbHasher.update(number.Uint64LE.pack(`0x${serialziedEmptyWitnessSize.toString(16)}`))
    ckbHasher.update(serializedEmptyWitness)

    restWitnesses.forEach(w => {
      const wit: string = typeof w === 'string' ? w : bytes.hexify(blockchain.WitnessArgs.pack(w.toSDK()))
      const byteLength = HexUtils.byteLength(wit)
      ckbHasher.update(number.Uint64LE.pack(`0x${byteLength.toString(16)}`))
      ckbHasher.update(wit)
    })

    const message = ckbHasher.digestHex()

    if (!wallet.isHardware()) {
      emptyWitness.lock = hd.key.signRecoverable(message, privateKeyOrPath)
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
      capacity: BigInt(item.capacity).toString(),
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
      capacity: BigInt(item.capacity).toString(),
    }))

    const tx: Transaction = await TransactionGenerator.generateSendingAllTx(walletID, targetOutputs, fee, feeRate)

    return tx
  }

  public generateMultisigSendAllTx = async (
    items: TargetOutput[] = [],
    multisigConfig: MultisigConfigModel
  ): Promise<Transaction> => {
    const targetOutputs = items.map(item => ({
      ...item,
      capacity: BigInt(item.capacity).toString(),
    }))

    const tx: Transaction = await TransactionGenerator.generateSendingAllTx(
      '',
      targetOutputs,
      '0',
      '1000',
      multisigConfig
    )

    return tx
  }

  public async generateMultisigTx(
    items: TargetOutput[] = [],
    multisigConfig: MultisigConfigModel
  ): Promise<Transaction> {
    const targetOutputs = items.map(item => ({
      ...item,
      capacity: BigInt(item.capacity).toString(),
    }))

    try {
      const lockScript = Multisig.getMultisigScript(
        multisigConfig.blake160s,
        multisigConfig.r,
        multisigConfig.m,
        multisigConfig.n
      )
      const isMainnet = NetworksService.getInstance().isMainnet()
      const lumosOptions = isMainnet ? { config: config.predefined.LINA } : { config: config.predefined.AGGRON4 }

      const multisigAddresses = helpers.encodeToAddress(lockScript, lumosOptions)
      const tx: Transaction = await TransactionGenerator.generateTx(
        '',
        targetOutputs,
        multisigAddresses,
        '0',
        '1000',
        {
          lockArgs: [lockScript.args],
          codeHash: SystemScriptInfo.MULTI_SIGN_CODE_HASH,
          hashType: SystemScriptInfo.MULTI_SIGN_HASH_TYPE,
        },
        multisigConfig
      )
      return tx
    } catch (error) {
      if (error instanceof CapacityNotEnoughForChange) {
        throw new CapacityNotEnoughForChangeByTransfer()
      }
      throw error
    }
  }

  public generateTransferNftTx = async (
    walletId: string,
    outPoint: OutPoint,
    receiveAddress: string,
    fee: string = '0',
    feeRate: string = '0'
  ): Promise<Transaction> => {
    const changeAddress: string = await this.getChangeAddress()
    const nftCellOutput = await CellsService.getLiveCell(new OutPoint(outPoint.txHash, outPoint.index))
    if (!nftCellOutput) {
      throw new CellIsNotYetLive()
    }

    const tx = await TransactionGenerator.generateTransferNftTx(
      walletId,
      outPoint,
      nftCellOutput,
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

    const url: string = NodeService.getInstance().nodeUrl
    const rpcService = new RpcService(url)
    const depositeOutput = await CellsService.getLiveCell(outPoint)
    if (!depositeOutput) {
      throw new CellIsNotYetLive()
    }
    const prevTx = await rpcService.getTransaction(outPoint.txHash)
    if (!prevTx || !prevTx.txStatus.isCommitted()) {
      throw new TransactionIsNotCommittedYet()
    }

    const depositBlockHeader = await rpcService.getHeader(prevTx.txStatus.blockHash!)

    const wallet = WalletService.getInstance().get(walletID)
    const changeAddress = await wallet.getNextChangeAddress()
    const tx: Transaction = await TransactionGenerator.startWithdrawFromDao(
      walletID,
      outPoint,
      depositeOutput,
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

    const url: string = NodeService.getInstance().nodeUrl
    const rpcService = new RpcService(url)

    const withdrawOutput = await CellsService.getLiveCell(withdrawingOutPoint)
    if (!withdrawOutput) {
      throw new CellIsNotYetLive()
    }
    const prevTx = (await rpcService.getTransaction(withdrawingOutPoint.txHash))!
    if (!prevTx.txStatus.isCommitted()) {
      throw new TransactionIsNotCommittedYet()
    }

    const secpCellDep = await SystemScriptInfo.getInstance().getSecpCellDep()
    const daoCellDep = await SystemScriptInfo.getInstance().getDaoCellDep()

    const content = withdrawOutput.daoData
    if (!content) {
      throw new Error(`Withdraw output cell is not a dao cell, ${withdrawOutput.outPoint?.txHash}`)
    }
    if (!withdrawOutput.depositOutPoint) {
      throw new Error('DAO has not finish step first withdraw')
    }
    const depositeTx = await rpcService.getTransaction(withdrawOutput.depositOutPoint.txHash)
    if (!depositeTx?.txStatus.blockHash) {
      throw new Error(`Get deposite block hash failed with tx hash ${withdrawOutput.depositOutPoint.txHash}`)
    }
    const depositBlockHeader = await rpcService.getHeader(depositeTx.txStatus.blockHash)
    if (!depositBlockHeader) {
      throw new Error(`Get Header failed with blockHash ${depositeTx.txStatus.blockHash}`)
    }
    const depositEpoch = this.parseEpoch(BigInt(depositBlockHeader.epoch))
    const depositCapacity: bigint = BigInt(withdrawOutput.capacity)

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

    const input: Input = new Input(
      withdrawingOutPoint,
      minimalSince.toString(),
      withdrawOutput.capacity,
      withdrawOutput.lock
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
      interest: (BigInt(outputCapacity) - depositCapacity).toString(),
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

    const url: string = NodeService.getInstance().nodeUrl
    const rpcService = new RpcService(url)
    const locktimeOutput = await CellsService.getLiveCell(outPoint)
    if (!locktimeOutput) {
      throw new CellIsNotYetLive()
    }
    const prevTx = await rpcService.getTransaction(outPoint.txHash)
    if (!prevTx || !prevTx.txStatus.isCommitted()) {
      throw new TransactionIsNotCommittedYet()
    }

    const wallet = WalletService.getInstance().get(walletID)
    const receivingAddressInfo = await wallet.getNextAddress()

    const receivingAddress = receivingAddressInfo!.address
    const tx: Transaction = await TransactionGenerator.generateWithdrawMultiSignTx(
      outPoint,
      locktimeOutput,
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
    const ckb = new CKB(NodeService.getInstance().nodeUrl)
    const result = await ckb.calculateDaoMaximumWithdraw(depositOutPoint.toSDK(), withdrawBlockHash)

    return BigInt(result)
  }

  private parseEpoch = (epoch: bigint) => {
    return {
      length: (epoch >> BigInt(40)) & BigInt(0xffff),
      index: (epoch >> BigInt(24)) & BigInt(0xffff),
      number: epoch & BigInt(0xffffff),
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
      privateKey: `0x${masterKeychain.derivePath(path).privateKey.toString('hex')}`,
    }))
  }
}
