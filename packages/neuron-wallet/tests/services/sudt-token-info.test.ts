import SudtTokenInfoEntity from '../../src/database/chain/entities/sudt-token-info'
import SudtTokenInfoService from '../../src/services/sudt-token-info'
import { closeConnection, getConnection, initConnection } from '../setupAndTeardown'
import HdPublicKeyInfo from '../../src/database/chain/entities/hd-public-key-info'
import AssetAccountEntity from '../../src/database/chain/entities/asset-account'
import accounts from '../setupAndTeardown/accounts.fixture'
import { UDTType } from '../../src/utils/const'

const defaultTokenId = '0x' + '0'.repeat(64)

const createSudtTokenInfoEntity = ({
  tokenID,
  symbol,
  tokenName,
  decimal,
}: {
  tokenID: string
  symbol: string
  tokenName: string
  decimal: string
}) => {
  const entity = new SudtTokenInfoEntity()
  entity.tokenID = tokenID
  entity.symbol = symbol
  entity.tokenName = tokenName
  entity.decimal = decimal
  return entity
}
describe('sudt token info service', () => {
  beforeAll(async () => {
    await initConnection()
  })
  afterAll(async () => {
    await closeConnection()
  })
  beforeEach(async () => {
    const connection = getConnection()
    await connection.synchronize(true)
  })

  describe('findSudtTokenInfoByArgs', () => {
    beforeEach(async () => {
      const tokens = [
        {
          tokenID: 'CKBytes',
          symbol: 'ckb',
          tokenName: 'ckb',
          decimal: '0',
        },
        {
          tokenID: defaultTokenId,
          symbol: 'udt',
          tokenName: 'udt',
          decimal: '0',
        },
        {
          tokenID: 'invalid token info',
          symbol: '',
          tokenName: '',
          decimal: '',
        },
      ]
      const repo = getConnection().getRepository(SudtTokenInfoEntity)
      await repo.save(tokens)
    })

    it('find with empty', async () => {
      await expect(SudtTokenInfoService.findSudtTokenInfoByArgs([])).resolves.toHaveLength(0)
    })
    it('can not find', async () => {
      await expect(SudtTokenInfoService.findSudtTokenInfoByArgs(['uknownargs'])).resolves.toHaveLength(0)
    })
    it('find success', async () => {
      await expect(SudtTokenInfoService.findSudtTokenInfoByArgs([defaultTokenId, 'CKBytes'])).resolves.toHaveLength(2)
    })
  })

  describe('getAllSudtTokenInfo', () => {
    beforeEach(async () => {
      const tokens = [
        {
          tokenID: 'CKBytes',
          symbol: 'ckb',
          tokenName: 'ckb',
          decimal: '0',
        },
        {
          tokenID: defaultTokenId,
          symbol: 'udt',
          tokenName: 'udt',
          decimal: '0',
        },
        {
          tokenID: 'invalid token info',
          symbol: '',
          tokenName: '',
          decimal: '',
        },
      ]
      const repo = getConnection().getRepository(SudtTokenInfoEntity)
      await repo.save(tokens)
    })

    it('Get token info list', async () => {
      const list = await SudtTokenInfoService.getAllSudtTokenInfo()
      expect(list.length).toEqual(2)
      expect(list.find((item: any) => item.tokenID === 'CKBytes')).toBeTruthy()
      expect(list.find((item: any) => item.tokenID === defaultTokenId)).toBeTruthy()
    })

    it('Filter invalid token info out', async () => {
      const repo = getConnection().getRepository(SudtTokenInfoEntity)
      const count = await repo.count()
      expect(count).toBe(3)
      const list = await SudtTokenInfoService.getAllSudtTokenInfo()
      expect(list).toHaveLength(2)
    })
  })

  describe('insertSudtTokenInfo', () => {
    it('insert success', async () => {
      const token = {
        tokenID: 'CKBytes',
        symbol: 'ckb',
        tokenName: 'ckb',
        decimal: '0',
      }
      await SudtTokenInfoService.insertSudtTokenInfo(createSudtTokenInfoEntity(token))
      const repo = getConnection().getRepository(SudtTokenInfoEntity)
      await expect(repo.find()).resolves.toHaveLength(1)
    })
    it('if conflict will not update', async () => {
      const token = {
        tokenID: 'CKBytes',
        symbol: 'ckb',
        tokenName: 'ckb',
        decimal: '0',
      }
      await SudtTokenInfoService.insertSudtTokenInfo(createSudtTokenInfoEntity(token))
      await SudtTokenInfoService.insertSudtTokenInfo(
        createSudtTokenInfoEntity({
          ...token,
          tokenName: 'new_ckb',
        })
      )
      const repo = getConnection().getRepository(SudtTokenInfoEntity)
      const result = await repo.find()
      expect(result).toHaveLength(1)
      expect(result[0].tokenName).toBe('ckb')
    })
  })

  describe('getSudtTokenInfo', () => {
    const [assetAccount] = accounts
    beforeEach(async () => {
      const keyEntity = HdPublicKeyInfo.fromObject({
        walletId: 'walletId',
        publicKeyInBlake160: assetAccount.blake160,
        addressType: 0,
        addressIndex: 0,
      })
      await getConnection().manager.save(keyEntity)
    })

    it('no token info', async () => {
      await expect(SudtTokenInfoService.getSudtTokenInfo('0x', UDTType.SUDT)).resolves.toBeNull()
    })

    it('token info not match', async () => {
      const entity = AssetAccountEntity.fromModel(assetAccount)
      await getConnection().manager.save([entity.sudtTokenInfo, entity])
      await expect(SudtTokenInfoService.getSudtTokenInfo(`0x${'00'.repeat(20)}`, UDTType.SUDT)).resolves.toBeNull()
    })

    it('match token info', async () => {
      const entity = AssetAccountEntity.fromModel(assetAccount)
      await getConnection().manager.save([entity.sudtTokenInfo, entity])
      const result = await SudtTokenInfoService.getSudtTokenInfo(assetAccount.tokenID, UDTType.SUDT)
      expect(result).toBeDefined()
      expect(result?.assetAccounts).toHaveLength(1)
    })
  })
})
