import { ResponseCode } from '../../src/utils/const'
import MultiSignService from '../../src/services/multi-sign'
import MultiSignController from '../../src/controllers/multi-sign'

let response = 0
let dialogRes = { canceled: false, filePaths: ['./'], filePath: './' }
jest.mock('electron', () => ({
  dialog: {
    showMessageBox: jest.fn().mockImplementation(() => ({ response })),
    showOpenDialog: jest.fn().mockImplementation(() => dialogRes),
    showSaveDialog: jest.fn().mockImplementation(() => dialogRes),
  },
  BrowserWindow: {
    getFocusedWindow: jest.fn()
  }
}))

jest.mock('../../src/services/multi-sign')
const MultiSignServiceMock = MultiSignService as jest.MockedClass<typeof MultiSignService>

let fileContent: {
  r?: number
  m?: number
  n?: number
  addresses?: string[]
} = {
  r: 1,
  m: 2,
  n: 3,
  addresses: ['ckt1qyqvmm64mjmcwftjx6a73kxr8z23ks5sef5sv2702w', 'ckt1qyqrgqluh0v7yrarreezawvcrv3q8t28tyzqveg4zl']
}

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

const multisignConfig = {
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

describe('test for multisign controller', () => {
  const multiSignController = new MultiSignController()
  afterEach(() => {
    response = 0
    dialogRes = { canceled: false, filePaths: ['./'], filePath: './' }
  })

  describe('test createMultiSignAddress', () => {
    it('test net', () => {
      const multisignAddress = multiSignController.createMultiSignAddress(multisignConfig.testnet.params)
      expect(multisignAddress.result).toEqual(multisignConfig.testnet.result)
    })
    it('main net', () => {
      const multisignAddress = multiSignController.createMultiSignAddress(multisignConfig.mainnet.params)
      expect(multisignAddress.result).toEqual(multisignConfig.mainnet.result)
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
    await multiSignController.saveConfig(params)
    expect(MultiSignServiceMock.prototype.saveMultiSignConfig).toHaveBeenCalledWith(params)
  })

  it('test update config', async () => {
    const params = {
      id: 1,
      alias: '2'
    }
    await multiSignController.updateConfig(params)
    expect(MultiSignServiceMock.prototype.updateMultiSignConfig).toHaveBeenCalledWith(params)
  })

  describe('test delete config', () => {
    it('cancel delete config', async () => {
      response = 1
      const result = await multiSignController.deleteConfig({ id: 10 })
      expect(MultiSignServiceMock.prototype.deleteConfig).not.toHaveBeenCalled()
      expect(result.status).toBe(ResponseCode.Fail)
    })
    it('confirm delete config', async () => {
      const result = await multiSignController.deleteConfig({ id: 10 })
      expect(MultiSignServiceMock.prototype.deleteConfig).toHaveBeenCalled()
      expect(result.status).toBe(ResponseCode.Success)
    })
  })

  it('get config', async () => {
    const params = { walletId: 'abcd' }
    await multiSignController.getConfig(params)
    expect(MultiSignServiceMock.prototype.getMultiSignConfig).toHaveBeenCalledWith(params.walletId)
  })

  describe('import config', () => {
    it('cancel import', async () => {
      dialogRes = { canceled: true, filePaths: [], filePath: './' }
      const res = await multiSignController.importConfig({ isMainnet: false })
      expect(res).toBeUndefined()
    })
    it('import data is error', async () => {
      fileContent = {
        ...multisignConfig.testnet.params,
        r: undefined
      }
      expect(multiSignController.importConfig({ isMainnet: false })).rejects.toThrow()
    })
    it('import success', async () => {
      fileContent = multisignConfig.testnet.params
      const res = await multiSignController.importConfig({ isMainnet: false })
      expect(res?.result?.fullPayload).toBe(multisignConfig.testnet.result)
    })
  })

  describe('export config', () => {
    it('cancel export', async () => {
      dialogRes = { canceled: true, filePaths: [], filePath: './' }
      const res = await multiSignController.exportConfig([])
      expect(res).toBeUndefined()
    })
    it('export success', async () => {
      const res = await multiSignController.exportConfig([])
      expect(res?.status).toBe(ResponseCode.Success)
    })
  })
})