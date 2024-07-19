import AnyoneCanPayService from '../../src/services/anyone-can-pay'
import AssetAccountEntity from '../../src/database/chain/entities/asset-account'
import AssetAccount from '../../src/models/asset-account'
import { initConnection, closeConnection, getConnection } from '../setupAndTeardown'
import { AcpSendSameAccountError, TargetLockError, TargetOutputNotFoundError } from '../../src/exceptions'
import AssetAccountInfo from '../../src/models/asset-account-info'
import SystemScriptInfo from '../../src/models/system-script-info'
import { MIN_SUDT_CAPACITY, UDTType } from '../../src/utils/const'

const addressParseMock = jest.fn()
jest.mock('../../src/models/address-parser', () => ({
  parse(address: string) {
    return addressParseMock(address)
  },
}))

const getOneByLockScriptAndTypeScriptMock = jest.fn()
jest.mock('../../src/services/live-cell-service', () => ({
  getInstance() {
    return {
      getOneByLockScriptAndTypeScript: getOneByLockScriptAndTypeScriptMock,
    }
  },
}))

const getNextChangeAddressMock = jest.fn()
jest.mock('../../src/services/wallets', () => ({
  getInstance() {
    return {
      get: () => ({
        getNextChangeAddress: getNextChangeAddressMock,
      }),
    }
  },
}))

const generateAnyoneCanPayToCKBTxMock = jest.fn()
const generateAnyoneCanPayToSudtTxMock = jest.fn()
const generateSudtMigrateAcpTxMock = jest.fn()
jest.mock('../../src/services/tx', () => ({
  TransactionGenerator: {
    // @ts-ignore
    generateAnyoneCanPayToCKBTx: (...args) => generateAnyoneCanPayToCKBTxMock(...args),
    // @ts-ignore
    generateAnyoneCanPayToSudtTx: (...args) => generateAnyoneCanPayToSudtTxMock(...args),
    // @ts-ignore
    generateSudtMigrateAcpTx: (...args) => generateSudtMigrateAcpTxMock(...args),
  },
}))

const fromObjectMock = jest.fn()
jest.mock('../../src/models/chain/output', () => ({
  fromObject: (obj: any) => fromObjectMock(obj),
}))

const getLiveCellMock = jest.fn()
jest.mock('../../src/services/cells', () => ({
  getLiveCell: () => getLiveCellMock(),
}))

function mockReset() {
  addressParseMock.mockReset()
  getOneByLockScriptAndTypeScriptMock.mockReset()
  getNextChangeAddressMock.mockReset()
  generateAnyoneCanPayToCKBTxMock.mockReset()
  generateAnyoneCanPayToSudtTxMock.mockReset()
  generateSudtMigrateAcpTxMock.mockReset()
  fromObjectMock.mockReset()
  getLiveCellMock.mockReset()
}

