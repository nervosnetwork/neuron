import { getConnection } from "typeorm"
import { initConnection } from "../../src/database/chain/ormconfig"
import AssetAccount from "../../src/models/asset-account"
import AssetAccountEntity from "../../src/database/chain/entities/asset-account"
import SudtTokenInfo from "../../src/database/chain/entities/sudt-token-info"
import AssetAccountService from "../../src/services/asset-account-service"
import OutputEntity from "../../src/database/chain/entities/output"
import AssetAccountInfo from "../../src/models/asset-account-info"
import BufferUtils from "../../src/utils/buffer"
import { OutputStatus } from "../../src/models/chain/output"
import SudtTokenInfoEntity from "../../src/database/chain/entities/sudt-token-info"
import TransactionEntity from "../../src/database/chain/entities/transaction"
import { TransactionStatus } from "../../src/models/chain/transaction"
import { createAccounts } from '../setupAndTeardown'
import accounts from '../setupAndTeardown/accounts.fixture'
import HdPublicKeyInfo from "../../src/database/chain/entities/hd-public-key-info"
import { AddressType } from "../../src/models/keys/address"

const [assetAccount, ckbAssetAccount] = accounts

const randomHex = (length: number = 64): string => {
  const str: string = Array.from({ length })
    .map(() => Math.floor(Math.random() * 16).toString(16))
    .join('')

  return `0x${str}`
}
const toShannon = (ckb: string|number) => `${ckb}${'0'.repeat(8)}`

