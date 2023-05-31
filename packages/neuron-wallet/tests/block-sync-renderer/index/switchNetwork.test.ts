const { NetworkType } = require('models/network')

describe(`switch to network`, () => {
  const STUB_NETWOKR = { id: '', name: '', remote: '', type: NetworkType.Normal, genesisHash: '0x', chain: 'ckb_dev' }
  const stubbedLoggerInfo = jest.fn()
  const asyncPushMock = jest.fn()
  jest.doMock('utils/logger', () => ({ info: stubbedLoggerInfo }))
  jest.doMock('utils/queue', () => ({
    __esModule: true,
    default: jest.fn().mockReturnValue({ asyncPush: asyncPushMock }),
  }))
  const blockSyncRenderer = require('block-sync-renderer')

  afterEach(() => {
    stubbedLoggerInfo.mockClear()
  })

  it(`should do nothing when reconnected is false and network is not changed`, () => {
    blockSyncRenderer.switchToNetwork({ ...STUB_NETWOKR, id: undefined, genesisHash: undefined }, false)
    expect(stubbedLoggerInfo).not.toHaveBeenCalled()
  })

  it(`should print a message when reconnected is true`, () => {
    blockSyncRenderer.switchToNetwork(STUB_NETWOKR, true)
    expect(stubbedLoggerInfo).toHaveBeenCalled()
  })

  it(`should print a message when network id is changed`, () => {
    blockSyncRenderer.switchToNetwork({ ...STUB_NETWOKR, id: '1' })
    expect(stubbedLoggerInfo).toHaveBeenCalled()
  })

  it(`should print a message when network genesisHash is changed`, () => {
    blockSyncRenderer.switchToNetwork({ ...STUB_NETWOKR, genesisHash: '0x01' })
    expect(stubbedLoggerInfo).toHaveBeenCalled()
  })

  it(`should reset sync task`, async () => {
    await blockSyncRenderer.switchToNetwork(STUB_NETWOKR, true)
    expect(asyncPushMock).toHaveBeenCalledWith(true)
  })
})
