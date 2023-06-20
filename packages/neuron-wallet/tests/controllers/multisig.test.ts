import { ResponseCode } from '../../src/utils/const'
import MultisigService from '../../src/services/multisig'
import MultisigController from '../../src/controllers/multisig'
import CellsService from '../../src/services/cells'
import { config, helpers } from '@ckb-lumos/lumos'

let response = 0
let dialogRes = { canceled: false, filePaths: ['./'], filePath: './' }
const showErrorBoxMock = jest.fn()
jest.mock('electron', () => ({
  dialog: {
    showMessageBox: jest.fn().mockImplementation(() => ({ response })),
    showOpenDialog: jest.fn().mockImplementation(() => dialogRes),
    showSaveDialog: jest.fn().mockImplementation(() => dialogRes),
    showErrorBox: () => showErrorBoxMock(),
  },
  BrowserWindow: {
    getFocusedWindow: jest.fn(),
  },
}))
jest.mock('services/wallets', () => ({
  getInstance() {
    return {
      getCurrent() {
        return jest.fn()
      },
    }
  },
}))

jest.mock('../../src/services/multisig')
const MultiSigServiceMock = MultisigService as jest.MockedClass<typeof MultisigService>

const readFileSyncMock = jest.fn()
jest.mock('fs', () => {
  return {
    readFileSync: () => readFileSyncMock(),
    writeFileSync: () => jest.fn(),
    existsSync: () => jest.fn(),
  }
})

jest.mock('../../src/utils/logger', () => ({
  error: console.error,
  transports: {
    file: {
      getFile: jest.fn(),
    },
  },
}))

jest.mock('../../src/services/cells', () => ({
  getMultisigBalances: jest.fn(),
}))

const isMainnetMock = jest.fn().mockReturnValue(false)

jest.mock('../../src/services/networks', () => ({
  getInstance: () => ({
    isMainnet: () => isMainnetMock(),
  }),
}))

const loadTransactionJSONMock = jest.fn()
jest.mock('../../src/services/offline-sign', () => ({
  loadTransactionJSON: () => loadTransactionJSONMock(),
}))

