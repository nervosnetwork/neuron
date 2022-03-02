const { NetworkType } = require('models/network')

describe(`switch to network`, () => {
  const STUB_NETWOKR = { id: '', name: '', remote: '', type: NetworkType.Normal, genesisHash: '0x', chain: 'ckb_dev' }
  const stubbedLoggerInfo = jest.fn()
  jest.doMock('utils/logger', () => ({ info: stubbedLoggerInfo }))
  const blockSyncRenderer = require('block-sync-renderer')
  const spyResetSyncTask = jest.spyOn(blockSyncRenderer, 'resetSyncTask').mockResolvedValue(0)

  afterEach(() => {
    stubbedLoggerInfo.mockClear()
  })

  it(`should do nothing when reconnected is false`, () => {
    blockSyncRenderer.switchToNetwork({ ...STUB_NETWOKR, id: undefined })
    expect(stubbedLoggerInfo).not.toHaveBeenCalled()
  })

  it(`should print a message`, () => {
    blockSyncRenderer.switchToNetwork(STUB_NETWOKR, true)
    expect(stubbedLoggerInfo).toHaveBeenCalled()
  })

  it(`should reset sync task`, () => {
    blockSyncRenderer.switchToNetwork(STUB_NETWOKR, true)
    expect(spyResetSyncTask).toHaveBeenCalledWith(true)
  })

})
