import { utils } from '@ckb-lumos/lumos';
import LightConnector from '../../src/block-sync-renderer/sync/light-connector'
import SyncProgress from '../../src/database/chain/entities/sync-progress'
import HexUtils from '../../src/utils/hex'
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
    static removeByHashesAndAddressType: any = (type: number, scripts: CKBComponents.Script[]) => removeByHashesAndAddressType(type, scripts)
    static getOtherTypeSyncProgress: any = () => getOtherTypeSyncProgressMock()
  }
})

jest.mock('../../src/utils/ckb-rpc', () => ({
  LightRPC: function() {
    return {
      setScripts: setScriptsMock,
      getScripts: getScriptsMock,
      getTipHeader: getTipHeaderMock,
      getTransactions: getTransactionsMock,
      createBatchRequest: () => ({ exec: createBatchRequestMock }),
    }
  }
}))

jest.mock('../../src/services/multisig', () => ({
  getMultisigConfigForLight: () => getMultisigConfigForLightMock()
}))

jest.mock('../../src/services/wallets', () => ({
  getInstance() {
    return {
      getCurrent: walletGetCurrentMock,
      getAll: walletGetAllMock,
    }
  }
}))

jest.mock('timers/promises', () => ({
  scheduler: {
    wait: (delay: number) => schedulerWaitMock(delay),
  }
}))

