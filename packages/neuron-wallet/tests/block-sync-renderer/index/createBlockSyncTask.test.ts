
describe(`Create block sync task`, () => {
  const STUB_ADDRESS_METAS = 'address metas'
  const STUB_LISTEN_URI = 'stub_listen_uri'
  const STUB_NETWORK = { id: 'id', genesisHash: '0x1', remote: 'stub_network_url' }
  const stubbedIndexerServiceStart = jest.fn()
  const stubbedLoggerInfo = jest.fn()
  const stubbedChildProcessOn = jest.fn()
  const stubbedChildProcessSend = jest.fn()
  const stubbedDataUpdateSubjectNext = jest.fn()
  const stubbedGetAddressesByAllWallets = jest.fn().mockResolvedValue(STUB_ADDRESS_METAS)
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
  jest.doMock('services/indexer', () => ({ LISTEN_URI: STUB_LISTEN_URI, getInstance: () => ({ start: stubbedIndexerServiceStart }) }))
  jest.doMock('services/addresses', () => ({ getAddressesByAllWallets: stubbedGetAddressesByAllWallets }))
  jest.doMock('services/networks', () => ({ getInstance: jest.fn().mockReturnValue({ getCurrent: () => STUB_NETWORK }) }))

  const blockSyncRenderer = require('block-sync-renderer')
  const spyRegisterRequest = jest.spyOn(blockSyncRenderer, 'registerRequest').mockResolvedValue(0)

  beforeAll(() => {
    return blockSyncRenderer.createBlockSyncTask()
  })

  it(`should start indexer service`, () => {
    expect(stubbedIndexerServiceStart).toHaveBeenCalled()
  })

  it(`should log info a message`, () => {
    expect(stubbedLoggerInfo).toHaveBeenCalledWith(`Sync:\tstart`)
  })

  it(`should start a child process with fork`, () => {
    expect(stubbedChildProcessFork).toHaveBeenCalled()
  })

  it(`child process should listen to message channel`, () => {
    expect(stubbedChildProcessOn).toHaveBeenCalledWith('message', expect.any(Function))
  })

  it(`child process stderr should listen to data channel`, () => {
    expect(childProcessStdErrEncoding).toHaveBeenCalledWith('utf8')
    expect(stubbedChildProcessStdErrOn).toHaveBeenCalledWith('data', expect.any(Function))
  })

  it(`should send message to data update subject`, () => {
    expect(stubbedDataUpdateSubjectNext).toHaveBeenCalledWith({ actionType: 'update', dataType: 'transaction' })
  })

  it(`should get address metas`, () => {
    expect(stubbedGetAddressesByAllWallets).toHaveBeenCalled()
  })

  it(`should register a request with start channel`, () => {
    expect(spyRegisterRequest).toHaveBeenCalledWith(expect.any(Object), {
      type: 'call',
      channel: 'start',
      id: 0,
      message: {
        addressMetas: STUB_ADDRESS_METAS,
        genesisHash: STUB_NETWORK.genesisHash,
        indexerUrl: STUB_LISTEN_URI,
        url: STUB_NETWORK.remote
      }
    })
  })
})
