import type { Script } from '@ckb-lumos/base'
import LightConnector from '../../src/block-sync-renderer/sync/light-connector'
import AddressMeta from '../../src/database/address/meta'

const getSyncStatusMock = jest.fn()
const getCurrentWalletMinBlockNumberMock = jest.fn()
const getAllSyncStatusToMapMock = jest.fn()
const resetSyncProgressMock = jest.fn()
const updateSyncStatusMock = jest.fn()
const updateSyncProgressFlagMock = jest.fn()
const getWalletMinBlockNumberMock = jest.fn()
const removeByHashesAndAddressType = jest.fn()
const getOtherTypeSyncProgressMock = jest.fn()
const getOtherTypeSyncBlockNumberMock = jest.fn()

const setScriptsMock = jest.fn()
const getScriptsMock = jest.fn()
const getTipHeaderMock = jest.fn()
const getTransactionsMock = jest.fn()
const createBatchRequestMock = jest.fn()

const schedulerWaitMock = jest.fn()
const getMultisigConfigForLightMock = jest.fn()
const walletGetCurrentMock = jest.fn()
const walletGetAllMock = jest.fn()

function mockReset() {
  getSyncStatusMock.mockReset()
  getCurrentWalletMinBlockNumberMock.mockReset()
  getAllSyncStatusToMapMock.mockReset()
  resetSyncProgressMock.mockReset()
  updateSyncStatusMock.mockReset()
  getWalletMinBlockNumberMock.mockReset()
  getOtherTypeSyncProgressMock.mockReset()
  getOtherTypeSyncBlockNumberMock.mockReset()

  setScriptsMock.mockReset()
  getScriptsMock.mockReset()
  getTipHeaderMock.mockReset()
  getTransactionsMock.mockReset()
  createBatchRequestMock.mockReset()

  schedulerWaitMock.mockReset()
  getMultisigConfigForLightMock.mockReset()
  removeByHashesAndAddressType.mockReset()
  walletGetCurrentMock.mockReset()
  walletGetAllMock.mockReset()
}

jest.mock('../../src/services/sync-progress', () => {
  return class {
    static getSyncStatus: any = () => getSyncStatusMock()
    static getCurrentWalletMinBlockNumber: any = () => getCurrentWalletMinBlockNumberMock()
    static getAllSyncStatusToMap: any = () => getAllSyncStatusToMapMock()
    static resetSyncProgress: any = (arg: any) => resetSyncProgressMock(arg)
    static updateSyncStatus: any = (hash: string, update: any) => updateSyncStatusMock(hash, update)
    static updateSyncProgressFlag: any = (walletIds: string[]) => updateSyncProgressFlagMock(walletIds)
    static getWalletMinBlockNumber: any = () => getWalletMinBlockNumberMock()
    static removeByHashesAndAddressType: any = (type: number, scripts: Script[]) =>
      removeByHashesAndAddressType(type, scripts)

    static getOtherTypeSyncProgress: any = () => getOtherTypeSyncProgressMock()
    static getOtherTypeSyncBlockNumber: any = () => getOtherTypeSyncBlockNumberMock()
  }
})

jest.mock('../../src/utils/ckb-rpc', () => ({
  LightRPC: function () {
    return {
      setScripts: setScriptsMock,
      getScripts: getScriptsMock,
      getTipHeader: getTipHeaderMock,
      getTransactions: getTransactionsMock,
      createBatchRequest: () => ({ exec: createBatchRequestMock }),
    }
  },
}))

jest.mock('../../src/services/multisig', () => ({
  getMultisigConfigForLight: () => getMultisigConfigForLightMock(),
}))

jest.mock('../../src/services/wallets', () => ({
  getInstance() {
    return {
      getCurrent: walletGetCurrentMock,
      getAll: walletGetAllMock,
    }
  },
}))

jest.mock('timers/promises', () => ({
  scheduler: {
    wait: (delay: number) => schedulerWaitMock(delay),
  },
}))

