import LiveCell from '../../src/models/chain/live-cell'
import Script, { ScriptHashType } from '../../src/models/chain/script'
import { ResponseCode } from '../../src/utils/const'

describe('SUDTController', () => {
  const stubbedGetOneByLockScriptAndTypeScript = jest.fn()
  const stubbedGetTokenInfoList = jest.fn()

  const resetMocks = () => {
    stubbedGetOneByLockScriptAndTypeScript.mockReset()
    stubbedGetTokenInfoList.mockReset()
  }

  jest.doMock('../../src/services/live-cell-service', () => {
    return {
      getInstance: () => ({
        getOneByLockScriptAndTypeScript: stubbedGetOneByLockScriptAndTypeScript,
      }),
    }
  })
  jest.doMock('../../src/services/asset-account-service', () => {
    return {
      getTokenInfoList: stubbedGetTokenInfoList,
    }
  })
  const SUDTController = require('../../src/controllers/sudt').default

  beforeEach(async () => {
    resetMocks()
  })

  describe('get sudtInfo from token list', () => {
    const testTokenID = '0xd238158bbebde3fd313c9077c4ef7c5e8064501baf41bb5fb37067a98df0b7d3'
    const testTokenInfo = {
      tokenID: testTokenID,
      tokenName: 'testTokeName',
      symbol: 'tt',
      decimal: '8',
    }
    beforeEach(async () => {
      stubbedGetTokenInfoList.mockReturnValue([testTokenInfo])
    })

    it('getSUDTTokenInfo from token list success', async () => {
      const sudtController = new SUDTController()
      const tokenInfo = await sudtController.getSUDTTokenInfo({ tokenID: testTokenID })
      expect(tokenInfo).toEqual({
        status: ResponseCode.Success,
        result: testTokenInfo,
      })
    })
  })

  describe('get sudtInfo from cell data', () => {
    const testTokenID = '0x45496bbe3525c3fc1b8a26b5c00d1238870422deab092567b8bb45d61cda1abd'
    const testTokenInfo = {
      tokenID: testTokenID,
      tokenName: 'Eirc-2',
      symbol: 'ET2',
      decimal: '8',
    }
    const testLiveCell = new LiveCell(
      'txHash',
      '0',
      '10000',
      Script.fromObject({ codeHash: `0x${'00'.repeat(32)}`, args: '0x', hashType: ScriptHashType.Type }),
      Script.fromObject({ codeHash: `0x${'00'.repeat(32)}`, args: '0x', hashType: ScriptHashType.Type }),
      '0x080a456972632d320a455432'
    )
    beforeEach(async () => {
      stubbedGetTokenInfoList.mockReturnValue([])
      stubbedGetOneByLockScriptAndTypeScript.mockReturnValue(testLiveCell)
    })

    it('getSUDTTokenInfo from live cell data parse', async () => {
      const sudtController = new SUDTController()
      const tokenInfo = await sudtController.getSUDTTokenInfo({ tokenID: testTokenID })
      expect(tokenInfo).toEqual({
        status: ResponseCode.Success,
        result: testTokenInfo,
      })
    })
  })

  describe('get sudtInfo null', () => {
    const testTokenID = '0x45496bbe3525c3fc1b8a26b5c00d1238870422deab092567b8bb45d61cda1abd'
    beforeEach(async () => {
      stubbedGetTokenInfoList.mockReturnValue([])
    })
    it('getSUDTTokenInfo from live cell data parse', async () => {
      const sudtController = new SUDTController()
      const tokenInfo = await sudtController.getSUDTTokenInfo({ tokenID: testTokenID })
      expect(tokenInfo).toEqual({
        status: ResponseCode.Fail,
      })
    })
  })
})
