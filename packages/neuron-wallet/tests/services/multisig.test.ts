import { getConnection } from 'typeorm'
import { initConnection } from '../../src/database/chain/ormconfig'
import MultisigConfig from '../../src/database/chain/entities/multisig-config'
import MultisigConfigModel from '../../src/models/multisig-config'
import MultisigService from '../../src/services/multisig'
import MultisigOutput from '../../src/database/chain/entities/multisig-output'
import { OutputStatus } from '../../src/models/chain/output'
import { keyInfos } from '../setupAndTeardown/public-key-info.fixture'
import Multisig from '../../src/models/multisig'
import SystemScriptInfo from '../../src/models/system-script-info'
import { utils } from '@ckb-lumos/lumos';

const [alice, bob, charlie] = keyInfos

const rpcBatchRequestMock = jest.fn()
jest.mock('../../src/utils/rpc-request', () => ({
  rpcBatchRequest: () => rpcBatchRequestMock(),
}))
const multisigOutputChangedSubjectNextMock = jest.fn()
jest.mock('../../src/models/subjects/multisig-output-db-changed-subject', () => ({
  getSubject() {
    return {
      next: multisigOutputChangedSubjectNextMock,
    }
  },
}))

describe('multisig service', () => {
  const multisigService = new MultisigService()
  const multisigConfigModel = new MultisigConfigModel(
    'walletId',
    1,
    2,
    3,
    [alice.publicKeyInBlake160, bob.publicKeyInBlake160, charlie.publicKeyInBlake160],
    'alias'
  )
  const defaultMultisigConfig = MultisigConfig.fromModel(multisigConfigModel)
  defaultMultisigConfig.lastestBlockNumber = '0x0'
  const lock = {
    args: Multisig.hash(
      multisigConfigModel.blake160s,
      multisigConfigModel.r,
      multisigConfigModel.m,
      multisigConfigModel.n
    ),
    codeHash: SystemScriptInfo.MULTI_SIGN_CODE_HASH,
    hashType: SystemScriptInfo.MULTI_SIGN_HASH_TYPE,
  }
  const defaultTxOutpoint = { tx_hash: 'tx_hash', index: '0x0' }
  const defaultOutput = {
    out_point: defaultTxOutpoint,
    output: {
      lock: {
        args: lock.args,
        code_hash: lock.codeHash,
        hash_type: lock.hashType,
      },
      capacity: '6100000000',
    },
  }
  const multisigOutput = MultisigOutput.fromIndexer(defaultOutput)

  beforeAll(async () => {
    await initConnection('0x1234')
  })

  afterAll(async () => {
    await getConnection().close()
  })

  beforeEach(async () => {
    const res = await multisigService.saveMultisigConfig(defaultMultisigConfig)
    multisigConfigModel.id = res?.id
    await getConnection().manager.save(multisigOutput)
    rpcBatchRequestMock.mockResolvedValue([])
  })
  afterEach(async () => {
    const connection = getConnection()
    await connection.synchronize(true)
    rpcBatchRequestMock.mockReset()
    multisigOutputChangedSubjectNextMock.mockReset()
  })

  describe('save multisig config', () => {
    it('has exist', async () => {
      await expect(multisigService.saveMultisigConfig(defaultMultisigConfig)).rejects.toThrow()
    })
    it('save success', async () => {
      defaultMultisigConfig.walletId = 'walletId1'
      const res = await multisigService.saveMultisigConfig(defaultMultisigConfig)
      const count = await getConnection()
        .getRepository(MultisigConfig)
        .createQueryBuilder()
        .where({
          id: res.id,
        })
        .getCount()
      expect(count).toBe(1)
      defaultMultisigConfig.walletId = 'walletId'
    })
  })

  describe('update config', () => {
    it('update config is not exist', async () => {
      expect(
        multisigService.updateMultisigConfig({
          id: 10000,
          alias: 'error',
        })
      ).rejects.toThrow()
    })
    it('update config success', async () => {
      await multisigService.updateMultisigConfig({
        id: multisigConfigModel.id!,
        alias: 'newalisa',
      })
      const config = await getConnection()
        .getRepository(MultisigConfig)
        .createQueryBuilder()
        .where({
          id: multisigConfigModel.id,
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
          walletId: multisigConfigModel.walletId,
        })
        .getCount()
      expect(count).toBe(0)
    })
  })

  describe('getLiveCells', () => {
    it('params is empty', async () => {
      const res = await MultisigService.getLiveCells([])
      expect(res).toHaveLength(0)
    })

    it('no live cell', async () => {
      const res = await MultisigService.getLiveCells([defaultMultisigConfig])
      expect(res).toHaveLength(0)
    })

    it('a live cell', async () => {
      rpcBatchRequestMock.mockResolvedValueOnce([
        {
          result: { objects: [defaultOutput] },
        },
      ])
      const res = await MultisigService.getLiveCells([defaultMultisigConfig])
      expect(res).toHaveLength(1)
      expect(res[0]).toEqual(MultisigOutput.fromIndexer(defaultOutput))
    })

    it('filter cell with type', async () => {
      rpcBatchRequestMock.mockResolvedValueOnce([
        {
          result: {
            objects: [
              defaultOutput,
              {
                out_point: { tx_hash: 'tx_hash_1', index: '0x0' },
                output: { lock, type: { args: '', code_hash: '', hash_type: '' }, capacity: '6100000000' },
              },
            ],
          },
        },
      ])
      const res = await MultisigService.getLiveCells([defaultMultisigConfig])
      expect(res).toHaveLength(1)
      expect(res[0]).toEqual(MultisigOutput.fromIndexer(defaultOutput))
    })
  })

  describe('removeDulpicateConfig', () => {
    it('exist duplicate config', () => {
      const multisigConfigModel = new MultisigConfigModel(
        'walletId',
        1,
        2,
        3,
        [alice.publicKeyInBlake160, bob.publicKeyInBlake160, charlie.publicKeyInBlake160],
      )
      const multisigConfigs = [
        MultisigConfig.fromModel(multisigConfigModel),
        MultisigConfig.fromModel(multisigConfigModel),
      ]
      //@ts-ignore private-method
      const res = MultisigService.removeDulpicateConfig(multisigConfigs)
      expect(res.length).toBe(1)
    })
    it('non-exist duplicate config', () => {
      const multisigConfigs = [
        MultisigConfig.fromModel(new MultisigConfigModel(
          'walletId',
          1,
          2,
          3,
          [alice.publicKeyInBlake160, bob.publicKeyInBlake160, charlie.publicKeyInBlake160],
        )),
        MultisigConfig.fromModel(new MultisigConfigModel(
          'walletId',
          2,
          2,
          3,
          [alice.publicKeyInBlake160, bob.publicKeyInBlake160, charlie.publicKeyInBlake160],
        )),
      ]
      //@ts-ignore private-method
      const res = MultisigService.removeDulpicateConfig(multisigConfigs)
      expect(res.length).toBe(2)
    })
  })

  describe('saveLiveMultisigOutput', () => {
    it('no live cell save', async () => {
      await MultisigService.saveLiveMultisigOutput()
      expect(multisigOutputChangedSubjectNextMock).toHaveBeenCalledTimes(0)
    })
    it('with live cell save', async () => {
      rpcBatchRequestMock.mockResolvedValueOnce([
        {
          result: { objects: [defaultOutput] },
        },
      ])
      await MultisigService.saveLiveMultisigOutput()
      expect(multisigOutputChangedSubjectNextMock).toHaveBeenCalledWith('create')
    })
  })
  describe('getMultisigTransactionHashList', () => {
    it('params is empty', async () => {
      const res = await MultisigService.getMultisigTransactionHashList([])
      expect(res).toEqual(new Set())
    })

    it('no Transaction', async () => {
      const res = await MultisigService.getMultisigTransactionHashList([defaultMultisigConfig])
      expect(res).toEqual(new Set())
    })

    it('a Transaction', async () => {
      rpcBatchRequestMock.mockResolvedValueOnce([
        {
          result: { objects: [{ tx_hash: defaultTxOutpoint.tx_hash }] },
        },
      ])
      const res = await MultisigService.getMultisigTransactionHashList([defaultMultisigConfig])
      expect(res).toEqual(new Set([defaultTxOutpoint.tx_hash]))
    })
  })

  describe('deleteDeadMultisigOutput', () => {
    it('no transaction', async () => {
      // @ts-ignore Private method
      await MultisigService.deleteDeadMultisigOutput([])
      expect(multisigOutputChangedSubjectNextMock).toHaveBeenCalledTimes(0)
    })
    it('no delete transaction', async () => {
      rpcBatchRequestMock.mockResolvedValueOnce([
        {
          result: { objects: [{ txHash: defaultTxOutpoint.tx_hash }] },
        },
      ])
      // @ts-ignore Private method
      await MultisigService.deleteDeadMultisigOutput([defaultMultisigConfig])
      const multisigOutputs = await getConnection().getRepository(MultisigOutput).createQueryBuilder().getMany()
      expect(multisigOutputs).toHaveLength(1)
      expect(multisigOutputChangedSubjectNextMock).toHaveBeenCalledTimes(0)
    })
    it('delete a transaction', async () => {
      rpcBatchRequestMock
        .mockResolvedValueOnce([
          {
            result: { objects: [{ tx_hash: defaultTxOutpoint.tx_hash }] },
          },
        ])
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([
          {
            result: {
              transaction: {
                inputs: [{ previous_output: { tx_hash: defaultTxOutpoint.tx_hash, index: defaultTxOutpoint.index } }],
              },
            },
          },
        ])
      // @ts-ignore Private method
      await MultisigService.deleteDeadMultisigOutput([defaultMultisigConfig])
      const multisigOutputs = await getConnection().getRepository(MultisigOutput).createQueryBuilder().getMany()
      expect(multisigOutputs).toHaveLength(0)
      expect(multisigOutputChangedSubjectNextMock).toHaveBeenCalledWith('delete')
    })
  })

  describe('deleteRemovedMultisigOutput', () => {
    it('delete cell thats config not in db', async () => {
      const output = MultisigOutput.fromIndexer(defaultOutput)
      output.lockHash = utils.computeScriptHash(alice.lockScript)
      output.outPointTxHash = '0x9821d3184b5743726e4686541a74213eaa63e2d8f4fb9ee9ff50878aa9177c87'
      await getConnection().manager.save(output)
      await MultisigService.deleteRemovedMultisigOutput()
      const multisigOutputs = await getConnection().getRepository(MultisigOutput).createQueryBuilder().getMany()
      expect(multisigOutputs).toEqual([multisigOutput])
      expect(multisigOutputChangedSubjectNextMock).toHaveBeenCalledWith('delete')
    })
  })

  describe('syncMultisigOutput', () => {
    it('success', async () => {
      await MultisigService.syncMultisigOutput('0xdddddd')
      const multisigConfig = await getConnection().getRepository(MultisigConfig).createQueryBuilder().getOne()
      expect(multisigConfig!.lastestBlockNumber).toEqual('0xdddddd')
    })
  })

  describe('saveSentMultisigOutput', () => {
    it('success', async () => {
      const tx = {
        hash: '0x2fefadab413ae1f919f4e21d53c719b583e124ca817f2497ce7a7688dedfbebb',
        inputs: [
          {
            previousOutput: { txHash: defaultTxOutpoint.tx_hash, index: '0x0' },
          },
        ],
        outputs: [
          {
            capacity: '770000000',
            lock: {
              codeHash: lock.codeHash,
              hashType: lock.hashType,
              args: lock.args,
            },
            lockHash: 'lockHash',
          },
        ],
      }
      await MultisigService.saveSentMultisigOutput(tx as any)
      const sendMultisigConfig = await getConnection()
        .getRepository(MultisigOutput)
        .createQueryBuilder()
        .where({ status: OutputStatus.Sent })
        .getMany()
      expect(sendMultisigConfig).toHaveLength(1)
      expect(sendMultisigConfig[0].capacity).toBe('770000000')
      const pendingMultisigConfig = await getConnection()
        .getRepository(MultisigOutput)
        .createQueryBuilder()
        .where({ status: OutputStatus.Pending })
        .getMany()
      expect(pendingMultisigConfig).toHaveLength(1)
      expect(pendingMultisigConfig[0].capacity).toBe(defaultOutput.output.capacity)
      expect(multisigOutputChangedSubjectNextMock).toHaveBeenCalledWith('update')
    })
  })
})
