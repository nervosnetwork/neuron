import { serializeWitnessArgs } from '../utils/serialization'
import { scriptToAddress } from '../utils/scriptAndAddress'
import { TargetOutput, TransactionGenerator, TransactionPersistor } from './tx'
import AddressService from './addresses'
import WalletService, { Wallet } from '../services/wallets'
import RpcService from '../services/rpc-service'
import { Address } from '../models/address'
import FeeMode from '../models/fee-mode'
import TransactionSize from '../models/transaction-size'
import TransactionFee from '../models/transaction-fee'
import Input from '../models/chain/input'
import OutPoint from '../models/chain/out-point'
import Output from '../models/chain/output'
import WitnessArgs from '../models/chain/witness-args'
import Transaction from '../models/chain/transaction'
import Script from '../models/chain/script'
import Multisig from '../models/multisig'
import Blake2b from '../models/blake2b'
import logger from '../utils/logger'
import { signWitnesses } from '../utils/signWitnesses'
import { bytes, Uint64LE } from '@ckb-lumos/lumos/codec'
import SystemScriptInfo from '../models/system-script-info'
import AddressParser from '../models/address-parser'
import HardwareWalletService from './hardware'
import {
  CapacityNotEnoughForChange,
  CapacityNotEnoughForChangeByTransfer,
  CellIsNotYetLive,
  MultisigConfigNeedError,
  NoMatchAddressForSign,
  SignTransactionFailed,
  TransactionIsNotCommittedYet,
} from '../exceptions'
import AssetAccountInfo from '../models/asset-account-info'
import MultisigConfigModel from '../models/multisig-config'
import { Hardware } from './hardware/hardware'
import MultisigService from './multisig'
import AmendTransactionService from './amend-transaction'
import { getMultisigStatus } from '../utils/multisig'
import { SignStatus } from '../models/offline-sign'
import NetworksService from './networks'
import { generateRPC } from '../utils/ckb-rpc'
import CellsService from './cells'
import { hd } from '@ckb-lumos/lumos'
import { getClusterByOutPoint } from '@spore-sdk/core'
import CellDep, { DepType } from '../models/chain/cell-dep'
import { dao } from '@ckb-lumos/lumos/common-scripts'

interface SignInfo {
  witnessArgs: WitnessArgs
  lockHash: string
  witness: string
  lockArgs: string
}

