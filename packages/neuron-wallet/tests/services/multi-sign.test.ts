import { getConnection } from 'typeorm'
import { initConnection } from '../../src/database/chain/ormconfig'
import MultiSignConfig from '../../src/database/chain/entities/multi-sign-config'
import MultiSignConfigModel from '../../src/models/multi-sign-config'
import MultiSignService from '../../src/services/multi-sign'

describe('multisign service', () => {
  const multiSignService = new MultiSignService()
  const multiSignConfigModel = new MultiSignConfigModel(
    'walletId',
    1,
    2,
    3,
    ['addresses'],
    'fullpayload'
  );
  const defaultMultisignConfig = MultiSignConfig.fromModel(multiSignConfigModel)

  beforeAll(async () => {
    await initConnection('0x1234')
  })

  afterAll(async () => {
    await getConnection().close()
  })

  beforeEach(async () => {
    const res = await multiSignService.saveMultiSignConfig(defaultMultisignConfig)
    multiSignConfigModel.id = res?.id
  })

  afterEach(async () => {
    await multiSignService.deleteConfig(multiSignConfigModel.id!)
  })

  describe('save multisign config', () => {
    it('has exist', async () => {
      expect(multiSignService.saveMultiSignConfig(defaultMultisignConfig)).rejects.toThrow()
    })
    it('save success', async () => {
      const originalWalletId = multiSignConfigModel.walletId
      multiSignConfigModel.walletId = 'walletId1'
      const res = await multiSignService.saveMultiSignConfig(MultiSignConfig.fromModel(multiSignConfigModel))
      const count = await getConnection()
        .getRepository(MultiSignConfig)
        .createQueryBuilder()
        .where({
          id: res.id
        })
        .getCount()
      expect(count).toBe(1)
      multiSignConfigModel.walletId = originalWalletId
      await multiSignService.deleteConfig(res.id)
    })
  })

  describe('update config', () => {
    it('update config is not exist', async () => {
      expect(multiSignService.updateMultiSignConfig({
        id: 10000,
        alias: 'error'
      })).rejects.toThrow()
    })
    it('update config success', async () => {
      await multiSignService.updateMultiSignConfig({
        id: multiSignConfigModel.id!,
        alias: 'newalisa'
      })
      const config = await getConnection()
        .getRepository(MultiSignConfig)
        .createQueryBuilder()
        .where({
          id: multiSignConfigModel.id
        })
        .getOne()
      expect(config?.alias).toBe('newalisa')
    })
  })
  
  describe('test get config', () => {
    it('no config', async () => {
      const configs = await multiSignService.getMultiSignConfig('noconfigwallet')
      expect(configs).toHaveLength(0)
    })
    it('has config wallet', async () => {
      const configs = await multiSignService.getMultiSignConfig(multiSignConfigModel.walletId)
      expect(configs).toHaveLength(1)
    })
  })

  describe('test delete config', () => {
    it('delete success', async () => {
      await multiSignService.deleteConfig(multiSignConfigModel.id!)
      const count = await getConnection()
        .getRepository(MultiSignConfig)
        .createQueryBuilder()
        .where({
          walletId: multiSignConfigModel.walletId
        })
        .getCount()
      expect(count).toBe(0)
    })
  })
})