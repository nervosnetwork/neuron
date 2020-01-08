import WalletService, { Wallet } from 'services/wallets'
import WalletsService from 'services/wallets'
import { IsRequired } from 'exceptions'
import NodeService from './node'
import { serializeWitnessArgs } from '@nervosnetwork/ckb-sdk-utils'
import { TransactionPersistor, TransactionsService, TransactionGenerator } from './tx'
import NetworksService from './networks'
import { AddressPrefix } from 'models/keys/address'
import LockUtils from 'models/lock-utils'
import AddressService from './addresses'
import { Address } from 'database/address/address-dao'
import { PathAndPrivateKey } from 'models/keys/key'
import AddressesService from 'services/addresses'
import { CellIsNotYetLive, TransactionIsNotCommittedYet } from 'exceptions/dao'
import FeeMode from 'models/fee-mode'
import DaoUtils from 'models/dao-utils'
import TransactionSize from 'models/transaction-size'
import TransactionFee from 'models/transaction-fee'
import logger from 'utils/logger'
import Keychain from 'models/keys/keychain'
import Input from 'models/chain/input'
import OutPoint from 'models/chain/out-point'
import Output from 'models/chain/output'
import RpcService from 'services/rpc-service'
import CellDep, { DepType } from 'models/chain/cell-dep'
import WitnessArgs from 'models/chain/witness-args'
import Transaction from 'models/chain/transaction'
import BlockHeader from 'models/chain/block-header'
import Script from 'models/chain/script'

interface SignInfo {
  witnessArgs: WitnessArgs
  lockHash: string
  witness: string
  blake160: string
}

export default class TransactionSender {
  private walletService: WalletService

  constructor() {
    this.walletService = WalletsService.getInstance()
  }

  public sendTx = async (walletID: string = '', tx: Transaction, password: string = '', description: string = '') => {
    const wallet = this.walletService.get(walletID)

    if (password === '') {
      throw new IsRequired('Password')
    }

    const { core } = NodeService.getInstance()
    const txHash: string = tx.computeHash()

    const addressInfos = this.getAddressInfos(walletID)
    const paths = addressInfos.map(info => info.path)
    const pathAndPrivateKeys = this.getPrivateKeys(wallet, paths, password)
    const findPrivateKey = (blake160: string) => {
      const { path } = addressInfos.find(i => i.blake160 === blake160)!
      const pathAndPrivateKey = pathAndPrivateKeys.find(p => p.path === path)
      if (!pathAndPrivateKey) {
        throw new Error('no private key found')
      }
      return pathAndPrivateKey.privateKey
    }

    const witnessSigningEntries: SignInfo[] = tx.inputs.map((input: Input, index: number) => {
      const blake160: string = input.lock!.args!
      const wit: WitnessArgs | string = tx.witnesses[index]
      const witnessArgs: WitnessArgs = (wit instanceof WitnessArgs) ? wit : WitnessArgs.generateEmpty()
      return {
        // TODO: fill in required DAO's type witness here
        witnessArgs,
        lockHash: input.lockHash!,
        witness: '',
        blake160,
      }
    })

    const lockHashes = new Set(witnessSigningEntries.map(w => w.lockHash))

    for (const lockHash of lockHashes) {
      const witnessesArgs = witnessSigningEntries.filter(w => w.lockHash === lockHash)
      // A 65-byte empty signature used as placeholder
      witnessesArgs[0].witnessArgs.setEmptyLock()

      const privateKey = findPrivateKey(witnessesArgs[0].blake160)

      const serializedWitnesses: (WitnessArgs | string)[] = witnessesArgs
        .map((value: SignInfo, index: number) => {
          const args = value.witnessArgs
          if (index === 0) {
            return args
          }
          if (args.lock === undefined && args.inputType === undefined && args.outputType === undefined) {
            return '0x'
          }
          return serializeWitnessArgs(args.toSDK())
        })
      const signed = core.signWitnesses(privateKey)({
        transactionHash: txHash,
        witnesses: serializedWitnesses.map(wit => {
          if (typeof wit === 'string') {
            return wit
          }
          return wit.toSDK()
        })
      })

      for (let i = 0; i < witnessesArgs.length; ++i) {
        witnessesArgs[i].witness = signed[i] as string
      }
    }

    tx.witnesses = witnessSigningEntries.map(w => w.witness)

    await core.rpc.sendTransaction(tx.toSDK())

    tx.description = description
    await TransactionPersistor.saveSentTx(tx, txHash)

    // update addresses txCount and balance
    const blake160s = TransactionsService.blake160sOfTx(tx)
    const prefix = NetworksService.getInstance().isMainnet() ? AddressPrefix.Mainnet : AddressPrefix.Testnet
    const usedAddresses = blake160s.map(blake160 => LockUtils.blake160ToAddress(blake160, prefix))
    await WalletService.updateUsedAddresses(usedAddresses, core.rpc.node.url)
    return txHash
  }