interface PathAndPrivateKey {
  path: string
  privateKey: string
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
    skipSign = false,
    amendHash = ''
  ) {
    const tx = skipSign
      ? Transaction.fromObject(transaction)
      : await this.sign(walletID, transaction, password, skipLastInputs)

    return this.broadcastTx(walletID, tx, amendHash)
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

  public async broadcastTx(walletID: string = '', tx: Transaction, amendHash = '') {
    const currentNetwork = NetworksService.getInstance().getCurrent()
    const rpc = generateRPC(currentNetwork.remote, currentNetwork.type)
    await rpc.sendTransaction(tx.toSDKRawTransaction(), 'passthrough')
    const txHash = tx.hash!

    await TransactionPersistor.saveSentTx(tx, txHash)
    await MultisigService.saveSentMultisigOutput(tx)
    if (amendHash) {
      await AmendTransactionService.save(txHash, amendHash)
    }

    if (walletID) {
      const wallet = WalletService.getInstance().get(walletID)
      await wallet.checkAndGenerateAddresses()
    }
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
        return serializeWitnessArgs(args.toSDK())
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
        signed[0] = serializeWitnessArgs(wit.toSDK())
      } else {
        signed = signWitnesses({
          privateKey,
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
        return serializeWitnessArgs(args.toSDK())
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
          witnesses.map(w => (typeof w === 'string' ? w : serializeWitnessArgs(w.toSDK()))),
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
        witnesses[0] = serializeWitnessArgs(wit.toSDK())
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

  public static signSingleMultiSignScript(
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
    const serializedEmptyWitness = serializeWitnessArgs(emptyWitness.toSDK())
    const serializedEmptyWitnessSize = bytes.bytify(serializedEmptyWitness).byteLength
    const blake2b = new Blake2b()
    blake2b.update(txHash)
    blake2b.update(bytes.hexify(Uint64LE.pack(`0x${serializedEmptyWitnessSize.toString(16)}`)))
    blake2b.update(serializedEmptyWitness)

    restWitnesses.forEach(w => {
      const wit: string = typeof w === 'string' ? w : serializeWitnessArgs(w.toSDK())
      const byteLength = bytes.bytify(wit).byteLength
      blake2b.update(bytes.hexify(Uint64LE.pack(`0x${byteLength.toString(16)}`)))
      blake2b.update(wit)
    })

    const message = blake2b.digest()

    if (!wallet.isHardware()) {
      // `privateKeyOrPath` variable here is a private key because wallet is not a hardware one. Otherwise, it will be a private key path.
      const privateKey = privateKeyOrPath
      emptyWitness.lock = hd.key.signRecoverable(message, privateKey)
    }

    return [emptyWitness, ...restWitnesses]
  }

  public generateTx = async ({
    walletID = '',
    items = [],
    fee = '0',
    feeRate = '0',
    consumeOutPoints,
    enableUseSentCell,
  }: {
    walletID: string
    items: TargetOutput[]
    fee: string
    feeRate: string
    consumeOutPoints?: CKBComponents.OutPoint[]
    enableUseSentCell?: boolean
  }): Promise<Transaction> => {
    const targetOutputs = items.map(item => ({
      ...item,
      capacity: BigInt(item.capacity).toString(),
    }))

    const changeAddress: string = await this.getChangeAddress()

    try {
      const tx: Transaction = await TransactionGenerator.generateTx({
        walletID,
        targetOutputs,
        changeAddress,
        fee,
        feeRate,
        consumeOutPoints,
        enableUseSentCell,
      })

      return tx
    } catch (error) {
      if (error instanceof CapacityNotEnoughForChange) {
        throw new CapacityNotEnoughForChangeByTransfer()
      }
      throw error
    }
  }

  public generateSendingAllTx = async ({
    walletID = '',
    items = [],
    fee = '0',
    feeRate = '0',
    consumeOutPoints,
    enableUseSentCell,
  }: {
    walletID: string
    items: TargetOutput[]
    fee: string
    feeRate: string
    consumeOutPoints?: CKBComponents.OutPoint[]
    enableUseSentCell?: boolean
  }): Promise<Transaction> => {
    const targetOutputs = items.map(item => ({
      ...item,
      capacity: BigInt(item.capacity).toString(),
    }))

    const tx: Transaction = await TransactionGenerator.generateSendingAllTx({
      walletID,
      targetOutputs,
      fee,
      feeRate,
      consumeOutPoints,
      enableUseSentCell,
    })

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

    const tx: Transaction = await TransactionGenerator.generateSendingAllTx({
      walletID: '',
      targetOutputs,
      fee: '0',
      feeRate: '1000',
      multisigConfig,
    })

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
      const multisigAddresses = scriptToAddress(lockScript, NetworksService.getInstance().isMainnet())
      const tx: Transaction = await TransactionGenerator.generateTx({
        walletID: '',
        targetOutputs,
        changeAddress: multisigAddresses,
        fee: '0',
        feeRate: '1000',
        lockClass: {
          lockArgs: [lockScript.args],
          codeHash: SystemScriptInfo.MULTI_SIGN_CODE_HASH,
          hashType: SystemScriptInfo.MULTI_SIGN_HASH_TYPE,
        },
        multisigConfig,
      })
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

  public generateTransferSporeTx = async (
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

    const assetAccountInfo = new AssetAccountInfo()
    // const rpcUrl: string = NodeService.getInstance().nodeUrl
    const rpcUrl = NetworksService.getInstance().getCurrent().remote

    // https://github.com/sporeprotocol/spore-sdk/blob/05f2cbe1c03d03e334ebd3b440b5b3b20ec67da7/packages/core/src/api/joints/spore.ts#L154-L158
    const clusterDep = await (async () => {
      const clusterCell = await getClusterByOutPoint(outPoint, assetAccountInfo.getSporeConfig(rpcUrl)).then(
        _ => _,
        () => undefined
      )

      if (!clusterCell?.outPoint) {
        return undefined
      }

      return new CellDep(OutPoint.fromSDK(clusterCell.outPoint), DepType.Code)
    })()

    const tx = await TransactionGenerator.generateTransferNftTx(
      walletId,
      outPoint,
      nftCellOutput,
      receiveAddress,
      changeAddress,
      fee,
      feeRate,
      [assetAccountInfo.getSporeInfos()[0].cellDep].concat(clusterDep ?? [])
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

    const currentNetwork = NetworksService.getInstance().getCurrent()
    const rpcService = new RpcService(currentNetwork.remote, currentNetwork.type)
    const depositOutput = await CellsService.getLiveCell(outPoint)
    if (!depositOutput) {
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
      depositOutput,
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

    const currentNetwork = NetworksService.getInstance().getCurrent()
    const rpcService = new RpcService(currentNetwork.remote, currentNetwork.type)

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
    const depositTx = await rpcService.getTransaction(withdrawOutput.depositOutPoint.txHash)
    if (!depositTx?.txStatus.blockHash) {
      throw new Error(`Get deposit block hash failed with tx hash ${withdrawOutput.depositOutPoint.txHash}`)
    }
    const depositBlockHeader = await rpcService.getHeader(depositTx.txStatus.blockHash)
    if (!depositBlockHeader) {
      throw new Error(`Get Header failed with blockHash ${depositTx.txStatus.blockHash}`)
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

    const currentNetwork = NetworksService.getInstance().getCurrent()
    const rpcService = new RpcService(currentNetwork.remote, currentNetwork.type)
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
    const currentNetwork = NetworksService.getInstance().getCurrent()
    const rpc = generateRPC(currentNetwork.remote, currentNetwork.type)

    let tx = await rpc.getTransaction(depositOutPoint.txHash)
    if (tx.txStatus.status !== 'committed' || !tx.txStatus.blockHash) {
      throw new Error('Transaction is not committed yet')
    }
    const depositBlockHash = tx.txStatus.blockHash

    const cellOutput = tx.transaction.outputs[+depositOutPoint.index]
    const cellOutputData = tx.transaction.outputsData[+depositOutPoint.index]

    const [depositHeader, withDrawHeader] = await Promise.all([
      rpc.getHeader(depositBlockHash),
      rpc.getHeader(withdrawBlockHash),
    ])

    return dao.calculateMaximumWithdraw(
      { outPoint: depositOutPoint.toSDK(), data: cellOutputData, cellOutput: cellOutput },
      depositHeader.dao,
      withDrawHeader.dao
    )
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
    const masterKeychain = new hd.Keychain(
      Buffer.from(bytes.bytify(masterPrivateKey.privateKey)),
      Buffer.from(bytes.bytify(masterPrivateKey.chainCode))
    )

    const uniquePaths = paths.filter((value, idx, a) => a.indexOf(value) === idx)
    return uniquePaths.map(path => ({
      path,
      privateKey: bytes.hexify(masterKeychain.derivePath(path).privateKey),
    }))
  }
}
