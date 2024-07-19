import AssetAccount from '../../src/models/asset-account'
import AssetAccountEntity from '../../src/database/chain/entities/asset-account'
import SudtTokenInfo from '../../src/database/chain/entities/sudt-token-info'
import OutputEntity from '../../src/database/chain/entities/output'
import AssetAccountInfo from '../../src/models/asset-account-info'
import BufferUtils from '../../src/utils/buffer'
import { OutputStatus } from '../../src/models/chain/output'
import SudtTokenInfoEntity from '../../src/database/chain/entities/sudt-token-info'
import TransactionEntity from '../../src/database/chain/entities/transaction'
import { TransactionStatus } from '../../src/models/chain/transaction'
import { closeConnection, createAccounts, getConnection, initConnection } from '../setupAndTeardown'
import accounts from '../setupAndTeardown/accounts.fixture'
import HdPublicKeyInfo from '../../src/database/chain/entities/hd-public-key-info'
import { hd } from '@ckb-lumos/lumos'
import OutPoint from '../../src/models/chain/out-point'
import { when } from 'jest-when'
import SystemScriptInfo from '../../src/models/system-script-info'
import Script from '../../src/models/chain/script'
import Input from '../../src/models/chain/input'
import { keyInfos } from '../setupAndTeardown/public-key-info.fixture'
import { UDTType } from '../../src/utils/const'

const stubbedWalletServiceGet = jest.fn()
const stubbedGenerateClaimChequeTx = jest.fn()
const stubbedGenerateWithdrawChequeTx = jest.fn()
const stubbedGetAllAddresses = jest.fn()
const stubbedGenerateCreateChequeTx = jest.fn()
const stubbedGenerateDestroyAssetAccountTx = jest.fn()
const stubbedTransactionSendersendTx = jest.fn()

const resetMocks = () => {
  stubbedWalletServiceGet.mockReset()
  stubbedGenerateCreateChequeTx.mockReset()
  stubbedGenerateClaimChequeTx.mockReset()
  stubbedGenerateWithdrawChequeTx.mockReset()
  stubbedGetAllAddresses.mockReset()
  stubbedGenerateDestroyAssetAccountTx.mockReset()
  stubbedTransactionSendersendTx.mockReset()
}

const [assetAccount, ckbAssetAccount] = accounts
const [alice, bob] = keyInfos

const randomHex = (length: number = 64): string => {
  const str: string = Array.from({ length })
    .map(() => Math.floor(Math.random() * 16).toString(16))
    .join('')

  return `0x${str}`
}
const toShannon = (ckb: string | number) => `${ckb}${'0'.repeat(8)}`

const blake160 = '0x' + '0'.repeat(40)
const assetAccountInfo = new AssetAccountInfo()
const generateOutput = (
  tokenID: string = 'CKBytes',
  txStatus: TransactionStatus = TransactionStatus.Success,
  blockNumber = '0',
  capacity = '1000',
  tokenAmount = '100',
  customData: string | undefined = undefined,
  status: OutputStatus = OutputStatus.Live,
  lock?: Script,
  udtType?: UDTType
) => {
  const outputEntity = new OutputEntity()
  outputEntity.outPointTxHash = randomHex()
  outputEntity.outPointIndex = '0'
  outputEntity.capacity = capacity

  const lockToUse = lock || assetAccountInfo.generateAnyoneCanPayScript(blake160)
  outputEntity.lockCodeHash = lockToUse.codeHash
  outputEntity.lockArgs = lockToUse.args
  outputEntity.lockHashType = lockToUse.hashType
  outputEntity.lockHash = lockToUse.computeHash()

  outputEntity.status = status
  outputEntity.data = customData || '0x'
  outputEntity.hasData = customData ? true : false
  if (tokenID !== 'CKBytes') {
    const type = assetAccountInfo.generateUdtScript(tokenID, udtType ?? UDTType.SUDT)!
    outputEntity.typeCodeHash = type.codeHash
    outputEntity.typeArgs = type.args
    outputEntity.typeHashType = type.hashType
    outputEntity.typeHash = type.computeHash()
    outputEntity.data = BufferUtils.writeBigUInt128LE(BigInt(tokenAmount))
  }
  const tx = new TransactionEntity()
  tx.hash = outputEntity.outPointTxHash
  tx.version = '0'
  tx.cellDeps = []
  tx.headerDeps = []
  tx.witnesses = []
  tx.status = txStatus
  tx.blockNumber = blockNumber
  outputEntity.transaction = tx
  return outputEntity
}

const tokenID = '0x' + '0'.repeat(64)
const walletId = 'w1'

jest.mock('services/wallets', () => {
  return {
    getInstance: () => ({
      get: stubbedWalletServiceGet,
    }),
  }
})
jest.mock('services/tx', () => {
  return {
    _esModule: true,
    TransactionGenerator: {
      // @ts-ignore
      generateClaimChequeTx: (...args) => stubbedGenerateClaimChequeTx(...args),
      // @ts-ignore
      generateCreateChequeTx: (...args) => stubbedGenerateCreateChequeTx(...args),
      // @ts-ignore
      generateWithdrawChequeTx: (...args) => stubbedGenerateWithdrawChequeTx(...args),
      // @ts-ignore
      generateDestroyAssetAccountTx: (...args) => stubbedGenerateDestroyAssetAccountTx(...args),
    },
  }
})
jest.mock('services/transaction-sender', () => {
  return function () {
    return {
      sendTx: stubbedTransactionSendersendTx,
    }
  }
})