  public calculateFee = async (tx: Transaction) => {
    const inputCapacities = tx.inputs!
      .map(input => BigInt(input.capacity!))
      .reduce((result, c) => result + c, BigInt(0))
    const outputCapacities = tx.outputs!
      .map(output => BigInt(output.capacity!))
      .reduce((result, c) => result + c, BigInt(0))

    return (inputCapacities - outputCapacities).toString()
  }

  public generateTx = async (
    walletID: string = '',
    items: {
      address: string
      capacity: string
    }[] = [],
    fee: string = '0',
    feeRate: string = '0',
  ): Promise<Transaction> => {
    const addressInfos = this.getAddressInfos(walletID)

    const addresses: string[] = addressInfos.map(info => info.address)

    const lockHashes: string[] = new LockUtils(await LockUtils.systemScript()).addressesToAllLockHashes(addresses)

    const targetOutputs = items.map(item => ({
      ...item,
      capacity: BigInt(item.capacity).toString(),
    }))

    const changeAddress: string = this.getChangeAddress()

    const tx: Transaction = await TransactionGenerator.generateTx(
      lockHashes,
      targetOutputs,
      changeAddress,
      fee,
      feeRate
    )

    return tx
  }

  public generateSendingAllTx = async (
    walletID: string = '',
    items: {
      address: string
      capacity: string
    }[] = [],
    fee: string = '0',
    feeRate: string = '0',
  ): Promise<Transaction> => {
    const addressInfos = this.getAddressInfos(walletID)

    const addresses: string[] = addressInfos.map(info => info.address)

    const lockHashes: string[] = new LockUtils(await LockUtils.systemScript()).addressesToAllLockHashes(addresses)

    const targetOutputs = items.map(item => ({
      ...item,
      capacity: BigInt(item.capacity).toString(),
    }))

    const tx: Transaction = await TransactionGenerator.generateSendingAllTx(
      lockHashes,
      targetOutputs,
      fee,
      feeRate
    )

    return tx
  }

