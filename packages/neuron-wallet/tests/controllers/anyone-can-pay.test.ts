import AnyoneCanPayController from '../../src/controllers/anyone-can-pay'
import Transaction from '../../src/models/chain/transaction'
import { ServiceHasNoResponse } from '../../src/exceptions'
import { ResponseCode } from '../../src/utils/const'
import AssetAccountInfo from '../../src/models/asset-account-info'
import { config, helpers } from "@ckb-lumos/lumos"

const generateAnyoneCanPayTxMock = jest.fn()
const generateSudtMigrateAcpTxMock = jest.fn()
const getHoldSUDTCellCapacityMock = jest.fn()
jest.mock('../../src/services/anyone-can-pay', () => ({
  // @ts-ignore
  generateAnyoneCanPayTx: (...args) => generateAnyoneCanPayTxMock(...args),
  generateSudtMigrateAcpTx: () => generateSudtMigrateAcpTxMock(),
  // @ts-ignore
  getHoldSUDTCellCapacity: (...args) => getHoldSUDTCellCapacityMock(...args),
}))

const fromObjectMock = jest.fn()
jest.mock('../../src/models/chain/transaction', () => {
  function mockClass() {}
  mockClass.fromObject = () => fromObjectMock()
  return mockClass
})

const sendTxMock = jest.fn()
jest.mock('../../src/services/transaction-sender', () => {
  return function () {
    return {
      sendTx: sendTxMock,
    }
  }
})

const setDescriptionMock = jest.fn()
jest.mock('../../src/services/tx/transaction-description', () => {
  const originalModule = jest.requireActual('../../src/services/tx/transaction-description')

  return {
    __esModule: true,
    ...originalModule,
    set: (a: any, b: any, c: any) => setDescriptionMock(a, b, c),
  }
})

describe('anyone-can-pay-controller', () => {
  const anyoneCanPayController = new AnyoneCanPayController()
  describe('generate-tx', () => {
    const params = {
      walletID: 'string',
      address: 'string',
      amount: 'string',
      assetAccountID: 1,
      feeRate: '0',
      fee: '1000',
    }
    it('throw exception ServiceHasNoResponse', async () => {
      generateAnyoneCanPayTxMock.mockResolvedValueOnce(undefined)
      expect(anyoneCanPayController.generateTx(params)).rejects.toThrow(new ServiceHasNoResponse('AnyoneCanPay'))
      expect(generateAnyoneCanPayTxMock).toHaveBeenCalled()
    })
    it('normal', async () => {
      generateAnyoneCanPayTxMock.mockResolvedValueOnce({})
      const res = await anyoneCanPayController.generateTx(params)
      expect(res).toEqual({
        status: ResponseCode.Success,
        result: {},
      })
    })
  })

  it('generateSendAllTx', async () => {
    const params = {
      walletID: 'string',
      address: 'string',
      amount: 'all',
      assetAccountID: 1,
      feeRate: '0',
      fee: '1000',
    }
    generateAnyoneCanPayTxMock.mockResolvedValueOnce({})
    await anyoneCanPayController.generateTx(params)
    expect(generateAnyoneCanPayTxMock).toHaveBeenCalledWith(
      params.walletID,
      params.address,
      'all',
      params.assetAccountID,
      params.feeRate,
      params.fee,
      undefined
    )
  })

  describe('sendTx', () => {
    const params = {
      walletID: 'string',
      tx: new Transaction('', [], [], [], [], []),
      password: 'string',
      skipLastInputs: false,
    }
    it('throw exception', async () => {
      sendTxMock.mockResolvedValueOnce(undefined)
      expect(anyoneCanPayController.sendTx(params)).rejects.toThrow(new ServiceHasNoResponse('AnyoneCanPay'))
    })
    it('normal with description', async () => {
      const description = 'description'
      const txhash = 'txhash'
      fromObjectMock.mockReturnValueOnce({ description })
      sendTxMock.mockResolvedValueOnce(txhash)
      await anyoneCanPayController.sendTx(params)
      expect(setDescriptionMock).toHaveBeenCalledWith(params.walletID, txhash, description)
    })
    it('normal without description', async () => {
      const txhash = 'txhash'
      fromObjectMock.mockReturnValueOnce({})
      sendTxMock.mockResolvedValueOnce(txhash)
      const res = await anyoneCanPayController.sendTx(params)
      expect(res.result).toEqual(txhash)
    })
  })

  it('getScript', () => {
    const res = anyoneCanPayController.getScript()
    expect(res.result).toEqual(new AssetAccountInfo().infos.anyoneCanPay)
  })

  it('generateSudtMigrateAcpTx', async () => {
    await anyoneCanPayController.generateSudtMigrateAcpTx({ outPoint: { txHash: 'txHash', index: '1' } })
    expect(generateSudtMigrateAcpTxMock).toHaveBeenCalled()
  })

  describe('getHoldSudtCellExtraCkb', () => {
    it('correct address', async () => {
      const address =
        'ckt1qq6pngwqn6e9vlm92th84rk0l4jp2h8lurchjmnwv8kq3rt5psf4vqvyxgyfu4z8yq4t790um8jef7lpm40h2csv4cv7m'
      await anyoneCanPayController.getHoldSudtCellCapacity(address, 'tokenID')
      const script = helpers.parseAddress(address, {config: config.predefined.AGGRON4})
      expect(getHoldSUDTCellCapacityMock).toHaveBeenCalledWith(script, 'tokenID')
    })
    it('error address', async () => {
      const address = 'ct1qq6pngwqn6e9vlm92th84rk0l4jp2h8lurchjmnwv8kq3rt5psf4vqvyxgyfu4z8yq4t790um8jef7lpm40h2csv4cv7m'
      await expect(anyoneCanPayController.getHoldSudtCellCapacity(address, 'tokenID')).rejects.toThrow(
        new Error('Address format error')
      )
    })
  })
})
