describe(`Reset sync task`, () => {
  const stubbedmaintainAddressesIfNecessary = jest.fn()
  const stubbedSleep = jest.fn()
  jest.doMock('services/wallets', () => ({ getInstance: () => ({ maintainAddressesIfNecessary: stubbedmaintainAddressesIfNecessary }) }))
  jest.doMock('utils/common', () => ({ sleep: stubbedSleep }))

  const blockSyncRenderer = require('block-sync-renderer')
  const spyCreateBlockSyncTask = jest.spyOn(blockSyncRenderer, 'createBlockSyncTask').mockImplementation(() => jest.fn())
  const spyKillBlockSyncTask = jest.spyOn(blockSyncRenderer, 'killBlockSyncTask').mockImplementation(() => jest.fn())

  describe(`with (startTask = false)`, () => {
    beforeAll(() => {
      blockSyncRenderer.resetSyncTask(false)
    })

    afterAll(() => {
      spyKillBlockSyncTask.mockClear()
      stubbedmaintainAddressesIfNecessary.mockClear()
      stubbedSleep.mockClear()
    })

    it(`should kill block sync task`, () => {
      expect(spyKillBlockSyncTask).toHaveBeenCalledTimes(1)
    })

    it(`should not generate addresses if necessary`, () => {
      expect(stubbedmaintainAddressesIfNecessary).not.toHaveBeenCalled()
    })

    it(`should not sleep 3s`, () => {
      expect(stubbedSleep).not.toHaveBeenCalled()
    })

    it(`should not create a new block sync task`, () => {
      expect(spyCreateBlockSyncTask).not.toHaveBeenCalled()
    })
  })

  describe(`with (startTask = true)`, () => {
    beforeAll(async () => {
      await blockSyncRenderer.resetSyncTask(true)
    })

    afterAll(() => {
      spyKillBlockSyncTask.mockClear()
      stubbedmaintainAddressesIfNecessary.mockClear()
      stubbedSleep.mockClear()
    })

    it(`should kill block sync task`, () => {
      expect(spyKillBlockSyncTask).toHaveBeenCalledTimes(1)
    })

    it(`should not generate addresses if necessary`, () => {
      expect(stubbedmaintainAddressesIfNecessary).toHaveBeenCalledTimes(1)
    })

    it(`should sleep 3s`, () => {
      expect(stubbedSleep).toHaveBeenCalledTimes(1)
      expect(stubbedSleep).toHaveBeenCalledWith(3000)
    })

    it(`should not create a new block sync task`, () => {
      expect(spyCreateBlockSyncTask).toHaveBeenCalledTimes(1)
    })
  })
})
