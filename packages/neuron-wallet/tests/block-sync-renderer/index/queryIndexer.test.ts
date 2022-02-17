const STUB_QUERY = 'stub query'
const stubbedIndexerServiceStart = jest.fn()
const stubbedLoggerInfo = jest.fn()
const stubbedChildProcessOn = jest.fn()
const stubbedChildProcessSend = jest.fn()
const stubbedDataUpdateSubjectNext = jest.fn()
const stubbedGetAddressesByAllWallets = jest.fn().mockResolvedValue('address metas')
const stubbedChildProcessStdErrOn = jest.fn()
const childProcessStdErrEncoding = jest.fn().mockImplementation(() => ({ on: stubbedChildProcessStdErrOn }))

const stubbedChildProcessFork = jest.fn().mockImplementation(() => ({
  on: stubbedChildProcessOn,
  kill: jest.fn(),
  once: jest.fn(),
  send: stubbedChildProcessSend,
  stderr: {
    setEncoding: childProcessStdErrEncoding
  }
}))

jest.doMock('child_process', () => ({
  fork: stubbedChildProcessFork
}))

jest.doMock('models/subjects/data-update', () => ({
  next: stubbedDataUpdateSubjectNext,
}))

jest.doMock(`utils/logger`, () => ({ info: stubbedLoggerInfo }))
jest.doMock('services/indexer', () => ({ LISTEN_URI: 'stub_listen_uri', getInstance: () => ({ start: stubbedIndexerServiceStart }) }))
jest.doMock('services/addresses', () => ({ getAddressesByAllWallets: stubbedGetAddressesByAllWallets }))
jest.doMock('services/networks', () => ({ getInstance: jest.fn().mockReturnValue({ getCurrent: () => ({ id: 'id', genesisHash: '0x1', remote: 'stub_network_url' }) }) }))

const blockSyncRenderer = require('block-sync-renderer')
const spyRegisterRequest = jest.spyOn(blockSyncRenderer, 'registerRequest').mockResolvedValue(`returned cells`)

describe(`Child process is not running`, () => {
  it(`should do nothing`, async () => {
    const res = await blockSyncRenderer.queryIndexer()
    expect(res).toEqual([])
  })
})

describe(``, () => {
  beforeAll(() => {
    return blockSyncRenderer.createBlockSyncTask()
  })

  it(`should register a request`, async () => {
    const res = await blockSyncRenderer.queryIndexer(STUB_QUERY)
    expect(spyRegisterRequest).toHaveBeenNthCalledWith(2, expect.any(Object), {
      channel: "queryIndexer",
      id: 1,
      message: STUB_QUERY,
      type: 'call'
    })
    expect(res).toBe('returned cells')
  })



})