const script: Script = {
  args: '0x403f0d4e833b2a8d372772a63facaa310dfeef92',
  codeHash: '0x9bd7e06f3ecf4be0f2fcd2188b23f1b9fcc88e5d4b65a8637b17723bbda3cce8',
  hashType: 'type',
}
// const scriptHash = scriptToHash(script)
const address = 'ckt1qzda0cr08m85hc8jlnfp3zer7xulejywt49kt2rr0vthywaa50xwsq2q8ux5aqem92xnwfmj5cl6e233phlwlysqhjx5w'

describe('test light connector', () => {
  beforeEach(() => {
    walletGetAllMock.mockReturnValue([])
    createBatchRequestMock.mockResolvedValue([])
    getMultisigConfigForLightMock.mockResolvedValue([])
    getOtherTypeSyncProgressMock.mockResolvedValue({})
  })
  afterEach(() => {
    mockReset()
  })

  describe('test initSyncProgress', () => {
    it('there is not exist addressmata', async () => {
      const connect = new LightConnector([], '')
      //@ts-ignore
      await connect.initSyncProgress()
      expect(getScriptsMock).toBeCalledTimes(0)
    })
    it('append multisig script', async () => {
      getScriptsMock.mockResolvedValue([])
      const connect = new LightConnector([], '')
      getOtherTypeSyncBlockNumberMock.mockResolvedValueOnce({})
      //@ts-ignore
      await connect.initSyncProgress([{ walletId: 'walletId', script, addressType: 1, scriptType: 'lock' }])
      expect(getScriptsMock).toBeCalledTimes(1)
      expect(setScriptsMock).toBeCalledWith([
        { script, scriptType: 'lock', walletId: 'walletId', blockNumber: '0x0', addressType: 1 },
      ])
    })
    it('there is not exist sync scripts with light client', async () => {
      getScriptsMock.mockResolvedValue([{ script, blockNumber: '0xaa' }])
      const addressMeta = AddressMeta.fromObject({
        walletId: 'walletId',
        address,
        path: '',
        addressIndex: 10,
        addressType: 0,
        blake160: script.args,
      })
      const connect = new LightConnector([addressMeta], '')
      //@ts-ignore
      await connect.initSyncProgress()
      expect(setScriptsMock).toBeCalledWith([
        {
          script: addressMeta.generateDefaultLockScript().toSDK(),
          scriptType: 'lock',
          walletId: 'walletId',
          blockNumber: '0xaa',
        },
        {
          script: addressMeta.generateACPLockScript().toSDK(),
          scriptType: 'lock',
          walletId: 'walletId',
          blockNumber: '0x0',
        },
        {
          script: addressMeta.generateLegacyACPLockScript().toSDK(),
          scriptType: 'lock',
          walletId: 'walletId',
          blockNumber: '0x0',
        },
      ])
      expect(resetSyncProgressMock).toBeCalledWith([
        {
          script: addressMeta.generateDefaultLockScript().toSDK(),
          scriptType: 'lock',
          walletId: 'walletId',
          blockNumber: '0xaa',
        },
        {
          script: addressMeta.generateACPLockScript().toSDK(),
          scriptType: 'lock',
          walletId: 'walletId',
          blockNumber: '0x0',
        },
        {
          script: addressMeta.generateLegacyACPLockScript().toSDK(),
          scriptType: 'lock',
          walletId: 'walletId',
          blockNumber: '0x0',
        },
      ])
      expect(updateSyncProgressFlagMock).toBeCalledWith(['walletId'])
    })
    it('set new script with the synced min block number', async () => {
      getScriptsMock.mockResolvedValue([])
      const addressMeta = AddressMeta.fromObject({
        walletId: 'walletId',
        address,
        path: '',
        addressIndex: 10,
        addressType: 0,
        blake160: script.args,
      })
      getWalletMinBlockNumberMock.mockResolvedValue({ walletId: 170 })
      const connect = new LightConnector([addressMeta], '')
      //@ts-ignore
      await connect.initSyncProgress()
      expect(setScriptsMock).toBeCalledWith([
        {
          script: addressMeta.generateDefaultLockScript().toSDK(),
          scriptType: 'lock',
          walletId: 'walletId',
          blockNumber: '0xaa',
        },
        {
          script: addressMeta.generateACPLockScript().toSDK(),
          scriptType: 'lock',
          walletId: 'walletId',
          blockNumber: '0xaa',
        },
        {
          script: addressMeta.generateLegacyACPLockScript().toSDK(),
          scriptType: 'lock',
          walletId: 'walletId',
          blockNumber: '0xaa',
        },
      ])
    })
    it('set new script with start block number in wallet', async () => {
      getScriptsMock.mockResolvedValue([])
      const addressMeta = AddressMeta.fromObject({
        walletId: 'walletId',
        address,
        path: '',
        addressIndex: 10,
        addressType: 0,
        blake160: script.args,
      })
      getWalletMinBlockNumberMock.mockResolvedValue({})
      walletGetAllMock.mockReturnValue([{ id: 'walletId', startBlockNumber: '0xaa' }])
      const connect = new LightConnector([addressMeta], '')
      //@ts-ignore
      await connect.initSyncProgress()
      expect(setScriptsMock).toBeCalledWith([
        {
          script: addressMeta.generateDefaultLockScript().toSDK(),
          scriptType: 'lock',
          walletId: 'walletId',
          blockNumber: '0xaa',
        },
        {
          script: addressMeta.generateACPLockScript().toSDK(),
          scriptType: 'lock',
          walletId: 'walletId',
          blockNumber: '0xaa',
        },
        {
          script: addressMeta.generateLegacyACPLockScript().toSDK(),
          scriptType: 'lock',
          walletId: 'walletId',
          blockNumber: '0xaa',
        },
      ])
    })
  })

  describe('test initSync', () => {
    it('pollingIndexer is false', async () => {
      const connect = new LightConnector([], '')
      //@ts-ignore
      connect.synchronize = jest.fn()
      //@ts-ignore
      await connect.initSync()
      expect(schedulerWaitMock).toBeCalledTimes(0)
    })
    it('pollingIndexer is true', async () => {
      const connect = new LightConnector([], '')
      schedulerWaitMock.mockImplementation(() => {
        connect.stop()
      })
      //@ts-ignore
      connect.pollingIndexer = true
      //@ts-ignore
      connect.synchronize = jest.fn()
      //@ts-ignore
      await connect.initSync()
      expect(schedulerWaitMock).toBeCalledWith(5000)
    })
  })

  describe('test connect', () => {
    const mockFn = jest.fn()
    beforeEach(() => {
      mockFn.mockReset()
    })
    it('connect success', async () => {
      const connect = new LightConnector([], '')
      //@ts-ignore
      connect.initSync = mockFn
      await connect.connect()
      expect(mockFn).toBeCalledTimes(1)
    })
    it('connect failed', async () => {
      const connect = new LightConnector([], '')
      //@ts-ignore
      connect.initSync = mockFn
      mockFn.mockImplementation(() => {
        throw new Error('error')
      })
      expect(connect.connect()).rejects.toThrowError(new Error('error'))
    })
  })

  describe('test stop', () => {
    it('test stop', () => {
      const connect = new LightConnector([], '')
      //@ts-ignore
      connect.pollingIndexer = true
      connect.stop()
      //@ts-ignore
      expect(connect.pollingIndexer).toBeFalsy()
    })
  })

  describe('#notifyCurrentBlockNumberProcessed', () => {
    const connector = new LightConnector([], '')
    const updateBlockStartNumberMock = jest.fn()
    beforeAll(() => {
      // @ts-ignore private property
      connector.updateBlockStartNumber = updateBlockStartNumberMock
    })
    beforeEach(() => {
      updateBlockStartNumberMock.mockReset()
    })
    it('last process block number finish', async () => {
      // @ts-ignore private property
      connector.processingBlockNumber = '0xaa'
      getCurrentWalletMinBlockNumberMock.mockResolvedValueOnce(100)
      await connector.notifyCurrentBlockNumberProcessed('0xaa')
      // @ts-ignore private property
      expect(connector.processingBlockNumber).toBeUndefined()
      expect(updateBlockStartNumberMock).toBeCalledWith(100)
    })
    it('not last process block number finish', async () => {
      // @ts-ignore private property
      connector.processingBlockNumber = undefined
      await connector.notifyCurrentBlockNumberProcessed('0xaa')
      expect(updateBlockStartNumberMock).toBeCalledTimes(0)
    })
  })
})