describe('AssetAccountService', () => {
  const AssetAccountService = require('../../src/services/asset-account-service').default

  beforeAll(async () => {
    await initConnection()
  })

  afterAll(async () => {
    await closeConnection()
  })

  beforeEach(async () => {
    const connection = getConnection()
    await connection.synchronize(true)
    resetMocks()

    const keyInfo = HdPublicKeyInfo.fromObject({
      walletId,
      addressType: hd.AddressType.Receiving,
      addressIndex: 0,
      publicKeyInBlake160: blake160,
    })

    await connection.manager.save(keyInfo)
  })

  it('test for save relation', async () => {
    const entity = AssetAccountEntity.fromModel(assetAccount)
    const saved = await getConnection().manager.save([entity.sudtTokenInfo, entity])

    const sudtTokenInfoCount = await getConnection().getRepository(SudtTokenInfo).createQueryBuilder('s').getCount()

    const assetAccountCount = await getConnection()
      .getRepository(AssetAccountEntity)
      .createQueryBuilder('aa')
      .getCount()

    expect(sudtTokenInfoCount).toEqual(1)
    expect(assetAccountCount).toEqual(1)

    const result = await getConnection()
      .getRepository(AssetAccountEntity)
      .createQueryBuilder('aa')
      .leftJoinAndSelect('aa.sudtTokenInfo', 'info')
      .where({ id: (saved[1] as any).id })
      .getOne()

    expect(result!.sudtTokenInfo.tokenName).toEqual(assetAccount.tokenName)
  })

  it('update accountName', async () => {
    const entity = AssetAccountEntity.fromModel(assetAccount)
    const [, e] = await getConnection().manager.save([entity.sudtTokenInfo, entity])
    const saved = e as AssetAccountEntity

    await AssetAccountService.update(saved.id, { accountName: '1' })

    const result = await getConnection()
      .getRepository(AssetAccountEntity)
      .createQueryBuilder('aa')
      .leftJoinAndSelect('aa.sudtTokenInfo', 'info')
      .where({ id: saved.id })
      .getOne()

    expect(result!.accountName).toEqual('1')
  })

  it('update tokenName', async () => {
    const entity = AssetAccountEntity.fromModel(assetAccount)
    const [, e] = await getConnection().manager.save([entity.sudtTokenInfo, entity])
    const saved = e as AssetAccountEntity

    await AssetAccountService.update(saved.id, { tokenName: '1' })

    const result = await getConnection()
      .getRepository(AssetAccountEntity)
      .createQueryBuilder('aa')
      .leftJoinAndSelect('aa.sudtTokenInfo', 'info')
      .where({ id: saved.id })
      .getOne()

    expect(result!.sudtTokenInfo.tokenName).toEqual('1')
  })

  it('update tokenName & symbol & decimal when ckb', async () => {
    const entity = AssetAccountEntity.fromModel(ckbAssetAccount)
    const [, e] = await getConnection().manager.save([entity.sudtTokenInfo, entity])
    const saved = e as AssetAccountEntity

    await AssetAccountService.update(saved.id, { tokenName: '1', symbol: '2', decimal: '3' })

    const result = await getConnection()
      .getRepository(AssetAccountEntity)
      .createQueryBuilder('aa')
      .leftJoinAndSelect('aa.sudtTokenInfo', 'info')
      .where({ id: saved.id })
      .getOne()

    expect(result!.sudtTokenInfo.tokenName).toEqual(ckbAssetAccount.tokenName)
    expect(result!.sudtTokenInfo.symbol).toEqual(ckbAssetAccount.symbol)
    expect(result!.sudtTokenInfo.decimal).toEqual(ckbAssetAccount.decimal)
  })

  it('update accountName & tokenName', async () => {
    const entity = AssetAccountEntity.fromModel(assetAccount)
    const [, e] = await getConnection().manager.save([entity.sudtTokenInfo, entity])
    const saved = e as AssetAccountEntity

    await AssetAccountService.update(saved.id, { accountName: '1', tokenName: '2' })

    const result = await getConnection()
      .getRepository(AssetAccountEntity)
      .createQueryBuilder('aa')
      .leftJoinAndSelect('aa.sudtTokenInfo', 'info')
      .where({ id: saved.id })
      .getOne()

    expect(result!.accountName).toEqual('1')
    expect(result!.sudtTokenInfo.tokenName).toEqual('2')
  })

  describe('#getAll', () => {
    const tokenID = '0x' + '0'.repeat(64)
    const xUdtTokenID = '0x' + '1'.repeat(64)

    describe('with both sUDT and CKB accounts', () => {
      describe('with live cells', () => {
        beforeEach(async () => {
          const assetAccounts = [
            AssetAccount.fromObject({
              tokenID,
              symbol: 'sUDT',
              tokenName: 'sUDT',
              decimal: '0',
              balance: '0',
              accountName: 'sUDT',
              blake160,
              udtType: UDTType.SUDT,
            }),
            AssetAccount.fromObject({
              tokenID: xUdtTokenID,
              symbol: 'xUDT',
              tokenName: 'xUDT',
              decimal: '0',
              balance: '0',
              accountName: 'xUDT',
              blake160,
              udtType: UDTType.XUDT,
            }),
            AssetAccount.fromObject({
              tokenID: 'CKBytes',
              symbol: 'ckb',
              tokenName: 'ckb',
              decimal: '0',
              balance: '0',
              accountName: 'ckb',
              blake160,
            }),
          ]
          const outputs = [
            generateOutput(undefined, undefined, undefined, toShannon(1000)),
            generateOutput(undefined, undefined, undefined, toShannon(1000)),
            generateOutput(tokenID),
            generateOutput(tokenID),
            generateOutput(xUdtTokenID),
          ]
          await createAccounts(assetAccounts, outputs)
        })
        it('includes balance calculations for both sUDT and CKB accounts', async () => {
          const result = await AssetAccountService.getAll(walletId)

          expect(result.length).toEqual(2)
          expect(result.find((a: any) => a.tokenID === tokenID)?.balance).toEqual('200')
          expect(result.find((a: any) => a.tokenID === 'CKBytes')?.balance).toEqual(toShannon(2000 - 61).toString())
        })
      })
      describe('with cells being sent', () => {
        beforeEach(async () => {
          const assetAccounts = [
            AssetAccount.fromObject({
              tokenID,
              symbol: 'sUDT',
              tokenName: 'sUDT',
              decimal: '0',
              balance: '0',
              accountName: 'sUDT',
              blake160,
              udtType: UDTType.SUDT,
            }),
            AssetAccount.fromObject({
              tokenID: xUdtTokenID,
              symbol: 'xUDT',
              tokenName: 'xUDT',
              decimal: '0',
              balance: '0',
              accountName: 'xUDT',
              blake160,
              udtType: UDTType.XUDT,
            }),
            AssetAccount.fromObject({
              tokenID: 'CKBytes',
              symbol: 'ckb',
              tokenName: 'ckb',
              decimal: '0',
              balance: '0',
              accountName: 'ckb',
              blake160,
            }),
          ]
          const outputs = [
            generateOutput(undefined, undefined, undefined, toShannon(1000)),
            generateOutput(undefined, undefined, undefined, toShannon(1000), undefined, undefined, OutputStatus.Sent),
            generateOutput(tokenID),
            generateOutput(tokenID, undefined, undefined, undefined, undefined, undefined, OutputStatus.Sent),
            generateOutput(
              xUdtTokenID,
              undefined,
              undefined,
              undefined,
              undefined,
              undefined,
              undefined,
              undefined,
              UDTType.XUDT
            ),
            generateOutput(
              xUdtTokenID,
              undefined,
              undefined,
              undefined,
              undefined,
              undefined,
              OutputStatus.Sent,
              undefined,
              UDTType.XUDT
            ),
          ]
          await createAccounts(assetAccounts, outputs)
        })
        it('includes balance calculations for both sUDT and CKB accounts', async () => {
          const result = await AssetAccountService.getAll(walletId)

          expect(result.length).toEqual(3)
          expect(result.find((a: any) => a.tokenID === tokenID)?.balance).toEqual('200')
          expect(result.find((a: any) => a.tokenID === 'CKBytes')?.balance).toEqual(toShannon(2000 - 61).toString())
        })
      })
    })

    describe('with only one newly created CKB cell under a ACP lock', () => {
      beforeEach(async () => {
        const minCapacity = toShannon(61)
        const assetAccounts = [
          AssetAccount.fromObject({
            tokenID: 'CKBytes',
            symbol: 'ckb',
            tokenName: 'ckb',
            decimal: '0',
            balance: '0',
            accountName: 'ckb',
            blake160,
          }),
        ]
        const outputs = [generateOutput(undefined, undefined, undefined, minCapacity)]
        await createAccounts(assetAccounts, outputs)
      })
      it('available balance equals to 0', async () => {
        const result = await AssetAccountService.getAll(walletId)

        expect(result.length).toEqual(1)
        expect(result.find((a: any) => a.tokenID === 'CKBytes')?.balance).toEqual('0')
      })
    })
    describe('with no CKB cells under a ACP lock', () => {
      beforeEach(async () => {
        const assetAccounts = [
          AssetAccount.fromObject({
            tokenID: 'CKBytes',
            symbol: 'ckb',
            tokenName: 'ckb',
            decimal: '0',
            balance: '0',
            accountName: 'ckb',
            blake160,
          }),
        ]
        const outputs: OutputEntity[] = []
        await createAccounts(assetAccounts, outputs)
      })
      it('ignores the asset account', async () => {
        const result = await AssetAccountService.getAll(walletId)

        expect(result.length).toEqual(0)
      })
    })
    describe('with data in some of CKB ACP cells', () => {
      beforeEach(async () => {
        const assetAccounts = [
          AssetAccount.fromObject({
            tokenID: 'CKBytes',
            symbol: 'ckb',
            tokenName: 'ckb',
            decimal: '0',
            balance: '0',
            accountName: 'ckb',
            blake160,
          }),
        ]
        const customData = '0x00'
        const outputs = [
          generateOutput(undefined, undefined, undefined, toShannon(1000)),
          generateOutput(undefined, undefined, undefined, toShannon(2000), undefined, customData),
        ]
        await createAccounts(assetAccounts, outputs)
      })
      it('ignores the balance of CKB ACP cells having data', async () => {
        const result = await AssetAccountService.getAll(walletId)

        expect(result.length).toEqual(1)
        expect(result[0].balance).toEqual(toShannon(1000 - 61).toString())
      })
    })

    describe('with more than one CKB cells under a ACP lock', () => {
      beforeEach(async () => {
        const minCapacity = toShannon(61)
        const assetAccounts = [
          AssetAccount.fromObject({
            tokenID: 'CKBytes',
            symbol: 'ckb',
            tokenName: 'ckb',
            decimal: '0',
            balance: '0',
            accountName: 'ckb',
            blake160,
          }),
        ]
        const outputs = [
          generateOutput(undefined, undefined, undefined, minCapacity),
          generateOutput(undefined, undefined, undefined, toShannon(100)),
        ]
        await createAccounts(assetAccounts, outputs)
      })
      it('available balance equals to total balance subtracts reserved balance (61 CKB)', async () => {
        const result = await AssetAccountService.getAll(walletId)

        expect(result.length).toEqual(1)
        expect(result.find((a: any) => a.tokenID === 'CKBytes')?.balance).toEqual(toShannon(100))
      })
    })

    describe('with only one newly created UDT cell under a ACP lock', () => {
      let result: any[]
      beforeEach(async () => {
        const minCapacity = toShannon(61)
        const assetAccounts = [
          AssetAccount.fromObject({
            tokenID,
            symbol: 'sUDT',
            tokenName: 'sUDT',
            decimal: '0',
            balance: '0',
            accountName: 'sUDT',
            blake160,
          }),
        ]
        const outputs = [generateOutput(tokenID, undefined, undefined, minCapacity, '0')]
        await createAccounts(assetAccounts, outputs)
        result = await AssetAccountService.getAll(walletId)
      })
      it('returns the sUDT asset account', () => {
        expect(result.length).toEqual(1)
      })
      it('available balance equals to 0', async () => {
        expect(result.find(a => a.tokenID === tokenID)?.balance).toEqual('0')
      })
    })

    describe('with asset accounts having no live cells', () => {
      let result: any[]
      beforeEach(async () => {
        const assetAccounts = [
          AssetAccount.fromObject({
            tokenID,
            symbol: 'sUDT',
            tokenName: 'sUDT',
            decimal: '0',
            balance: '0',
            accountName: 'sUDT',
            blake160,
          }),
          AssetAccount.fromObject({
            tokenID: 'CKBytes',
            symbol: 'ckb',
            tokenName: 'ckb',
            decimal: '0',
            balance: '0',
            accountName: 'ckb',
            blake160,
          }),
        ]
        const outputs: any[] = []
        await createAccounts(assetAccounts, outputs)
        result = await AssetAccountService.getAll(walletId)
      })
      it('returns 0 asset accounts', () => {
        expect(result.length).toEqual(0)
      })
    })
  })

  describe('#getAccount', () => {
    let accountIds: number[]
    describe('with both sUDT and CKB accounts', () => {
      beforeEach(async () => {
        const tokenID = '0x' + '0'.repeat(64)
        const assetAccounts = [
          AssetAccount.fromObject({
            tokenID,
            symbol: 'sUDT',
            tokenName: 'sUDT',
            decimal: '0',
            balance: '0',
            accountName: 'sUDT',
            blake160,
            udtType: UDTType.SUDT,
          }),
          AssetAccount.fromObject({
            tokenID: 'CKBytes',
            symbol: 'ckb',
            tokenName: 'ckb',
            decimal: '0',
            balance: '0',
            accountName: 'ckb',
            blake160,
          }),
        ]
        const outputs = [
          generateOutput(undefined, undefined, undefined, toShannon(1000)),
          generateOutput(undefined, undefined, undefined, toShannon(1000)),
          generateOutput(tokenID),
          generateOutput(tokenID),
        ]
        accountIds = await createAccounts(assetAccounts, outputs)
      })
      it('includes balance calculations for both sUDT and CKB accounts', async () => {
        const [sudtAccountId, ckbAccountId] = accountIds
        const ckbAccount = await AssetAccountService.getAccount({ walletID: '', id: ckbAccountId })
        const sudtAccount = await AssetAccountService.getAccount({ walletID: '', id: sudtAccountId })

        if (!ckbAccount) {
          throw new Error('should find ckb account')
        }
        expect(ckbAccount.tokenID).toEqual('CKBytes')
        expect(ckbAccount.balance).toEqual(toShannon(2000 - 61).toString())

        if (!sudtAccount) {
          throw new Error('should find sudt account')
        }
        expect(sudtAccount.tokenID).toEqual(tokenID)
        expect(sudtAccount.balance).toEqual('200')
      })
    })

    describe('with only one newly created CKB cell under a ACP lock', () => {
      beforeEach(async () => {
        const minCapacity = toShannon(61)
        const assetAccounts = [
          AssetAccount.fromObject({
            tokenID: 'CKBytes',
            symbol: 'ckb',
            tokenName: 'ckb',
            decimal: '0',
            balance: '0',
            accountName: 'ckb',
            blake160,
          }),
        ]
        const outputs = [generateOutput(undefined, undefined, undefined, minCapacity)]
        accountIds = await createAccounts(assetAccounts, outputs)
      })
      it('available balance equals to 0', async () => {
        const [ckbAccountId] = accountIds
        const ckbAccount = await AssetAccountService.getAccount({ walletID: '', id: ckbAccountId })

        if (!ckbAccount) {
          throw new Error('should find ckb account')
        }
        expect(ckbAccount.tokenID).toEqual('CKBytes')
        expect(ckbAccount.balance).toEqual('0')
      })
    })
    describe('with no CKB cells under a ACP lock', () => {
      beforeEach(async () => {
        const minCapacity = toShannon(61)
        const assetAccounts = [
          AssetAccount.fromObject({
            tokenID: 'CKBytes',
            symbol: 'ckb',
            tokenName: 'ckb',
            decimal: '0',
            balance: '0',
            accountName: 'ckb',
            blake160,
          }),
        ]
        const outputs = [generateOutput(undefined, undefined, undefined, minCapacity)]
        accountIds = await createAccounts(assetAccounts, outputs)
      })
      it('available balance equals to 0', async () => {
        const [ckbAccountId] = accountIds
        const ckbAccount = await AssetAccountService.getAccount({ walletID: '', id: ckbAccountId })

        if (!ckbAccount) {
          throw new Error('should find ckb account')
        }
        expect(ckbAccount.tokenID).toEqual('CKBytes')
        expect(ckbAccount.balance).toEqual('0')
      })
    })

    describe('with more than one CKB cells under a ACP lock', () => {
      beforeEach(async () => {
        const minCapacity = toShannon(61)
        const assetAccounts = [
          AssetAccount.fromObject({
            tokenID: 'CKBytes',
            symbol: 'ckb',
            tokenName: 'ckb',
            decimal: '0',
            balance: '0',
            accountName: 'ckb',
            blake160,
          }),
        ]
        const outputs = [
          generateOutput(undefined, undefined, undefined, minCapacity),
          generateOutput(undefined, undefined, undefined, toShannon(100)),
        ]
        accountIds = await createAccounts(assetAccounts, outputs)
      })
      it('available balance equals to total balance subtracts reserved balance (61 CKB)', async () => {
        const [ckbAccountId] = accountIds
        const ckbAccount = await AssetAccountService.getAccount({ walletID: '', id: ckbAccountId })

        if (!ckbAccount) {
          throw new Error('should find ckb account')
        }
        expect(ckbAccount.tokenID).toEqual('CKBytes')
        expect(ckbAccount.balance).toEqual(toShannon(100))
      })
    })

    describe('with data in some of CKB ACP cells', () => {
      beforeEach(async () => {
        const assetAccounts = [
          AssetAccount.fromObject({
            tokenID: 'CKBytes',
            symbol: 'ckb',
            tokenName: 'ckb',
            decimal: '0',
            balance: '0',
            accountName: 'ckb',
            blake160,
          }),
        ]
        const customData = '0x00'
        const outputs = [
          generateOutput(undefined, undefined, undefined, toShannon(1000)),
          generateOutput(undefined, undefined, undefined, toShannon(2000), undefined, customData),
        ]
        accountIds = await createAccounts(assetAccounts, outputs)
      })
      it('ignores the balance of CKB ACP cells having data', async () => {
        const [ckbAccountId] = accountIds
        const ckbAccount = await AssetAccountService.getAccount({ walletID: '', id: ckbAccountId })

        expect(ckbAccount!.balance).toEqual(toShannon(1000 - 61).toString())
      })
    })

    describe('with no asset account found', () => {
      it('returns undefined', async () => {
        const ckbAccount = await AssetAccountService.getAccount({ walletID: '', id: 1 })
        expect(ckbAccount).toBeUndefined()
      })
    })
  })

  describe('checkAndSaveAssetAccountWhenSync', () => {
    it('not exists', async () => {
      await AssetAccountService.checkAndSaveAssetAccountWhenSync(assetAccount.tokenID, assetAccount.blake160)

      const all = await getConnection()
        .getRepository(AssetAccountEntity)
        .createQueryBuilder('aa')
        .leftJoinAndSelect('aa.sudtTokenInfo', 'info')
        .getMany()

      expect(all.length).toEqual(1)
      const entity = all[0]
      expect(entity.sudtTokenInfo).not.toBeNull()
      expect(entity.tokenID).toEqual(assetAccount.tokenID)
      expect(entity.sudtTokenInfo.symbol).toEqual('')
      expect(entity.sudtTokenInfo.decimal).toEqual('')
    })

    it('create CKB', async () => {
      const ckbTokenID = 'CKBytes'
      const ckbSymbol = 'CKB'
      const ckbTokenName = 'CKBytes'
      const ckbDecimal = '8'
      await AssetAccountService.checkAndSaveAssetAccountWhenSync(ckbTokenID, assetAccount.blake160)

      const all = await getConnection()
        .getRepository(AssetAccountEntity)
        .createQueryBuilder('aa')
        .leftJoinAndSelect('aa.sudtTokenInfo', 'info')
        .getMany()

      expect(all.length).toEqual(1)
      const entity = all[0]
      expect(entity.tokenID).toEqual(ckbTokenID)
      expect(entity.sudtTokenInfo.tokenName).toEqual(ckbTokenName)
      expect(entity.sudtTokenInfo.symbol).toEqual(ckbSymbol)
      expect(entity.sudtTokenInfo!.decimal).toEqual(ckbDecimal)
    })

    it('sudtTokenInfo exists', async () => {
      const assetAccountEntity = AssetAccountEntity.fromModel(assetAccount)
      await getConnection().manager.save(assetAccountEntity.sudtTokenInfo)
      const tokenInfo = await getConnection()
        .getRepository(SudtTokenInfoEntity)
        .createQueryBuilder('info')
        .where({
          tokenID: assetAccount.tokenID,
        })
        .getOne()
      expect(tokenInfo).not.toBeNull()

      await AssetAccountService.checkAndSaveAssetAccountWhenSync(assetAccount.tokenID, assetAccount.blake160)

      const all = await getConnection()
        .getRepository(AssetAccountEntity)
        .createQueryBuilder('aa')
        .leftJoinAndSelect('aa.sudtTokenInfo', 'info')
        .getMany()

      expect(all.length).toEqual(1)
      const entity = all[0]
      expect(entity.sudtTokenInfo).not.toBeNull()
      expect(entity.tokenID).toEqual(assetAccount.tokenID)
      expect(entity.sudtTokenInfo.symbol).toEqual(assetAccount.symbol)
    })

    it('assetAccount exists', async () => {
      const assetAccountEntity = AssetAccountEntity.fromModel(assetAccount)
      await getConnection().manager.save([assetAccountEntity.sudtTokenInfo, assetAccountEntity])
      const aae = await getConnection()
        .getRepository(AssetAccountEntity)
        .createQueryBuilder('aa')
        .leftJoinAndSelect('aa.sudtTokenInfo', 'info')
        .where({
          tokenID: assetAccount.tokenID,
        })
        .getOne()
      expect(aae).not.toBeNull()
      expect(aae!.sudtTokenInfo).not.toBeNull()

      await AssetAccountService.checkAndSaveAssetAccountWhenSync(assetAccount.tokenID, assetAccount.blake160)

      const all = await getConnection()
        .getRepository(AssetAccountEntity)
        .createQueryBuilder('aa')
        .leftJoinAndSelect('aa.sudtTokenInfo', 'info')
        .getMany()

      expect(all.length).toEqual(1)
      const entity = all[0]
      expect(entity.sudtTokenInfo).not.toBeNull()
      expect(entity.tokenID).toEqual(assetAccount.tokenID)
      expect(entity.accountName).toEqual(assetAccount.accountName)
      expect(entity.sudtTokenInfo.symbol).toEqual(assetAccount.symbol)
    })
  })

  describe('checkAndDeleteWhenFork', () => {
    const anyoneCanPayLockHashes = [assetAccountInfo.generateAnyoneCanPayScript(blake160).computeHash()]

    beforeEach(async () => {
      const assetAccounts = [
        AssetAccount.fromObject({
          tokenID: 'CKBytes',
          symbol: 'ckb',
          tokenName: 'ckb',
          decimal: '0',
          balance: '0',
          accountName: 'ckb',
          blake160,
        }),
        AssetAccount.fromObject({
          tokenID: tokenID,
          symbol: 'udt',
          tokenName: 'udt',
          decimal: '0',
          balance: '0',
          accountName: 'udt',
          blake160,
        }),
      ]

      for (const aa of assetAccounts) {
        const e = AssetAccountEntity.fromModel(aa)
        await getConnection().manager.save([e.sudtTokenInfo, e])
      }
    })

    it('delete all', async () => {
      const outputEntities = [
        generateOutput('CKBytes', TransactionStatus.Success, '1'),
        generateOutput('CKBytes', TransactionStatus.Success, '2'),
        generateOutput(tokenID, TransactionStatus.Success, '1'),
        generateOutput(tokenID, TransactionStatus.Success, '2'),
      ]
      for (const e of outputEntities) {
        await getConnection().manager.save([e.transaction, e])
      }

      await AssetAccountService.checkAndDeleteWhenFork('1', anyoneCanPayLockHashes)

      const result = await getConnection().getRepository(AssetAccountEntity).createQueryBuilder('aa').getMany()

      expect(result.length).toEqual(0)
    })

    it('delete udt, for ckb has old tx', async () => {
      const outputEntities = [
        generateOutput('CKBytes', TransactionStatus.Success, '1'),
        generateOutput('CKBytes', TransactionStatus.Success, '2'),
        generateOutput(tokenID, TransactionStatus.Success, '2'),
        generateOutput(tokenID, TransactionStatus.Success, '3'),
      ]
      for (const e of outputEntities) {
        await getConnection().manager.save([e.transaction, e])
      }

      await AssetAccountService.checkAndDeleteWhenFork('2', anyoneCanPayLockHashes)

      const result = await getConnection().getRepository(AssetAccountEntity).createQueryBuilder('aa').getMany()

      expect(result.length).toEqual(1)
      expect(result[0].tokenID).toEqual('CKBytes')
    })

    it('delete udt, when ckb has pending', async () => {
      const outputEntities = [
        generateOutput('CKBytes', TransactionStatus.Success, '1'),
        generateOutput('CKBytes', TransactionStatus.Pending, '2'),
        generateOutput(tokenID, TransactionStatus.Success, '1'),
        generateOutput(tokenID, TransactionStatus.Success, '2'),
      ]
      for (const e of outputEntities) {
        await getConnection().manager.save([e.transaction, e])
      }

      await AssetAccountService.checkAndDeleteWhenFork('1', anyoneCanPayLockHashes)

      const result = await getConnection().getRepository(AssetAccountEntity).createQueryBuilder('aa').getMany()

      expect(result.length).toEqual(1)
      expect(result[0].tokenID).toEqual('CKBytes')
    })

    it('delete ckb, when udt has old tx', async () => {
      const outputEntities = [
        generateOutput('CKBytes', TransactionStatus.Success, '2'),
        generateOutput('CKBytes', TransactionStatus.Success, '3'),
        generateOutput(tokenID, TransactionStatus.Success, '1'),
        generateOutput(tokenID, TransactionStatus.Success, '2'),
      ]
      for (const e of outputEntities) {
        await getConnection().manager.save([e.transaction, e])
      }

      await AssetAccountService.checkAndDeleteWhenFork('2', anyoneCanPayLockHashes)

      const result = await getConnection().getRepository(AssetAccountEntity).createQueryBuilder('aa').getMany()

      expect(result.length).toEqual(1)
      expect(result[0].tokenID).toEqual(tokenID)
    })

    it('delete non', async () => {
      const outputEntities = [
        generateOutput('CKBytes', TransactionStatus.Success, '1'),
        generateOutput('CKBytes', TransactionStatus.Success, '2'),
        generateOutput(tokenID, TransactionStatus.Success, '1'),
        generateOutput(tokenID, TransactionStatus.Success, '2'),
      ]
      for (const e of outputEntities) {
        await getConnection().manager.save([e.transaction, e])
      }

      await AssetAccountService.checkAndDeleteWhenFork('3', anyoneCanPayLockHashes)

      const result = await getConnection().getRepository(AssetAccountEntity).createQueryBuilder('aa').getMany()

      expect(result.length).toEqual(2)
    })
  })

  describe('#generateCreateChequeTx', () => {
    let fakeAssetAccount: AssetAccountEntity
    const receiverAddress = 'receiver address'
    const changeAddressObj = { address: 'change address' }
    const amount = '1'
    const fee = '1'
    const feeRate = '1'
    const description = 'desc'

    const fakeWallet = {
      getNextChangeAddress: () => changeAddressObj,
    }

    beforeEach(async () => {
      const assetAccount = AssetAccount.fromObject({
        tokenID: tokenID,
        symbol: 'udt',
        tokenName: 'udt',
        decimal: '0',
        balance: '0',
        accountName: 'udt',
        blake160,
      })

      const e = AssetAccountEntity.fromModel(assetAccount)
      await getConnection().manager.save([e.sudtTokenInfo])
      const [aa] = await getConnection().manager.save([e])
      fakeAssetAccount = aa

      stubbedWalletServiceGet.mockReturnValue(fakeWallet)

      await AssetAccountService.generateCreateChequeTx(
        walletId,
        fakeAssetAccount.id,
        receiverAddress,
        amount,
        fee,
        feeRate,
        description
      )
    })
    it('generates create cheque tx', () => {
      expect(stubbedGenerateCreateChequeTx).toHaveBeenCalledWith(
        walletId,
        amount,
        expect.objectContaining({ blake160, tokenID }),
        receiverAddress,
        changeAddressObj.address,
        fee,
        feeRate,
        description
      )
    })
  })

  describe('#generateClaimChequeTx', () => {
    let result: any
    let fakeChequeCellOutPoint: OutPoint
    const address = 'address'
    const fakeWallet = {
      getNextChangeAddress: () => ({ address }),
      getAllAddresses: stubbedGetAllAddresses,
    }
    const expectedAssetAccount = new AssetAccount(
      '0x0000000000000000000000000000000000000000000000000000000000000000',
      '',
      '',
      '',
      '',
      '0',
      '0x0000000000000000000000000000000000000000',
      undefined,
      UDTType.SUDT
    )
    const tx = {}
    beforeEach(async () => {
      const receiverDefaultLockScript = SystemScriptInfo.generateSecpScript(blake160)
      const senderDefaultLockScript = SystemScriptInfo.generateSecpScript('0x' + '1'.repeat(40))
      const chequeLock = assetAccountInfo.generateChequeScript(
        receiverDefaultLockScript.computeHash(),
        senderDefaultLockScript.computeHash()
      )
      const output = generateOutput(
        tokenID,
        TransactionStatus.Success,
        '2',
        undefined,
        undefined,
        undefined,
        undefined,
        chequeLock
      )
      await getConnection().manager.save([output.transaction, output])

      stubbedGetAllAddresses.mockResolvedValue([{ blake160 }])
      stubbedWalletServiceGet.mockReturnValue(fakeWallet)
      when(stubbedGenerateClaimChequeTx)
        .calledWith(walletId, expect.anything(), address, undefined, '1000')
        .mockResolvedValue(tx)
      fakeChequeCellOutPoint = OutPoint.fromObject({
        txHash: output.transaction.hash,
        index: '0x0',
      })
    })
    describe('without existing acp', () => {
      beforeEach(async () => {
        result = await AssetAccountService.generateClaimChequeTx(walletId, fakeChequeCellOutPoint)
      })
      it('only returns transaction and asset account object', () => {
        expect(result).toEqual({ tx, assetAccount: expectedAssetAccount })
      })
    })
    describe('with existing acp', () => {
      beforeEach(async () => {
        const assetAccount = AssetAccount.fromObject({
          tokenID: tokenID,
          symbol: 'udt',
          tokenName: 'udt',
          decimal: '0',
          balance: '0',
          accountName: 'udt',
          blake160,
        })

        const e = AssetAccountEntity.fromModel(assetAccount)
        await getConnection().manager.save([e.sudtTokenInfo, e])

        result = await AssetAccountService.generateClaimChequeTx(walletId, fakeChequeCellOutPoint)
      })
      it('returns both transaction and asset account objects', () => {
        expect(result).toEqual({ tx })
      })
    })
  })

  describe('#generateWithdrawChequeTx', () => {
    let fakeChequeCellOutPoint: OutPoint
    beforeEach(async () => {
      const output = generateOutput(tokenID, TransactionStatus.Success, '2')
      await getConnection().manager.save([output.transaction, output])
      fakeChequeCellOutPoint = OutPoint.fromObject({
        txHash: output.transaction.hash,
        index: '0x0',
      })
      await AssetAccountService.generateWithdrawChequeTx(fakeChequeCellOutPoint)
    })
    it('generates cheque withdrawal tx', () => {
      expect(stubbedGenerateWithdrawChequeTx).toHaveBeenCalledWith(
        expect.objectContaining({
          outPoint: {
            index: '0',
            txHash: fakeChequeCellOutPoint.txHash,
          },
        }),
        undefined,
        '1000'
      )
    })
  })

  describe('destroyAssetAccount', () => {
    it('destroy ckb account', async () => {
      const assetAccount = AssetAccount.fromObject({
        tokenID: 'CKBytes',
        symbol: 'ckb',
        tokenName: 'ckb',
        decimal: '0',
        balance: '0',
        accountName: 'ckb',
        blake160,
      })
      const outputs = [generateOutput('CKBytes', undefined, undefined, toShannon(1000))]
      await createAccounts([assetAccount], outputs)
      const walletId = 'walletId'
      stubbedWalletServiceGet.mockReturnValue({ getNextChangeAddress: () => ({ blake160: 'blake160' }) })
      await AssetAccountService.destroyAssetAccount(walletId, assetAccount)
      expect(stubbedGenerateDestroyAssetAccountTx).toHaveBeenCalledWith(
        walletId,
        [
          Input.fromObject({
            previousOutput: outputs[0].outPoint(),
            capacity: outputs[0].capacity,
            lock: outputs[0].lockScript(),
            type: outputs[0].typeScript(),
            lockHash: outputs[0].lockHash,
            typeHash: outputs[0].typeHash,
            data: outputs[0].data,
            since: '0',
          }),
        ],
        'blake160',
        true
      )
    })
    it('destroy sudt account', async () => {
      const assetAccount = AssetAccount.fromObject({
        tokenID: '0x1e6159a251360113fc0fb0e6edb4613fc4a149222a3bebd9710543b8be9663f9',
        symbol: 'sudt',
        tokenName: 'sudt',
        decimal: '0',
        balance: '0',
        accountName: 'sudt',
        blake160,
      })
      const outputs = [generateOutput(assetAccount.tokenID, undefined, undefined, toShannon(1000))]
      await createAccounts([assetAccount], outputs)
      const walletId = 'walletId'
      stubbedWalletServiceGet.mockReturnValue({ getNextChangeAddress: () => ({ blake160: 'blake160' }) })
      await AssetAccountService.destroyAssetAccount(walletId, assetAccount)
      expect(stubbedGenerateDestroyAssetAccountTx).toHaveBeenCalledWith(
        walletId,
        [
          Input.fromObject({
            previousOutput: outputs[0].outPoint(),
            capacity: outputs[0].capacity,
            lock: outputs[0].lockScript(),
            type: outputs[0].typeScript(),
            lockHash: outputs[0].lockHash,
            typeHash: outputs[0].typeHash,
            data: outputs[0].data,
            since: '0',
          }),
        ],
        'blake160',
        false
      )
    })
  })

  describe('sendTx', () => {
    beforeEach(async () => {
      const outputs = [
        generateOutput(undefined, undefined, undefined, toShannon(1000)),
        generateOutput(
          assetAccount.tokenID,
          undefined,
          undefined,
          toShannon(1000),
          toShannon(100),
          undefined,
          OutputStatus.Live,
          assetAccountInfo.generateAnyoneCanPayScript(alice.publicKeyInBlake160)
        ),
      ]
      await createAccounts(accounts, outputs)
    })
    describe('hd wallet', () => {
      it('exception with Asset account already exists!', async () => {
        stubbedWalletServiceGet.mockReturnValueOnce({
          isHardware: () => false,
        })
        await expect(AssetAccountService.sendTx('walletID', assetAccount)).rejects.toThrow(
          new Error('Asset account already exists!')
        )
      })
    })
    describe('hard wallet', () => {
      it('no next address', async () => {
        stubbedWalletServiceGet.mockReturnValueOnce({
          isHardware: () => true,
          getNextAddress: () => undefined,
        })
        await AssetAccountService.sendTx(
          'walletID',
          AssetAccount.fromObject({
            tokenID,
            symbol: 'sUDT',
            tokenName: 'sUDT',
            decimal: '0',
            balance: '0',
            accountName: 'sUDT',
            blake160: alice.publicKeyInBlake160,
          }),
          {},
          'password'
        )
        expect(stubbedTransactionSendersendTx).toHaveBeenCalledWith('walletID', {}, 'password', false, false)
        const count = await getConnection()
          .getRepository(AssetAccountEntity)
          .createQueryBuilder()
          .where({
            tokenID,
            blake160: alice.publicKeyInBlake160,
          })
          .getCount()
        expect(count).toBe(1)
      })
      it('exception with Asset account already exists!', async () => {
        stubbedWalletServiceGet.mockReturnValueOnce({
          isHardware: () => true,
          getNextAddress: () => ({ blake160: alice.publicKeyInBlake160, tokenID: assetAccount.tokenID }),
        })
        await expect(AssetAccountService.sendTx('walletID', assetAccount)).rejects.toThrow(
          new Error('Asset account already exists!')
        )
      })
      it('no acp cell and delete outdate account', async () => {
        stubbedWalletServiceGet.mockReturnValueOnce({
          isHardware: () => true,
          getNextAddress: () => ({ blake160: bob.publicKeyInBlake160, tokenID: assetAccount.tokenID }),
        })
        await AssetAccountService.sendTx('walletID', assetAccount, {}, 'password')
        expect(stubbedTransactionSendersendTx).toHaveBeenCalledWith('walletID', {}, 'password', false, false)
        const count = await getConnection()
          .getRepository(AssetAccountEntity)
          .createQueryBuilder()
          .where({
            tokenID: assetAccount.tokenID,
            blake160: assetAccount.blake160,
          })
          .getCount()
        expect(count).toBe(1)
      })
    })
    it('save a asset account', async () => {
      await AssetAccountService.sendTx(
        'walletID',
        AssetAccount.fromObject({
          tokenID,
          symbol: 'sUDT',
          tokenName: 'sUDT',
          decimal: '0',
          balance: '0',
          accountName: 'sUDT',
          blake160: alice.publicKeyInBlake160,
        }),
        {},
        'password'
      )
      expect(stubbedTransactionSendersendTx).toHaveBeenCalledWith('walletID', {}, 'password', false, false)
      const count = await getConnection()
        .getRepository(AssetAccountEntity)
        .createQueryBuilder()
        .where({
          tokenID,
          blake160: alice.publicKeyInBlake160,
        })
        .getCount()
      expect(count).toBe(1)
    })
  })
})
