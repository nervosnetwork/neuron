const STUB_START_MESSAGE = {
  type: 'call',
  id: 0,
  channel: 'start',
  message: {
    genesisHash: 'stub_genesis_hash',
    url: 'stub_url',
    addressMetas: 'stub_address_metas',
    indexerUrl: 'stub_indexer_url'
  }
}

const STUB_QUERY_INDEXER_MESSAGE = {
  type: 'call',
  id: 1,
  channel: 'queryIndexer',
  message: 'stub_query_indexer_message'
}
const STUB_UNMOUNT_MESSAGE = {
  type: 'call',
  id: 2,
  channel: 'unmount'
}

const STUB_LIVE_CELLS = ['stub_live_cells']

describe(`Block Sync Task`, () => {
  const stubbedSyncQueueStart = jest.fn()
  const stubbedSyncQueueStopAndWait = jest.fn()
  const stubbedGetLiveCellsByScript = jest.fn().mockResolvedValue(STUB_LIVE_CELLS)
  const stubbedSyncQueue = jest.fn().mockImplementation(() => ({
    start: stubbedSyncQueueStart,
    stopAndWait: stubbedSyncQueueStopAndWait,
    getIndexerConnector: jest.fn().mockImplementation(() => ({
      getLiveCellsByScript: stubbedGetLiveCellsByScript
    }))
  }))
  const stubbedInitConnection = jest.fn()
  const stubbedLoggerError = jest.fn()
  const stubbedLoggerDebug = jest.fn()
  const stubbedRegisterTxStatusListener = jest.fn()
  jest.doMock('database/chain/ormconfig', () => stubbedInitConnection)
  jest.doMock('block-sync-renderer/sync/queue', () => stubbedSyncQueue)
  jest.doMock('utils/logger', () => ({ error: stubbedLoggerError, debug: stubbedLoggerDebug }))
  jest.doMock('block-sync-renderer/tx-status-listener', () => ({ register: stubbedRegisterTxStatusListener }))

  const spyProcessSend = jest.spyOn(process, 'send')

  const { listener } = require('block-sync-renderer/task')

  it(`should have side effect`, () => {
    expect(stubbedRegisterTxStatusListener).toHaveBeenCalledTimes(1)
  })

  describe(`start task`, () => {
    beforeAll(() => {
      listener(STUB_START_MESSAGE)
    })

    afterAll(() => {
      jest.clearAllMocks()
    })

    it(`should connect to database`, async () => {
      expect(stubbedInitConnection).toHaveBeenCalledTimes(1)
      expect(stubbedInitConnection).toHaveBeenCalledWith(STUB_START_MESSAGE.message.genesisHash)
    })

    it(`should create a new sync queue`, () => {
      expect(stubbedSyncQueue).toHaveBeenCalledWith(
        STUB_START_MESSAGE.message.url,
        STUB_START_MESSAGE.message.addressMetas,
        STUB_START_MESSAGE.message.indexerUrl
      )
      expect(stubbedSyncQueueStart).toHaveBeenCalled()
    })

    it(`should send message to main process`, () => {
      expect(spyProcessSend).toHaveBeenCalledWith({
        id: STUB_START_MESSAGE.id,
        type: 'response',
        channel: STUB_START_MESSAGE.channel,
        message: null
      })
    })
  })

  describe(`query indexer from the task`, () => {
    beforeEach(() => {
      spyProcessSend.mockClear()
    })

    it(`should send message with empty result`, async () => {
      await listener({ ...STUB_QUERY_INDEXER_MESSAGE, message: null })
      expect(spyProcessSend).toHaveBeenCalledWith({
        id: STUB_QUERY_INDEXER_MESSAGE.id,
        type: 'response',
        channel: STUB_QUERY_INDEXER_MESSAGE.channel,
        message: []
      })
    })

    it(`should send what sync queue returns`, async () => {
      await listener(STUB_QUERY_INDEXER_MESSAGE)
      expect(spyProcessSend).toHaveBeenCalledWith({
        id: STUB_QUERY_INDEXER_MESSAGE.id,
        type: 'response',
        channel: STUB_QUERY_INDEXER_MESSAGE.channel,
        message: STUB_LIVE_CELLS
      })
    })
  })

  describe(`unmount task`, () => {
    it(`child process should exit`, async () => {
      await listener(STUB_UNMOUNT_MESSAGE)
      expect(stubbedLoggerDebug).toHaveBeenNthCalledWith(1, `Sync:\tstopping`)
      expect(stubbedLoggerDebug).toHaveBeenNthCalledWith(2, `Sync:\tstopped`)
      expect(stubbedSyncQueueStopAndWait).toHaveBeenCalledTimes(1)
    })
  })

  describe(`handle kill`, () => {
    const fn = () => {}
    const spyProcessKill = jest.spyOn(process, 'exit').mockImplementation(fn as () => never)
    it(`should exit with 0`, async () => {
      await listener({ type: 'kill' })
      expect(spyProcessKill).toHaveBeenCalledWith(0)
    })
  })

  describe(`handle invalid message`, () => {
    beforeEach(() => {
      spyProcessSend.mockClear()
    })

    it(`should do nothing`, async () => {
      await listener({ type: 'invalid_call' })
      expect(spyProcessSend).not.toHaveBeenCalled()
    })
  })
})
