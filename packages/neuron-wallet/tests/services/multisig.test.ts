import { getConnection } from 'typeorm'
import { initConnection } from '../../src/database/chain/ormconfig'
import MultisigConfig from '../../src/database/chain/entities/multisig-config'
import MultisigConfigModel from '../../src/models/multisig-config'
import MultisigService from '../../src/services/multisig'

describe('multisig service', () => {
  const multisigService = new MultisigService()
  const multisigConfigModel = new MultisigConfigModel(
    'walletId',
    1,
    2,
    3,
    ['addresses'],
    'fullpayload'
  );
  const defaultMultisigConfig = MultisigConfig.fromModel(multisigConfigModel)

  beforeAll(async () => {
    await initConnection('0x1234')
  })

  afterAll(async () => {
    await getConnection().close()
  })

  beforeEach(async () => {
    const res = await multisigService.saveMultisigConfig(defaultMultisigConfig)
    multisigConfigModel.id = res?.id
  })

  afterEach(async () => {
    await multisigService.deleteConfig(multisigConfigModel.id!)
  })

  describe('save multisig config', () => {
    it('has exist', async () => {
      expect(multisigService.saveMultisigConfig(defaultMultisigConfig)).rejects.toThrow()
    })
    it('save success', async () => {
      const originalWalletId = multisigConfigModel.walletId
      multisigConfigModel.walletId = 'walletId1'
      const res = await multisigService.saveMultisigConfig(MultisigConfig.fromModel(multisigConfigModel))
      const count = await getConnection()
        .getRepository(MultisigConfig)
        .createQueryBuilder()
        .where({
          id: res.id
        })
        .getCount()
      expect(count).toBe(1)
      multisigConfigModel.walletId = originalWalletId
      await multisigService.deleteConfig(res.id)
    })
  })

  describe('update config', () => {
    it('update config is not exist', async () => {
      expect(multisigService.updateMultisigConfig({
        id: 10000,
        alias: 'error'
      })).rejects.toThrow()
    })
    it('update config success', async () => {
      await multisigService.updateMultisigConfig({
        id: multisigConfigModel.id!,
        alias: 'newalisa'
      })
      const config = await getConnection()
        .getRepository(MultisigConfig)
        .createQueryBuilder()
        .where({
          id: multisigConfigModel.id
        })
        .getOne()
      expect(config?.alias).toBe('newalisa')
    })
  })
  
  describe('test get config', () => {
    it('no config', async () => {
      const configs = await multisigService.getMultisigConfig('noconfigwallet')
      expect(configs).toHaveLength(0)
    })
    it('has config wallet', async () => {
      const configs = await multisigService.getMultisigConfig(multisigConfigModel.walletId)
      expect(configs).toHaveLength(1)
    })
  })

  describe('test delete config', () => {
    it('delete success', async () => {
      await multisigService.deleteConfig(multisigConfigModel.id!)
      const count = await getConnection()
        .getRepository(MultisigConfig)
        .createQueryBuilder()
        .where({
          walletId: multisigConfigModel.walletId
        })
        .getCount()
      expect(count).toBe(0)
    })
  })
})