  public generateDepositTx = async (
    walletID: string = '',
    capacity: string,
    fee: string = '0',
    feeRate: string = '0',
  ): Promise<Transaction> => {
    const addressInfos = this.getAddressInfos(walletID)

    const addresses: string[] = addressInfos.map(info => info.address)

    const lockHashes: string[] = new LockUtils(await LockUtils.systemScript()).addressesToAllLockHashes(addresses)

    const address = AddressesService.nextUnusedAddress(walletID)

    const changeAddress: string = this.getChangeAddress()

    const tx = await TransactionGenerator.generateDepositTx(
      lockHashes,
      capacity,
      address!.address,
      changeAddress,
      fee,
      feeRate,
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

    const { core } = NodeService.getInstance()
    const cellStatus = await core.rpc.getLiveCell(outPoint.toSDK(), false)
    if (cellStatus.status !== 'live') {
      throw new CellIsNotYetLive()
    }
    const prevTx = await core.rpc.getTransaction(outPoint.txHash)
    if (prevTx.txStatus.status !== 'committed') {
      throw new TransactionIsNotCommittedYet()
    }

    const addressInfos = this.getAddressInfos(walletID)
    const addresses: string[] = addressInfos.map(info => info.address)
    const lockHashes: string[] = new LockUtils(await LockUtils.systemScript()).addressesToAllLockHashes(addresses)

    const depositBlockHeader = await core.rpc.getHeader(prevTx.txStatus.blockHash!)

    const changeAddress = await AddressesService.nextUnusedChangeAddress(walletID)
    const prevOutput = Output.fromSDK(cellStatus.cell.output)
    const tx: Transaction = await TransactionGenerator.startWithdrawFromDao(
      lockHashes,
      outPoint,
      prevOutput,
      depositBlockHeader.number,
      depositBlockHeader.hash,
      changeAddress!.address,
      fee,
      feeRate,
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

    const url: string = NodeService.getInstance().core.node.url
    const rpcService = new RpcService(url)

    const cellStatus = await rpcService.getLiveCell(withdrawingOutPoint, true)
    if (cellStatus.status !== 'live') {
      throw new CellIsNotYetLive()
    }
    const prevTx = (await rpcService.getTransaction(withdrawingOutPoint.txHash))!
    if (prevTx.txStatus.status !== 'committed') {
      throw new TransactionIsNotCommittedYet()
    }
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
    const lockEpoches = (depositedEpoches + (DAO_LOCK_PERIOD_EPOCHS - BigInt(1))) / DAO_LOCK_PERIOD_EPOCHS * DAO_LOCK_PERIOD_EPOCHS
    const minimalSinceEpochNumber = depositEpoch.number + lockEpoches
    const minimalSinceEpochIndex = depositEpoch.index
    const minimalSinceEpochLength = depositEpoch.length

    const minimalSince = this.epochSince(minimalSinceEpochLength, minimalSinceEpochIndex, minimalSinceEpochNumber)

    const outputCapacity: bigint = await this.calculateDaoMaximumWithdraw(depositOutPoint, withdrawBlockHeader.hash)

    const { codeHash, outPoint: secpOutPoint, hashType } = await LockUtils.systemScript()
    const daoScriptInfo = await DaoUtils.daoScript()

    const address = await AddressesService.nextUnusedAddress(walletID)
    const blake160 = LockUtils.addressToBlake160(address!.address)

    const output: Output = new Output(
      outputCapacity.toString(),
      new Script(codeHash, blake160, hashType),
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

    const withdrawWitnessArgs: WitnessArgs = new WitnessArgs(
      WitnessArgs.EMPTY_LOCK,
      '0x0000000000000000'
    )
    const tx: Transaction = Transaction.fromObject({
      version: '0',
      cellDeps: [
        new CellDep(secpOutPoint, DepType.DepGroup),
        new CellDep(daoScriptInfo.outPoint, DepType.Code)
      ],
      headerDeps: [
        depositBlockHeader.hash,
        withdrawBlockHeader.hash
      ],
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
      output.capacity = (outputCapacity - txFee).toString()
    } else {
      tx.fee = fee
      output.capacity = (outputCapacity - feeInt).toString()
    }

    logger.debug('withdrawFromDao fee:', tx.fee)

    return tx
  }

  public generateDepositAllTx = async (
    walletID: string = '',
    fee: string = '0',
    feeRate: string = '0',
  ): Promise<Transaction> => {
    const addressInfos = this.getAddressInfos(walletID)

    const addresses: string[] = addressInfos.map(info => info.address)

    const lockHashes: string[] = new LockUtils(await LockUtils.systemScript()).addressesToAllLockHashes(addresses)

    const address = AddressesService.nextUnusedAddress(walletID)

    const tx = await TransactionGenerator.generateDepositAllTx(
      lockHashes,
      address!.address,
      fee,
      feeRate,
    )

    return tx
  }

  public calculateDaoMaximumWithdraw = async (depositOutPoint: OutPoint, withdrawBlockHash: string): Promise<bigint> => {

    const { core } = NodeService.getInstance()
    const result = await core.rpc.calculateDaoMaximumWithdraw(
      depositOutPoint.toSDK(),
      withdrawBlockHash,
    )

    return BigInt(result)
  }

  private parseEpoch = (epoch: bigint) => {
    return {
      length: (epoch >> BigInt(40)) & BigInt(0xFFFF),
      index: (epoch >> BigInt(24)) & BigInt(0xFFFF),
      number: epoch & BigInt(0xFFFFFF)
    }
  }

  private epochSince = (length: bigint, index: bigint, number: bigint) => {
    return (BigInt(0x20) << BigInt(56)) + (length << BigInt(40)) + (index << BigInt(24)) + number
  }

  // path is a BIP44 full path such as "m/44'/309'/0'/0/0"
  public getAddressInfos = (walletID: string): Address[] => {
    // only for check wallet exists
    this.walletService.get(walletID)
    return AddressService.allAddressesByWalletId(walletID)
  }

  public getChangeAddress = (): string => {
    const walletId = this.walletService.getCurrent()!.id
    return AddressService.nextUnusedChangeAddress(walletId)!.address
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