const multisigArgs = '0x40518821915b81de0614d8c45dbef77151a22ad1'
const multisigBlake160s = [
  '0xcdef55dcb787257236bbe8d8c338951b4290ca69',
  '0x3403fcbbd9e20fa31e722eb9981b2203ad475904',
  '0xc75e25d1a08c03617fd7211607a0a7479ad2ec31',
]
const multisigConfig = {
  testnet: {
    params: {
      multisig_configs: {
        sighash_addresses: multisigBlake160s.map(args =>
          helpers.encodeToAddress(
            {
              args,
              codeHash: config.predefined.AGGRON4.SCRIPTS.SECP256K1_BLAKE160.CODE_HASH,
              hashType: config.predefined.AGGRON4.SCRIPTS.SECP256K1_BLAKE160.HASH_TYPE,
            },
            { config: config.predefined.AGGRON4 }
          )
        ),
        require_first_n: 1,
        threshold: 2,
      },
      isMainnet: false,
    },
    result: 'ckt1qpw9q60tppt7l3j7r09qcp7lxnp3vcanvgha8pmvsa3jplykxn32sq2q2xyzry2ms80qv9xcc3wmaam32x3z45gut5d40',
  },
  mainnet: {
    params: {
      multisig_configs: {
        sighash_addresses: multisigBlake160s.map(args =>
          helpers.encodeToAddress(
            {
              args,
              codeHash: config.predefined.LINA.SCRIPTS.SECP256K1_BLAKE160.CODE_HASH,
              hashType: config.predefined.LINA.SCRIPTS.SECP256K1_BLAKE160.HASH_TYPE,
            },
            { config: config.predefined.LINA }
          )
        ),
        require_first_n: 1,
        threshold: 2,
      },
      isMainnet: true,
    },
    result: 'ckb1qpw9q60tppt7l3j7r09qcp7lxnp3vcanvgha8pmvsa3jplykxn32sq2q2xyzry2ms80qv9xcc3wmaam32x3z45gjelzlh',
  },
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
      changed: expect.any(Function),
    }
    await multisigController.saveConfig(params)
    expect(MultiSigServiceMock.prototype.saveMultisigConfig).toHaveBeenCalledWith(params)
  })

  it('test update config', async () => {
    const params = {
      id: 1,
      alias: '2',
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
    beforeEach(() => {
      readFileSyncMock.mockReset()
    })
    it('cancel import', async () => {
      dialogRes = { canceled: true, filePaths: [], filePath: './' }
      const res = await multisigController.importConfig('1234')
      expect(res).toBeUndefined()
    })
    it('no multisig_configs', async () => {
      readFileSyncMock.mockReturnValue(JSON.stringify({}))
      await multisigController.importConfig('1234')
      expect(showErrorBoxMock).toHaveBeenCalledWith()
    }),
      it('multisig_configs is empty', async () => {
        readFileSyncMock.mockReturnValue(JSON.stringify({ multisig_configs: {} }))
        await multisigController.importConfig('1234')
        expect(showErrorBoxMock).toHaveBeenCalledWith()
      }),
      it('import data is error no require_first_n', async () => {
        readFileSyncMock.mockReturnValue(
          JSON.stringify({
            multisig_configs: {
              [multisigArgs]: {
                ...multisigConfig.testnet.params.multisig_configs,
                require_first_n: undefined,
              },
            },
          })
        )
        const res = await multisigController.importConfig('1234')
        expect(res).toBeUndefined()
        expect(showErrorBoxMock).toHaveBeenCalledWith()
      })
    it('import data is error no threshold', async () => {
      readFileSyncMock.mockReturnValue(
        JSON.stringify({
          multisig_configs: {
            [multisigArgs]: {
              ...multisigConfig.testnet.params.multisig_configs,
              threshold: undefined,
            },
          },
        })
      )
      const res = await multisigController.importConfig('1234')
      expect(res).toBeUndefined()
      expect(showErrorBoxMock).toHaveBeenCalledWith()
    })
    it('import data is error require_first_n is not number', async () => {
      readFileSyncMock.mockReturnValue(
        JSON.stringify({
          multisig_configs: {
            [multisigArgs]: {
              ...multisigConfig.testnet.params.multisig_configs,
              require_first_n: 'dd',
            },
          },
        })
      )
      const res = await multisigController.importConfig('1234')
      expect(res).toBeUndefined()
      expect(showErrorBoxMock).toHaveBeenCalledWith()
    })
    it('import data is error threshold is not number', async () => {
      readFileSyncMock.mockReturnValue(
        JSON.stringify({
          multisig_configs: {
            [multisigArgs]: {
              ...multisigConfig.testnet.params.multisig_configs,
              threshold: 'undefined',
            },
          },
        })
      )
      const res = await multisigController.importConfig('1234')
      expect(res).toBeUndefined()
      expect(showErrorBoxMock).toHaveBeenCalledWith()
    })
    it('import data is invalidation r > n', async () => {
      readFileSyncMock.mockReturnValue(
        JSON.stringify({
          multisig_configs: {
            [multisigArgs]: {
              ...multisigConfig.testnet.params.multisig_configs,
              require_first_n: 4,
            },
          },
        })
      )
      const res = await multisigController.importConfig('1234')
      expect(res).toBeUndefined()
      expect(showErrorBoxMock).toHaveBeenCalledWith()
    })
    it('import data is invalidation m > n', async () => {
      readFileSyncMock.mockReturnValue(
        JSON.stringify({
          multisig_configs: {
            [multisigArgs]: {
              ...multisigConfig.testnet.params.multisig_configs,
              threshold: 4,
            },
          },
        })
      )
      const res = await multisigController.importConfig('1234')
      expect(res).toBeUndefined()
      expect(showErrorBoxMock).toHaveBeenCalledWith()
    })
    it('import data is invalidation blake160s empty', async () => {
      readFileSyncMock.mockReturnValue(
        JSON.stringify({
          multisig_configs: {
            [multisigArgs]: {
              ...multisigConfig.testnet.params.multisig_configs,
              sighash_addresses: [],
            },
          },
        })
      )
      const res = await multisigController.importConfig('1234')
      expect(res).toBeUndefined()
      expect(showErrorBoxMock).toHaveBeenCalledWith()
    })
    it('import data is invalidation blake160 length not 42', async () => {
      readFileSyncMock.mockReturnValue(
        JSON.stringify({
          multisig_configs: {
            [multisigArgs]: {
              ...multisigConfig.testnet.params.multisig_configs,
              sighash_addresses: [multisigConfig.testnet.params.multisig_configs.sighash_addresses[0]],
            },
          },
        })
      )
      const res = await multisigController.importConfig('1234')
      expect(res).toBeUndefined()
      expect(showErrorBoxMock).toHaveBeenCalledWith()
    })
    it('import object success', async () => {
      readFileSyncMock.mockReturnValue(
        JSON.stringify({
          multisig_configs: {
            [multisigArgs]: multisigConfig.testnet.params.multisig_configs,
          },
        })
      )
      MultiSigServiceMock.prototype.saveMultisigConfig.mockResolvedValueOnce({
        blake160s: multisigBlake160s,
        id: 1,
        walletId: '1234',
        alias: '',
      } as any)
      const res = await multisigController.importConfig('1234')
      expect(res?.result[0].blake160s).toBe(multisigBlake160s)
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
    const fullPayload =
      'ckt1qpw9q60tppt7l3j7r09qcp7lxnp3vcanvgha8pmvsa3jplykxn32sq2yu88cl4mwf0jc05q38gu237qd753c4jcan9jch'
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
            inputs: [{ lockHash }],
          },
        },
      })
      const res = await multisigController.loadMultisigTxJson(
        'ckt1qpw9q60tppt7l3j7r09qcp7lxnp3vcanvgha8pmvsa3jplykxn32sqdr04fsz70xn6kl7c54cj0ap93qlvf0cacdhulch'
      )
      expect(res.status).toBe(ResponseCode.Fail)
    })

    it('fullpayload matched', async () => {
      loadTransactionJSONMock.mockResolvedValueOnce({
        json: {
          transaction: {
            inputs: [{ lockHash }],
          },
        },
      })
      const res = await multisigController.loadMultisigTxJson(fullPayload)
      expect(res.status).toBe(ResponseCode.Success)
    })
  })
})
