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
    writeFileSync: () => jest.fn(),
    existsSync: () => jest.fn()
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

const isMainnetMock = jest.fn().mockReturnValue(false)

jest.mock('../../src/services/networks', () => ({
  getInstance: () => ({
    isMainnet: isMainnetMock
  })
}))

const loadTransactionJSONMock = jest.fn()
jest.mock('../../src/services/offline-sign', () => ({
  loadTransactionJSON: () => loadTransactionJSONMock()
}))

const multisigConfig = {
  testnet: {
    params: {
      r: 1,
      m: 2,
      n: 3,
      blake160s: [
        '0xcdef55dcb787257236bbe8d8c338951b4290ca69',
        '0x3403fcbbd9e20fa31e722eb9981b2203ad475904',
        '0xc75e25d1a08c03617fd7211607a0a7479ad2ec31'
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
      blake160s: [
        '0xcdef55dcb787257236bbe8d8c338951b4290ca69',
        '0x3403fcbbd9e20fa31e722eb9981b2203ad475904',
        '0xc75e25d1a08c03617fd7211607a0a7479ad2ec31'
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

  it('test save config', async () => {
    const params = {
      walletId: 'string',
      r: 1,
      m: 1,
      n: 1,
      blake160s: [],
      alias: 'string',
      changed: expect.any(Function)
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
      const result = await multisigController.deleteConfig(10)
      expect(MultiSigServiceMock.prototype.deleteConfig).not.toHaveBeenCalled()
      expect(result.result).toBeFalsy()
    })
    it('confirm delete config', async () => {
      const result = await multisigController.deleteConfig(10)
      expect(MultiSigServiceMock.prototype.deleteConfig).toHaveBeenCalled()
      expect(result.result).toBeTruthy()
    })
  })

  it('get config', async () => {
    await multisigController.getConfig('abcd')
    expect(MultiSigServiceMock.prototype.getMultisigConfig).toHaveBeenCalledWith('abcd')
  })

  describe('import config', () => {
    it('cancel import', async () => {
      dialogRes = { canceled: true, filePaths: [], filePath: './' }
      const res = await multisigController.importConfig('1234')
      expect(res).toBeUndefined()
    })
    it('import data is error', async () => {
      fileContent = [{
        ...multisigConfig.testnet.params,
        r: undefined
      }]
      const res = await multisigController.importConfig('1234')
      expect(res).toBeUndefined()
    })
    it('import object success', async () => {
      fileContent = multisigConfig.testnet.params
      MultiSigServiceMock.prototype.saveMultisigConfig.mockResolvedValueOnce({
        ...multisigConfig.testnet.params,
        id: 1,
        walletId: '1234',
        alias: ''
      } as any)
      const res = await multisigController.importConfig('1234')
      expect(res?.result[0].blake160s).toBe(multisigConfig.testnet.params.blake160s)
    })
    it('import success', async () => {
      fileContent = multisigConfig.testnet.params
      MultiSigServiceMock.prototype.saveMultisigConfig.mockResolvedValueOnce({
        ...multisigConfig.testnet.params,
        id: 1,
        walletId: '1234',
        alias: '',
      } as any)
      const res = await multisigController.importConfig('1234')
      expect(res?.result[0].blake160s).toBe(multisigConfig.testnet.params.blake160s)
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
  
  describe('loadMultisigTxJson', () => {
    const fullPayload = 'ckt1qpw9q60tppt7l3j7r09qcp7lxnp3vcanvgha8pmvsa3jplykxn32sq2yu88cl4mwf0jc05q38gu237qd753c4jcan9jch'
    const lockHash = '0xd121829f9c355496ab54c8b570dd7b0d0f4958dcba6967c241a0ca49a55a8e38'
    it('load failed', async () => {
      loadTransactionJSONMock.mockResolvedValueOnce(undefined)
      const res = await multisigController.loadMultisigTxJson('fullpayload')
      expect(res.status).toBe(ResponseCode.Fail)
    })

    it('fullpayload not matched', async () => {
      loadTransactionJSONMock.mockResolvedValueOnce({
        json: {
            transaction: {
            inputs: [
              { lockHash }
            ]
          }
        }
      })
      const res = await multisigController.loadMultisigTxJson('ckt1qpw9q60tppt7l3j7r09qcp7lxnp3vcanvgha8pmvsa3jplykxn32sqdr04fsz70xn6kl7c54cj0ap93qlvf0cacdhulch')
      expect(res.status).toBe(ResponseCode.Fail)
    })

    it('fullpayload matched', async () => {
      loadTransactionJSONMock.mockResolvedValueOnce({
        json: {
          transaction: {
            inputs: [
              { lockHash }
            ]
          }
        }
      })
      const res = await multisigController.loadMultisigTxJson(fullPayload)
      expect(res.status).toBe(ResponseCode.Success)
    })
  })
})