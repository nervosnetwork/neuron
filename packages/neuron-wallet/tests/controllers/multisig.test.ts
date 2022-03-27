import { ResponseCode } from '../../src/utils/const'
import MultisigService from '../../src/services/multisig'
import MultisigController from '../../src/controllers/multisig'
import CellsService from '../../src/services/cells'

let response = 0
let dialogRes = { canceled: false, filePaths: ['./'], filePath: './' }
jest.mock('electron', () => ({
  dialog: {
    showMessageBox: jest.fn().mockImplementation(() => ({ response })),
    showOpenDialog: jest.fn().mockImplementation(() => dialogRes),
    showSaveDialog: jest.fn().mockImplementation(() => dialogRes),
    showErrorBox: jest.fn()
  },
  BrowserWindow: {
    getFocusedWindow: jest.fn()
  }
}))

jest.mock('../../src/services/multisig')
const MultiSigServiceMock = MultisigService as jest.MockedClass<typeof MultisigService>

let fileContent: {
  r?: number
  m?: number
  n?: number
  addresses?: string[]
} | {
  r?: number
  m?: number
  n?: number
  addresses?: string[]
}[] = [{
  r: 1,
  m: 2,
  n: 3,
  addresses: ['ckt1qyqvmm64mjmcwftjx6a73kxr8z23ks5sef5sv2702w', 'ckt1qyqrgqluh0v7yrarreezawvcrv3q8t28tyzqveg4zl']
}]

jest.mock('fs', () => {
  return {
    readFileSync: () => JSON.stringify(fileContent),
    writeFileSync: () => jest.fn()
  }
})

jest.mock('../../src/utils/logger', () => ({
  error: console.error,
  transports: {
    file: {
      getFile: jest.fn()
    }
  }
}))

jest.mock('../../src/services/cells', () => ({
  getMultisigBalances: jest.fn(),
}))

const multisigConfig = {
  testnet: {
    params: {
      r: 1,
      m: 2,
      n: 3,
      addresses: [
        'ckt1qyqvmm64mjmcwftjx6a73kxr8z23ks5sef5sv2702w',
        'ckt1qyqrgqluh0v7yrarreezawvcrv3q8t28tyzqveg4zl',
        'ckt1qyqvwh396xsgcqmp0ltjz9s85zn50xkjascsz88vrw'
      ],
      isMainnet: false
    },
    result: 'ckt1qpw9q60tppt7l3j7r09qcp7lxnp3vcanvgha8pmvsa3jplykxn32sq2q2xyzry2ms80qv9xcc3wmaam32x3z45gut5d40'
  },
  mainnet: {
    params: {
      r: 1,
      m: 2,
      n: 3,
      addresses: [
        'ckt1qyqvmm64mjmcwftjx6a73kxr8z23ks5sef5sv2702w',
        'ckt1qyqrgqluh0v7yrarreezawvcrv3q8t28tyzqveg4zl',
        'ckt1qyqvwh396xsgcqmp0ltjz9s85zn50xkjascsz88vrw'
      ],
      isMainnet: true
    },
    result: 'ckb1qpw9q60tppt7l3j7r09qcp7lxnp3vcanvgha8pmvsa3jplykxn32sq2q2xyzry2ms80qv9xcc3wmaam32x3z45gjelzlh'
  }
}

describe('test for multisig controller', () => {
  const multisigController = new MultisigController()
  afterEach(() => {
    response = 0
    dialogRes = { canceled: false, filePaths: ['./'], filePath: './' }
  })

  describe('test createMultisigAddress', () => {
    it('test net', () => {
      const multisigAddress = multisigController.createMultisigAddress(multisigConfig.testnet.params)
      expect(multisigAddress.result).toEqual(multisigConfig.testnet.result)
    })
    it('main net', () => {
      const multisigAddress = multisigController.createMultisigAddress(multisigConfig.mainnet.params)
      expect(multisigAddress.result).toEqual(multisigConfig.mainnet.result)
    })
  })

  it('test save config', async () => {
    const params = {
      walletId: 'string',
      r: 1,
      m: 1,
      n: 1,
      addresses: [],
      alias: 'string',
      fullPayload: 'string'
    }
    await multisigController.saveConfig(params)
    expect(MultiSigServiceMock.prototype.saveMultisigConfig).toHaveBeenCalledWith(params)
  })

  it('test update config', async () => {
    const params = {
      id: 1,
      alias: '2'
    }
    await multisigController.updateConfig(params)
    expect(MultiSigServiceMock.prototype.updateMultisigConfig).toHaveBeenCalledWith(params)
  })

  describe('test delete config', () => {
    it('cancel delete config', async () => {
      response = 1
      const result = await multisigController.deleteConfig({ id: 10 })
      expect(MultiSigServiceMock.prototype.deleteConfig).not.toHaveBeenCalled()
      expect(result.status).toBe(ResponseCode.Fail)
    })
    it('confirm delete config', async () => {
      const result = await multisigController.deleteConfig({ id: 10 })
      expect(MultiSigServiceMock.prototype.deleteConfig).toHaveBeenCalled()
      expect(result.status).toBe(ResponseCode.Success)
    })
  })

  it('get config', async () => {
    const params = { walletId: 'abcd' }
    await multisigController.getConfig(params)
    expect(MultiSigServiceMock.prototype.getMultisigConfig).toHaveBeenCalledWith(params.walletId)
  })

  describe('import config', () => {
    it('cancel import', async () => {
      dialogRes = { canceled: true, filePaths: [], filePath: './' }
      const res = await multisigController.importConfig({ isMainnet: false, walletId: '1234'})
      expect(res).toBeUndefined()
    })
    it('import data is error', async () => {
      fileContent = [{
        ...multisigConfig.testnet.params,
        r: undefined
      }]
      const res = await multisigController.importConfig({ isMainnet: false, walletId: '1234'})
      expect(res).toBeUndefined()
    })
    it('import object success', async () => {
      fileContent = multisigConfig.testnet.params
      MultiSigServiceMock.prototype.saveMultisigConfig.mockResolvedValueOnce({
        ...multisigConfig.testnet.params,
        id: 1,
        walletId: '1234',
        alias: '',
        fullPayload: multisigConfig.testnet.result
      })
      const res = await multisigController.importConfig({ isMainnet: false, walletId: '1234'})
      expect(res?.result[0].fullPayload).toBe(multisigConfig.testnet.result)
    })
    it('import success', async () => {
      fileContent = multisigConfig.testnet.params
      MultiSigServiceMock.prototype.saveMultisigConfig.mockResolvedValueOnce({
        ...multisigConfig.testnet.params,
        id: 1,
        walletId: '1234',
        alias: '',
        fullPayload: multisigConfig.testnet.result
      })
      const res = await multisigController.importConfig({ isMainnet: false, walletId: '1234'})
      expect(res?.result[0].fullPayload).toBe(multisigConfig.testnet.result)
    })
  })

  describe('export config', () => {
    it('cancel export', async () => {
      dialogRes = { canceled: true, filePaths: [], filePath: './' }
      const res = await multisigController.exportConfig([])
      expect(res).toBeUndefined()
    })
    it('export success', async () => {
      const res = await multisigController.exportConfig([])
      expect(res?.status).toBe(ResponseCode.Success)
    })
  })

  it('getMultisigBalances', async () => {
    const res = await multisigController.getMultisigBalances({ isMainnet: false, multisigAddresses: [] })
    expect(CellsService.getMultisigBalances).toHaveBeenCalled()
    expect(res.status).toBe(ResponseCode.Success)
  })
  
})