describe('anyone-can-pay-service', () => {
  const assetAccount = AssetAccountEntity.fromModel(
    new AssetAccount(
      'tokenId',
      'symbol',
      'accountName',
      'tokenName',
      '8',
      '0',
      '0x62260b4dd406bee8a021185edaa60b7a77f7e99a',
      undefined,
      UDTType.SUDT
    )
  )
  const ckbAssetAccount = AssetAccountEntity.fromModel(
    new AssetAccount(
      'CKBytes',
      'symbol',
      'accountName',
      'tokenName',
      '8',
      '0',
      '0xb2b8101595fe0ddeb9f4e1acead6107119497fe6'
    )
  )
  let assetAccountEntity: AssetAccountEntity
  let ckbAssetAccountEntity: AssetAccountEntity
  // let sudtTokenInfoEntity
  beforeAll(async () => {
    await initConnection()
    assetAccountEntity = (
      await getConnection().manager.save([assetAccount.sudtTokenInfo, assetAccount])
    )[1] as AssetAccountEntity
    ckbAssetAccountEntity = (
      await getConnection().manager.save([ckbAssetAccount.sudtTokenInfo, ckbAssetAccount])
    )[1] as AssetAccountEntity
  })

  afterAll(() => {
    return closeConnection()
  })

  afterEach(() => {
    mockReset()
  })

  describe('generateAnyoneCanPayTx', () => {
    it('exception no asset account', async () => {
      await expect(
        AnyoneCanPayService.generateAnyoneCanPayTx('walletId', 'targetAddress', 'capacityOrAmount', 1000)
      ).rejects.toThrow(new Error('Asset Account not found!'))
    })
    it('exception AcpSendSameAccountError', async () => {
      addressParseMock.mockReturnValueOnce({ args: assetAccount.blake160 })
      await expect(
        AnyoneCanPayService.generateAnyoneCanPayTx(
          'walletId',
          'targetAddress',
          'capacityOrAmount',
          assetAccountEntity.id
        )
      ).rejects.toThrow(new AcpSendSameAccountError())
    })
    it('exception with TargetOutputNotFoundError', async () => {
      getOneByLockScriptAndTypeScriptMock.mockResolvedValueOnce(undefined)
      const anyonePayScript = new AssetAccountInfo().generateAnyoneCanPayScript(assetAccount.blake160)
      addressParseMock.mockReturnValueOnce(anyonePayScript)
      await expect(
        AnyoneCanPayService.generateAnyoneCanPayTx(
          'walletId',
          'anyoneCanPayAddress',
          'capacityOrAmount',
          ckbAssetAccountEntity.id
        )
      ).rejects.toThrow(new TargetOutputNotFoundError())
    })
    it('exception with TargetLockError', async () => {
      getOneByLockScriptAndTypeScriptMock.mockResolvedValueOnce(undefined)
      const anyonePayScript = new AssetAccountInfo().generateChequeScript(assetAccount.blake160, assetAccount.blake160)
      addressParseMock.mockReturnValueOnce(anyonePayScript)
      await expect(
        AnyoneCanPayService.generateAnyoneCanPayTx(
          'walletId',
          'anyoneCanPayAddress',
          'capacityOrAmount',
          ckbAssetAccountEntity.id
        )
      ).rejects.toThrow(new TargetLockError())
    })
    it('isSecpScript with ckb', async () => {
      const targetLockScript = SystemScriptInfo.generateSecpScript(assetAccount.blake160)
      const changeBlake160 = 'changeBlake160'
      getNextChangeAddressMock.mockResolvedValueOnce({ blake160: changeBlake160 })
      addressParseMock.mockReturnValueOnce(targetLockScript)
      getOneByLockScriptAndTypeScriptMock.mockResolvedValueOnce(null)
      generateAnyoneCanPayToCKBTxMock.mockReturnValueOnce({})
      const output = {}
      fromObjectMock.mockReturnValueOnce(output)
      await AnyoneCanPayService.generateAnyoneCanPayTx(
        'walletId',
        'targetAddress',
        'capacityOrAmount',
        ckbAssetAccountEntity.id
      )
      expect(fromObjectMock).toHaveBeenCalledWith({
        capacity: '0',
        lock: targetLockScript,
        type: null,
      })
      expect(generateAnyoneCanPayToCKBTxMock).toHaveBeenCalledWith(
        'walletId',
        [new AssetAccountInfo().generateAnyoneCanPayScript(ckbAssetAccount.blake160)],
        output,
        'capacityOrAmount',
        changeBlake160,
        '0',
        '0'
      )
    })
    it('isSecpScript with sudt', async () => {
      const targetLockScript = SystemScriptInfo.generateSecpScript(ckbAssetAccount.blake160)
      const changeBlake160 = 'changeBlake160'
      getNextChangeAddressMock.mockResolvedValueOnce({ blake160: changeBlake160 })
      addressParseMock.mockReturnValueOnce(targetLockScript)
      getOneByLockScriptAndTypeScriptMock.mockResolvedValueOnce(null)
      generateAnyoneCanPayToSudtTxMock.mockReturnValueOnce({})
      const output = {}
      fromObjectMock.mockReturnValueOnce(output)
      await AnyoneCanPayService.generateAnyoneCanPayTx(
        'walletId',
        'targetAddress',
        'capacityOrAmount',
        assetAccountEntity.id
      )
      expect(fromObjectMock).toHaveBeenCalledWith({
        lock: targetLockScript,
        type: new AssetAccountInfo().generateSudtScript(assetAccount.tokenID),
        data: '0x00000000000000000000000000000000',
      })
      expect(generateAnyoneCanPayToSudtTxMock).toHaveBeenCalledWith(
        'walletId',
        [new AssetAccountInfo().generateAnyoneCanPayScript(assetAccount.blake160)],
        output,
        'capacityOrAmount',
        changeBlake160,
        '0',
        '0'
      )
    })
  })

  describe('generateSudtMigrateAcpTx', () => {
    it('exception', async () => {
      getLiveCellMock.mockResolvedValueOnce(undefined)
      await expect(AnyoneCanPayService.generateSudtMigrateAcpTx({ txHash: '', index: '0' })).rejects.toThrow(
        new Error('sudt live cell not found')
      )
    })
    it('normal', async () => {
      const cell = {}
      getLiveCellMock.mockResolvedValueOnce(cell)
      await AnyoneCanPayService.generateSudtMigrateAcpTx({ txHash: '', index: '0' })
      expect(generateSudtMigrateAcpTxMock).toHaveBeenLastCalledWith(cell, undefined)
    })
  })

  describe('getCKBTargetOutput', () => {
    it('send to secp256', async () => {
      //@ts-ignore
      await AnyoneCanPayService.getCKBTargetOutput(SystemScriptInfo.generateSecpScript(assetAccount.blake160))
      expect(fromObjectMock).toHaveBeenCalledWith({
        capacity: '0',
        lock: SystemScriptInfo.generateSecpScript(assetAccount.blake160),
        type: null,
      })
    })
    it('send to anyone pay address not exist', async () => {
      getOneByLockScriptAndTypeScriptMock.mockResolvedValue(undefined)
      await expect(
        //@ts-ignore
        AnyoneCanPayService.getCKBTargetOutput(new AssetAccountInfo().generateAnyoneCanPayScript(assetAccount.blake160))
      ).rejects.toThrow(new TargetOutputNotFoundError())
    })
    it('send to anyone pay address exist', async () => {
      const targetLiveCell = {
        capacity: '1000',
        lock() {
          return {}
        },
        type() {
          return {}
        },
        data: '0x00',
        outPoint() {
          return {}
        },
      }
      getOneByLockScriptAndTypeScriptMock.mockResolvedValue(targetLiveCell)
      //@ts-ignore
      await AnyoneCanPayService.getCKBTargetOutput(
        new AssetAccountInfo().generateAnyoneCanPayScript(assetAccount.blake160)
      )
      expect(fromObjectMock).toHaveBeenCalledWith({
        capacity: targetLiveCell.capacity,
        lock: targetLiveCell.lock(),
        type: targetLiveCell.type(),
        data: targetLiveCell.data,
        outPoint: targetLiveCell.outPoint(),
      })
    })
    it('send to unknow address', async () => {
      await expect(
        //@ts-ignore private-method
        AnyoneCanPayService.getCKBTargetOutput(
          new AssetAccountInfo().generateChequeScript(assetAccount.blake160, assetAccount.blake160)
        )
      ).rejects.toThrow(new TargetLockError())
    })
  })

  describe('getSUDTTargetOutput', () => {
    it('send to secp256', async () => {
      //@ts-ignore
      await AnyoneCanPayService.getSUDTTargetOutput(
        SystemScriptInfo.generateSecpScript(assetAccount.blake160),
        'tokenID',
        UDTType.SUDT
      )
      expect(fromObjectMock).toHaveBeenCalledWith({
        lock: SystemScriptInfo.generateSecpScript(assetAccount.blake160),
        type: new AssetAccountInfo().generateSudtScript('tokenID'),
        data: '0x00000000000000000000000000000000',
      })
    })
    it('send to anyone pay address not exist', async () => {
      getOneByLockScriptAndTypeScriptMock.mockResolvedValue(undefined)
      //@ts-ignore
      await AnyoneCanPayService.getSUDTTargetOutput(
        new AssetAccountInfo().generateAnyoneCanPayScript(assetAccount.blake160),
        'tokenID',
        UDTType.SUDT
      )
      expect(fromObjectMock).toHaveBeenCalledWith({
        lock: new AssetAccountInfo().generateAnyoneCanPayScript(assetAccount.blake160),
        type: new AssetAccountInfo().generateSudtScript('tokenID'),
        data: '0x00000000000000000000000000000000',
      })
    })
    it('send to anyone pay address exist', async () => {
      const targetLiveCell = {
        capacity: '1000',
        lock() {
          return {}
        },
        type() {
          return {}
        },
        data: '0x00',
        outPoint() {
          return {}
        },
      }
      getOneByLockScriptAndTypeScriptMock.mockResolvedValue(targetLiveCell)
      //@ts-ignore
      await AnyoneCanPayService.getSUDTTargetOutput(
        new AssetAccountInfo().generateAnyoneCanPayScript(assetAccount.blake160),
        'tokenID'
      )
      expect(fromObjectMock).toHaveBeenCalledWith({
        capacity: targetLiveCell.capacity,
        lock: targetLiveCell.lock(),
        type: targetLiveCell.type(),
        data: targetLiveCell.data,
        outPoint: targetLiveCell.outPoint(),
      })
    })
    it('send to unknow address', async () => {
      getOneByLockScriptAndTypeScriptMock.mockResolvedValue(undefined)
      const args = `0x${'0'.repeat(40)}`
      //@ts-ignore
      await AnyoneCanPayService.getSUDTTargetOutput(
        new AssetAccountInfo().generateChequeScript(args, args),
        'tokenID',
        UDTType.SUDT
      )
      expect(fromObjectMock).toHaveBeenCalledWith({
        lock: new AssetAccountInfo().generateChequeScript(args, args),
        type: new AssetAccountInfo().generateSudtScript('tokenID'),
        data: '0x00000000000000000000000000000000',
      })
    })
  })

  describe('getHoldSUDTCellCapacity', () => {
    it('is secp256 address', async () => {
      const res = await AnyoneCanPayService.getHoldSUDTCellCapacity(
        SystemScriptInfo.generateSecpScript(assetAccount.blake160),
        '0x00',
        UDTType.SUDT
      )
      expect(res).toBe(undefined)
    })
    it('CKB acp', async () => {
      const res = await AnyoneCanPayService.getHoldSUDTCellCapacity(
        new AssetAccountInfo().generateAnyoneCanPayScript(assetAccount.blake160),
        'CKBytes'
      )
      expect(res).toBe(undefined)
    })
    it('acp cell exist', async () => {
      getOneByLockScriptAndTypeScriptMock.mockResolvedValue({})
      const res = await AnyoneCanPayService.getHoldSUDTCellCapacity(
        new AssetAccountInfo().generateAnyoneCanPayScript(assetAccount.blake160),
        '0x00',
        UDTType.SUDT
      )
      expect(res).toBe(undefined)
    })
    it('acp cell not exist', async () => {
      getOneByLockScriptAndTypeScriptMock.mockResolvedValue(undefined)
      const res = await AnyoneCanPayService.getHoldSUDTCellCapacity(
        new AssetAccountInfo().generateAnyoneCanPayScript(assetAccount.blake160),
        `0x${'00'.repeat(32)}`,
        UDTType.SUDT
      )
      expect(res).toBe(BigInt(MIN_SUDT_CAPACITY).toString())
    })
    it('unknow lock not exist', async () => {
      getOneByLockScriptAndTypeScriptMock.mockResolvedValue(undefined)
      const res = await AnyoneCanPayService.getHoldSUDTCellCapacity(
        new AssetAccountInfo().generateChequeScript(assetAccount.blake160, assetAccount.blake160),
        `0x${'00'.repeat(32)}`,
        UDTType.SUDT
      )
      expect(res).toBe(BigInt(162 * 10 ** 8).toString())
    })
  })
})
