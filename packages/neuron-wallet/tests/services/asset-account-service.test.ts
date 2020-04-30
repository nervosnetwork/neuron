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

describe('AssetAccountService', () => {
  beforeAll(async done => {
    await initConnection('0x1234')
    done()
  })

  afterAll(async done => {
    await getConnection().close()
    done()
  })

  beforeEach(async done => {
    const connection = getConnection()
    await connection.synchronize(true)
    done()
  })

  const assetAccount = AssetAccount.fromObject({
    walletID: 'walletID',
    tokenID: 'tokenID',
    symbol: 'symbol',
    tokenName: 'tokenName',
    decimal: '0',
    balance: '0',
    accountName: 'accountName',
    blake160: '0x' + '0'.repeat(40)
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

  describe('getAll', () => {
    const randomHex = (length: number = 64): string => {
      const str: string = Array.from({ length })
        .map(() => Math.floor(Math.random() * 16).toString(16))
        .join('')

      return `0x${str}`
    }

    const blake160 = '0x' + '0'.repeat(40)
    const assetAccountInfo = new AssetAccountInfo()
    const generateOutput = (tokenID: string = 'CKBytes') => {
      const outputEntity = new OutputEntity()
      outputEntity.outPointTxHash = randomHex()
      outputEntity.outPointIndex = '0'
      outputEntity.capacity = '1000'
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
        outputEntity.data = BufferUtils.writeBigUInt128LE(BigInt(100))
      }
      return outputEntity
    }

    it('check balance', async () => {
      const walletID = '1'
      const tokenID = '0x' + '0'.repeat(64)
      const assetAccounts = [
        AssetAccount.fromObject({
          walletID,
          tokenID,
          symbol: 'sUDT',
          tokenName: 'sUDT',
          decimal: '0',
          balance: '0',
          accountName: 'sUDT',
          blake160,
        }),
        AssetAccount.fromObject({
          walletID,
          tokenID: 'CKBytes',
          symbol: 'ckb',
          tokenName: 'ckb',
          decimal: '0',
          balance: '0',
          accountName: 'ckb',
          blake160,
        }),
      ]
      const entities = assetAccounts.map(aa => AssetAccountEntity.fromModel(aa))
      for (const entity of entities) {
        await getConnection().manager.save([
          entity.sudtTokenInfo,
          entity,
        ])
      }

      // create outputs
      const outputEntities = [
        generateOutput(),
        generateOutput(),
        generateOutput(tokenID),
        generateOutput(tokenID),
      ]
      await getConnection().manager.save(outputEntities)

      const anyoneCanPayLockHashes: string[] = [
        assetAccountInfo.generateAnyoneCanPayScript(blake160).computeHash(),
      ]

      const result = await AssetAccountService.getAll(walletID, anyoneCanPayLockHashes)

      expect(result.length).toEqual(2)
      expect(result.find(a => a.tokenID === tokenID)?.balance).toEqual('200')
      expect(result.find(a => a.tokenID === 'CKBytes')?.balance).toEqual('2000')
    })
  })

  describe('checkAndSaveAssetAccountWhenSync', () => {
    it('not exists', async () => {
      await AssetAccountService.checkAndSaveAssetAccountWhenSync(assetAccount.walletID, assetAccount.tokenID, assetAccount.blake160)

      const all = await getConnection()
        .getRepository(AssetAccountEntity)
        .createQueryBuilder('aa')
        .leftJoinAndSelect('aa.sudtTokenInfo', 'info')
        .getMany()

      expect(all.length).toEqual(1)
      const entity = all[0]
      expect(entity.sudtTokenInfo).not.toBeNull()
      expect(entity.walletID).toEqual(assetAccount.walletID)
      expect(entity.tokenID).toEqual(assetAccount.tokenID)
      expect(entity.sudtTokenInfo.symbol).toEqual('???')
    })

    it('sudtTokenInfo exists', async () => {
      const assetAccountEntity = AssetAccountEntity.fromModel(assetAccount)
      await getConnection().manager.save(assetAccountEntity.sudtTokenInfo)
      const tokenInfo = await getConnection()
        .getRepository(SudtTokenInfoEntity)
        .createQueryBuilder('info')
        .where({
          walletID: assetAccount.walletID,
          tokenID: assetAccount.tokenID,
        })
        .getOne()
      expect(tokenInfo).not.toBeNull()

      await AssetAccountService.checkAndSaveAssetAccountWhenSync(assetAccount.walletID, assetAccount.tokenID, assetAccount.blake160)

      const all = await getConnection()
        .getRepository(AssetAccountEntity)
        .createQueryBuilder('aa')
        .leftJoinAndSelect('aa.sudtTokenInfo', 'info')
        .getMany()

      expect(all.length).toEqual(1)
      const entity = all[0]
      expect(entity.sudtTokenInfo).not.toBeNull()
      expect(entity.walletID).toEqual(assetAccount.walletID)
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
          walletID: assetAccount.walletID,
          tokenID: assetAccount.tokenID,
        })
        .getOne()
      expect(aae).not.toBeNull()
      expect(aae!.sudtTokenInfo).not.toBeNull()

      await AssetAccountService.checkAndSaveAssetAccountWhenSync(assetAccount.walletID, assetAccount.tokenID, assetAccount.blake160)

      const all = await getConnection()
        .getRepository(AssetAccountEntity)
        .createQueryBuilder('aa')
        .leftJoinAndSelect('aa.sudtTokenInfo', 'info')
        .getMany()

      expect(all.length).toEqual(1)
      const entity = all[0]
      expect(entity.sudtTokenInfo).not.toBeNull()
      expect(entity.walletID).toEqual(assetAccount.walletID)
      expect(entity.tokenID).toEqual(assetAccount.tokenID)
      expect(entity.accountName).toEqual(assetAccount.accountName)
      expect(entity.sudtTokenInfo.symbol).toEqual(assetAccount.symbol)
    })
  })
})