const blake160 = '0x' + '0'.repeat(40)
const assetAccountInfo = new AssetAccountInfo()
const generateOutput = (
  tokenID: string = 'CKBytes',
  txStatus: TransactionStatus = TransactionStatus.Success,
  blockNumber = '0',
  capacity = '1000',
  tokenAmount = '100'
) => {
  const outputEntity = new OutputEntity()
  outputEntity.outPointTxHash = randomHex()
  outputEntity.outPointIndex = '0'
  outputEntity.capacity = capacity
  const lock = assetAccountInfo.generateAnyoneCanPayScript(blake160)
  outputEntity.lockCodeHash = lock.codeHash
  outputEntity.lockArgs = lock.args
  outputEntity.lockHashType = lock.hashType
  outputEntity.lockHash = lock.computeHash()
  outputEntity.status = OutputStatus.Live
  outputEntity.hasData = false
  if (tokenID !== 'CKBytes') {
    const type = assetAccountInfo.generateSudtScript(tokenID)
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

describe('AssetAccountService', () => {
  beforeAll(async () => {
    await initConnection('0x1234')
  })

  afterAll(async () => {
    await getConnection().close()
  })

  beforeEach(async () => {
    const connection = getConnection()
    await connection.synchronize(true)

    const keyInfo = HdPublicKeyInfo.fromObject({
      walletId,
      address: '',
      addressType: AddressType.Receiving,
      addressIndex: 0,
      publicKeyInBlake160: blake160,
    })

    await connection.manager.save(keyInfo)
  })

  it("test for save relation", async () => {
    const entity = AssetAccountEntity.fromModel(assetAccount)
    const saved = await getConnection().manager.save([entity.sudtTokenInfo, entity])

    const sudtTokenInfoCount = await getConnection()
      .getRepository(SudtTokenInfo)
      .createQueryBuilder('s')
      .getCount()

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

    describe('with both sUDT and CKB accounts', () => {
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
        const outputs = [
          generateOutput(undefined, undefined, undefined, toShannon(1000)),
          generateOutput(undefined, undefined, undefined, toShannon(1000)),
          generateOutput(tokenID),
          generateOutput(tokenID),
        ]
        await createAccounts(assetAccounts, outputs)
      });
      it('includes balance calculations for both sUDT and CKB accounts', async () => {
        const result = await AssetAccountService.getAll(walletId)

        expect(result.length).toEqual(2)
        expect(result.find(a => a.tokenID === tokenID)?.balance).toEqual('200')
        expect(result.find(a => a.tokenID === 'CKBytes')?.balance).toEqual(toShannon(2000 - 61).toString())
      })
    });

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
      });
      it('available balance equals to 0', async () => {
        const result = await AssetAccountService.getAll(walletId)

        expect(result.length).toEqual(1)
        expect(result.find(a => a.tokenID === 'CKBytes')?.balance).toEqual('0')
      })
    });
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
      });
      it('ignores the asset account', async () => {
        const result = await AssetAccountService.getAll(walletId)

        expect(result.length).toEqual(0)
      });
    });

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
      });
      it('available balance equals to total balance substracts reserved balance (61 CKB)', async () => {
        const result = await AssetAccountService.getAll(walletId)

        expect(result.length).toEqual(1)
        expect(result.find(a => a.tokenID === 'CKBytes')?.balance).toEqual(toShannon(100))
      });
    });

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
      });
      it('returns the sUDT asset account', () => {
        expect(result.length).toEqual(1)
      })
      it('available balance equals to 0', async () => {
        expect(result.find(a => a.tokenID === tokenID)?.balance).toEqual('0')
      })
    });

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
      });
      it('returns 0 asset accounts', () => {
        expect(result.length).toEqual(0)
      })
    });
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
      });
      it('includes balance calculations for both sUDT and CKB accounts', async () => {
        const [sudtAccountId, ckbAccountId] = accountIds
        const ckbAccount = await AssetAccountService.getAccount({walletID: '', id: ckbAccountId})
        const sudtAccount = await AssetAccountService.getAccount({walletID: '', id: sudtAccountId})

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
    });

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
      });
      it('available balance equals to 0', async () => {
        const [ckbAccountId] = accountIds
        const ckbAccount = await AssetAccountService.getAccount({walletID: '', id: ckbAccountId})

        if (!ckbAccount) {
          throw new Error('should find ckb account')
        }
        expect(ckbAccount.tokenID).toEqual('CKBytes')
        expect(ckbAccount.balance).toEqual('0')
      })
    });
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
      });
      it('available balance equals to 0', async () => {
        const [ckbAccountId] = accountIds
        const ckbAccount = await AssetAccountService.getAccount({walletID: '', id: ckbAccountId})

        if (!ckbAccount) {
          throw new Error('should find ckb account')
        }
        expect(ckbAccount.tokenID).toEqual('CKBytes')
        expect(ckbAccount.balance).toEqual('0')
      })
    });

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
      });
      it('available balance equals to total balance substracts reserved balance (61 CKB)', async () => {
        const [ckbAccountId] = accountIds
        const ckbAccount = await AssetAccountService.getAccount({walletID: '', id: ckbAccountId})

        if (!ckbAccount) {
          throw new Error('should find ckb account')
        }
        expect(ckbAccount.tokenID).toEqual('CKBytes')
        expect(ckbAccount.balance).toEqual(toShannon(100))
      });
    });

    describe('with no asset account found', () => {
      it('returns undefined', async () => {
        const ckbAccount = await AssetAccountService.getAccount({walletID: '', id: 1})
        expect(ckbAccount).toBeUndefined()
      });
    });
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
      await getConnection().manager.save([assetAccountEntity.sudtTokenInfo, assetAccount])
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

    beforeEach(async done => {
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
        })
      ]

      for (const aa of assetAccounts) {
        const e = AssetAccountEntity.fromModel(aa)
        await getConnection().manager.save([e.sudtTokenInfo, e])
      }

      await done()
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

      const result = await getConnection()
        .getRepository(AssetAccountEntity)
        .createQueryBuilder('aa')
        .getMany()

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

      const result = await getConnection()
        .getRepository(AssetAccountEntity)
        .createQueryBuilder('aa')
        .getMany()

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

      const result = await getConnection()
        .getRepository(AssetAccountEntity)
        .createQueryBuilder('aa')
        .getMany()

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

      const result = await getConnection()
        .getRepository(AssetAccountEntity)
        .createQueryBuilder('aa')
        .getMany()

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

      const result = await getConnection()
        .getRepository(AssetAccountEntity)
        .createQueryBuilder('aa')
        .getMany()

      expect(result.length).toEqual(2)
    })
  })

  describe('Test Token Info List', () => {
    beforeEach(async () => {
      const tokens = [
        {
          tokenID: 'CKBytes',
          symbol: 'ckb',
          tokenName: 'ckb',
          decimal: '0',
        },
        {
          tokenID: tokenID,
          symbol: 'udt',
          tokenName: 'udt',
          decimal: '0',
        }
      ]
      const repo = getConnection().getRepository(SudtTokenInfoEntity)
      await repo.save(tokens)
    })

    it('Get token info list', async () => {
      const list = await AssetAccountService.getTokenInfoList()
      expect(list.length).toEqual(2)
      expect(list.find(item => item.tokenID === 'CKBytes')).toBeTruthy()
      expect(list.find(item => item.tokenID === tokenID)).toBeTruthy()
    })

  })
})