const script: CKBComponents.Script = {
  args: '0x403f0d4e833b2a8d372772a63facaa310dfeef92',
  codeHash: '0x9bd7e06f3ecf4be0f2fcd2188b23f1b9fcc88e5d4b65a8637b17723bbda3cce8',
  hashType: 'type'
}
const scriptHash = utils.computeScriptHash(script)
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
  describe('test synchronize', () => {
    it('syncQueue is not idle', async () => {
      const connector = new LightConnector([], '')
      // @ts-ignore: private-method
      connector.syncQueue.push({})
      // @ts-ignore: private-method
      await connector.synchronize()
      expect(getScriptsMock).not.toBeCalled()
    })
    it('syncQueue is idle', async () => {
      getScriptsMock.mockResolvedValue([])
      getAllSyncStatusToMapMock.mockResolvedValue(new Map())
      const connector = new LightConnector([], '')
      // @ts-ignore: private-method
      connector.subscribeSync = jest.fn()
      // @ts-ignore: private-method
      await connector.synchronize()
      expect(getScriptsMock).toBeCalled()
      expect(getAllSyncStatusToMapMock).toBeCalled()
    })
    it('some script sync cursor is not empty', async () => {
      getScriptsMock.mockResolvedValue([])
      const syncProgress = SyncProgress.fromObject({
        script,
        scriptType: 'lock',
        walletId: 'walletId1'
      })
      syncProgress.blockStartNumber = 0
      syncProgress.blockEndNumber = 1
      syncProgress.cursor = '0x1'
      getAllSyncStatusToMapMock.mockResolvedValue(new Map([[scriptHash, syncProgress]]))
      const connector = new LightConnector([], '')
      // @ts-ignore: private-method
      connector.subscribeSync = jest.fn()
      // @ts-ignore: private-method
      await connector.synchronize()
      // @ts-ignore: private-method
      const queue = connector.syncQueue.workersList()
      expect(queue[0].data).toStrictEqual({
        script: {
          codeHash: syncProgress.codeHash,
          hashType: syncProgress.hashType,
          args: syncProgress.args
        },
        blockRange: [HexUtils.toHex(syncProgress.blockStartNumber), HexUtils.toHex(syncProgress.blockEndNumber)],
        scriptType: syncProgress.scriptType,
        cursor: syncProgress.cursor
      })
    })
    it('some script sync cursor is not empty but is in sync queue', async () => {
      getScriptsMock.mockResolvedValue([])
      const syncProgress = SyncProgress.fromObject({
        script,
        scriptType: 'lock',
        walletId: 'walletId1'
      })
      syncProgress.blockStartNumber = 0
      syncProgress.blockEndNumber = 1
      syncProgress.cursor = '0x1'
      getAllSyncStatusToMapMock.mockResolvedValue(new Map([[scriptHash, syncProgress]]))
      const connector = new LightConnector([], '')
      // @ts-ignore: private-method
      connector.syncInQueue.set(scriptHash, {})
      // @ts-ignore: private-method
      connector.subscribeSync = jest.fn()
      // @ts-ignore: private-method
      connector.syncQueue.pause()
      // @ts-ignore: private-method
      await connector.synchronize()
      // @ts-ignore: private-method
      expect(connector.syncQueue.length()).toBe(0)
    })
    it('some script sync to new block', async () => {
      getScriptsMock.mockResolvedValue([{
        script,
        scriptType: 'lock',
        blockNumber: '0xaa'
      }])
      const syncProgress = SyncProgress.fromObject({
        script,
        scriptType: 'lock',
        walletId: 'walletId1'
      })
      syncProgress.blockStartNumber = 0
      syncProgress.blockEndNumber = 1
      getAllSyncStatusToMapMock.mockResolvedValue(new Map([[scriptHash, syncProgress]]))
      const connector = new LightConnector([], '')
      // @ts-ignore: private-method
      connector.subscribeSync = jest.fn()
      // @ts-ignore: private-method
      await connector.synchronize()
      // @ts-ignore: private-method
      const queue = connector.syncQueue.workersList()
      expect(queue[0].data).toStrictEqual({
        script: {
          codeHash: syncProgress.codeHash,
          hashType: syncProgress.hashType,
          args: syncProgress.args
        },
        blockRange: [HexUtils.toHex(syncProgress.blockEndNumber), HexUtils.toHex('0xaa')],
        scriptType: syncProgress.scriptType,
        cursor: syncProgress.cursor
      })
    }),
    it('some script sync to new block but is in sync queue', async () => {
      getScriptsMock.mockResolvedValue([{
        script,
        scriptType: 'lock',
        blockNumber: '0xaa'
      }])
      const syncProgress = SyncProgress.fromObject({
        script,
        scriptType: 'lock',
        walletId: 'walletId1'
      })
      syncProgress.blockStartNumber = 0
      syncProgress.blockEndNumber = 1
      getAllSyncStatusToMapMock.mockResolvedValue(new Map([[scriptHash, syncProgress]]))
      const connector = new LightConnector([], '')
      // @ts-ignore: private-method
      connector.syncInQueue.set(scriptHash, {})
      // @ts-ignore: private-method
      connector.subscribeSync = jest.fn()
      // @ts-ignore: private-method
      connector.syncQueue.pause()
      // @ts-ignore: private-method
      await connector.synchronize()
      // @ts-ignore: private-method
      expect(connector.syncQueue.length()).toBe(0)
    })
  })

  describe('test subscribeSync', () => {
    it('run success', async () => {
      getCurrentWalletMinBlockNumberMock.mockResolvedValue(100)
      getTipHeaderMock.mockResolvedValue({ number: '0xaa' })
      const connector = new LightConnector([], '')
      // @ts-ignore: private-method
      connector.blockTipsSubject = { next: jest.fn() }
      // @ts-ignore: private-method
      await connector.subscribeSync()
      // @ts-ignore: private-method
      expect(connector.blockTipsSubject.next).toBeCalledWith({
        cacheTipNumber: 100,
        indexerTipNumber: 170
      })
    })
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
      //@ts-ignore
      await connect.initSyncProgress([{ walletId: 'walletId', script, addressType: 1, scriptType: 'lock' }])
      expect(getScriptsMock).toBeCalledTimes(1)
      expect(setScriptsMock).toBeCalledWith([
        { script, scriptType: 'lock', walletId: 'walletId', blockNumber: '0x0', addressType: 1, },
      ])
    })
    it('there is not exist sync scripts with light client', async () => {
      getScriptsMock.mockResolvedValue([{ script, blockNumber: '0xaa' }])
      const addressMeta = AddressMeta.fromObject({ walletId: 'walletId', address, path: '', addressIndex: 10, addressType: 0, blake160: script.args })
      const connect = new LightConnector([addressMeta], '')
      //@ts-ignore
      await connect.initSyncProgress()
      expect(setScriptsMock).toBeCalledWith([
        { script: addressMeta.generateDefaultLockScript().toSDK(), scriptType: 'lock', walletId: 'walletId', blockNumber: '0xaa' },
        { script: addressMeta.generateACPLockScript().toSDK(), scriptType: 'lock', walletId: 'walletId', blockNumber: '0x0' },
        { script: addressMeta.generateLegacyACPLockScript().toSDK(), scriptType: 'lock', walletId: 'walletId', blockNumber: '0x0' },
      ])
      expect(resetSyncProgressMock).toBeCalledWith([
        { script: addressMeta.generateDefaultLockScript().toSDK(), scriptType: 'lock', walletId: 'walletId' },
        { script: addressMeta.generateACPLockScript().toSDK(), scriptType: 'lock', walletId: 'walletId' },
        { script: addressMeta.generateLegacyACPLockScript().toSDK(), scriptType: 'lock', walletId: 'walletId' },
      ])
      expect(updateSyncProgressFlagMock).toBeCalledWith(['walletId'])
    })
    it('set new script with the synced min block number', async () => {
      getScriptsMock.mockResolvedValue([])
      const addressMeta = AddressMeta.fromObject({ walletId: 'walletId', address, path: '', addressIndex: 10, addressType: 0, blake160: script.args })
      getWalletMinBlockNumberMock.mockResolvedValue({ 'walletId': 170})
      const connect = new LightConnector([addressMeta], '')
      //@ts-ignore
      await connect.initSyncProgress()
      expect(setScriptsMock).toBeCalledWith([
        { script: addressMeta.generateDefaultLockScript().toSDK(), scriptType: 'lock', walletId: 'walletId', blockNumber: '0xaa' },
        { script: addressMeta.generateACPLockScript().toSDK(), scriptType: 'lock', walletId: 'walletId', blockNumber: '0xaa' },
        { script: addressMeta.generateLegacyACPLockScript().toSDK(), scriptType: 'lock', walletId: 'walletId', blockNumber: '0xaa' },
      ])
    })
    it('set new script with start block number in wallet', async () => {
      getScriptsMock.mockResolvedValue([])
      const addressMeta = AddressMeta.fromObject({ walletId: 'walletId', address, path: '', addressIndex: 10, addressType: 0, blake160: script.args })
      getWalletMinBlockNumberMock.mockResolvedValue({})
      walletGetAllMock.mockReturnValue([{ id: 'walletId', startBlockNumberInLight: '0xaa' }])
      const connect = new LightConnector([addressMeta], '')
      //@ts-ignore
      await connect.initSyncProgress()
      expect(setScriptsMock).toBeCalledWith([
        { script: addressMeta.generateDefaultLockScript().toSDK(), scriptType: 'lock', walletId: 'walletId', blockNumber: '0xaa' },
        { script: addressMeta.generateACPLockScript().toSDK(), scriptType: 'lock', walletId: 'walletId', blockNumber: '0xaa' },
        { script: addressMeta.generateLegacyACPLockScript().toSDK(), scriptType: 'lock', walletId: 'walletId', blockNumber: '0xaa' },
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

  describe('test syncNextWithScript', () => {
    it('no syncprogress in db', async () => {
      getSyncStatusMock.mockResolvedValue(undefined)
      const connect = new LightConnector([], '')
      //@ts-ignore
      await connect.syncNextWithScript({ script, scriptType: 'lock' })
      expect(getTransactionsMock).toBeCalledTimes(0)
    })
    it('there is no tx in blockRange ', async () => {
      const syncProgress = SyncProgress.fromObject({ script, scriptType: 'lock', walletId: 'walletId' })
      getSyncStatusMock.mockResolvedValue(syncProgress)
      getTransactionsMock.mockResolvedValue({ txs: [], lastCursor: '0x' })
      const connect = new LightConnector([], '')
      //@ts-ignore
      await connect.syncNextWithScript({ script, scriptType: 'lock', blockRange: ['0xaa', '0xbb'] })
      expect(getTransactionsMock).toBeCalledWith({ script, blockRange: ['0xaa', '0xbb'], scriptType: 'lock' }, 'asc', '0x64', undefined)
      expect(updateSyncStatusMock).toBeCalledWith(scriptHash, { blockStartNumber: 187, blockEndNumber: 187, cursor: undefined })
    })
    it('there are some txs in blockRange but no more', async () => {
      const syncProgress = SyncProgress.fromObject({ script, scriptType: 'lock', walletId: 'walletId' })
      getSyncStatusMock.mockResolvedValue(syncProgress)
      getTransactionsMock.mockResolvedValue({ txs: [{ txHash: '0xhash1' }], lastCursor: '0x' })
      const connect = new LightConnector([], '')
      //@ts-ignore
      connect.transactionsSubject = { next: jest.fn() }
      //@ts-ignore
      await connect.syncNextWithScript({ script, scriptType: 'lock', blockRange: ['0xaa', '0xbb'] })
      expect(connect.transactionsSubject.next).toBeCalledWith({ txHashes: ['0xhash1'], params: scriptHash })
      //@ts-ignore
      expect(connect.syncInQueue.has(scriptHash)).toBeTruthy()
      //@ts-ignore
      expect(connect.syncInQueue.get(scriptHash)).toStrictEqual({
        blockStartNumber: 187,
        blockEndNumber: 187,
        cursor: undefined,
      })
    })
    it('there are some txs in blockRange and more', async () => {
      const syncProgress = SyncProgress.fromObject({ script, scriptType: 'lock', walletId: 'walletId' })
      getSyncStatusMock.mockResolvedValue(syncProgress)
      getTransactionsMock.mockResolvedValue({ txs: [{ txHash: '0xhash1' }], lastCursor: '0xaa' })
      const connect = new LightConnector([], '')
      //@ts-ignore
      connect.transactionsSubject = { next: jest.fn() }
      //@ts-ignore
      await connect.syncNextWithScript({ script, scriptType: 'lock', blockRange: ['0xaa', '0xbb'] })
      expect(connect.transactionsSubject.next).toBeCalledWith({ txHashes: ['0xhash1'], params: scriptHash })
      //@ts-ignore
      expect(connect.syncInQueue.has(scriptHash)).toBeTruthy()
      //@ts-ignore
      expect(connect.syncInQueue.get(scriptHash)).toStrictEqual({
        blockStartNumber: 170,
        blockEndNumber: 187,
        cursor: '0xaa',
      })
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
      mockFn.mockImplementation(() => { throw new Error('error') })
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

  describe('test notifyCurrentBlockNumberProcessed', () => {
    it ('hash is not in syncInQueue', async () => {
      const connect = new LightConnector([], '')
      const mockFn = jest.fn()
      //@ts-ignore
      connect.subscribeSync = mockFn
      await connect.notifyCurrentBlockNumberProcessed('0xhash1')
      expect(updateSyncStatusMock).toBeCalledTimes(0)
      expect(mockFn).toBeCalledTimes(1)
    })
    it ('hash is in syncInQueue', async () => {
      const connect = new LightConnector([], '')
      //@ts-ignore
      connect.subscribeSync = jest.fn()
      //@ts-ignore
      connect.syncInQueue.set('0xhash1', { blockStartNumber: 1, blockEndNumber: 1 })
      await connect.notifyCurrentBlockNumberProcessed('0xhash1')
      //@ts-ignore
      expect(connect.syncInQueue.has('0xhash1')).toBeFalsy()
      expect(updateSyncStatusMock).toBeCalledWith('0xhash1', { blockStartNumber: 1, blockEndNumber: 1 })
    })
  })
})
