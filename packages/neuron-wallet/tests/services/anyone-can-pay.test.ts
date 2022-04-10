import { getConnection } from 'typeorm'
import AnyoneCanPayServece from '../../src/services/anyone-can-pay'
import AssetAccountEntity from "../../src/database/chain/entities/asset-account"
import AssetAccount from "../../src/models/asset-account"
import { initConnection, closeConnection } from '../setupAndTeardown'
import { AcpSendSameAccountError, TargetOutputNotFoundError } from '../../src/exceptions'
import AssetAccountInfo from '../../src/models/asset-account-info'

const addressParseMock = jest.fn()
jest.mock('../../src/models/address-parser', () => ({
  parse(address: string) {
    return addressParseMock(address)
  }
}))

const getOneByLockScriptAndTypeScriptMock = jest.fn()
jest.mock('../../src/services/live-cell-service', () => ({
  getInstance() {
    return {
      getOneByLockScriptAndTypeScript: getOneByLockScriptAndTypeScriptMock
    }
  }
}))

const isSecpScriptMock = jest.fn()
jest.mock('../../src/models/system-script-info', () => ({
  isSecpScript: () => isSecpScriptMock()
}))

const getNextChangeAddressMock = jest.fn()
jest.mock('../../src/services/wallets', () => ({
  getInstance() {
    return {
      get: () => ({
        getNextChangeAddress: getNextChangeAddressMock
      })
    }
  }
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
    generateSudtMigrateAcpTx: (...args) => generateSudtMigrateAcpTxMock(...args)
  }
}))

const fromObjectMock = jest.fn()
jest.mock('../../src/models/chain/output', () => ({
  fromObject: (obj: any) => fromObjectMock(obj)
}))

const getLiveCellMock = jest.fn()
jest.mock('../../src/services/cells', () => ({
  getLiveCell: () => getLiveCellMock()
}))

describe('anyone-can-pay-service', () => {
  const assetAccount = AssetAccountEntity.fromModel(new AssetAccount('tokenId', 'symbol', 'accountName', 'tokenName', '8', '0', '0xb2b8101595fe0ddeb9f4e1acead6107119497fe6'))
  const ckbAssetAccount = AssetAccountEntity.fromModel(new AssetAccount('CKBytes', 'symbol', 'accountName', 'tokenName', '8', '0', '0xb2b8101595fe0ddeb9f4e1acead6107119497fe6'))
  let assetAccountEntity: AssetAccountEntity
  let ckbAssetAccountEntity: AssetAccountEntity
  // let sudtTokenInfoEntity
  beforeAll(async () => {
    await initConnection()
    assetAccountEntity = (await getConnection().manager.save([assetAccount.sudtTokenInfo, assetAccount]))[1] as AssetAccountEntity
    ckbAssetAccountEntity = (await getConnection().manager.save([ckbAssetAccount.sudtTokenInfo, ckbAssetAccount]))[1] as AssetAccountEntity
  })

  afterAll(() => {
    return closeConnection()
  })

  describe('generateAnyoneCanPayTx', () => {
    it('exception no asset account', async () => {
      expect(AnyoneCanPayServece.generateAnyoneCanPayTx('walletId', 'targetAddress', 'capacityOrAmount', 1000)).rejects.toThrow(new Error('Asset Account not found!'))
    })
    it('exception AcpSendSameAccountError', async () => {
      addressParseMock.mockReturnValueOnce({ args: assetAccount.blake160 })
      expect(AnyoneCanPayServece.generateAnyoneCanPayTx('walletId', 'targetAddress', 'capacityOrAmount', assetAccountEntity.id)).rejects.toThrow(new AcpSendSameAccountError())
    })
    it('exception with TargetOutputNotFoundError', async () => {
      addressParseMock.mockReturnValueOnce({})
      getOneByLockScriptAndTypeScriptMock.mockResolvedValueOnce({ type: () => true })
      expect(AnyoneCanPayServece.generateAnyoneCanPayTx('walletId', 'targetAddress', 'capacityOrAmount', ckbAssetAccountEntity.id)).rejects.toThrow(new TargetOutputNotFoundError())
    })
    it('isSecpScript with ckb', async () => {
      const targetLockScript = { args: 'args', codeHash: 'codeHash', hashType: 'hashType' }
      const changeBlake160 = 'changeBlake160'
      getNextChangeAddressMock.mockResolvedValueOnce({ blake160: changeBlake160 })
      addressParseMock.mockReturnValueOnce(targetLockScript)
      isSecpScriptMock.mockReturnValueOnce(true)
      getOneByLockScriptAndTypeScriptMock.mockResolvedValueOnce(null)
      generateAnyoneCanPayToCKBTxMock.mockReturnValueOnce({})
      const output = {}
      fromObjectMock.mockReturnValueOnce(output)
      await AnyoneCanPayServece.generateAnyoneCanPayTx('walletId', 'targetAddress', 'capacityOrAmount', ckbAssetAccountEntity.id)
      expect(fromObjectMock).toHaveBeenCalledWith({
        capacity: '0',
        lock: targetLockScript,
        type: null
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
      const targetLockScript = { args: 'args', codeHash: 'codeHash', hashType: 'hashType' }
      const changeBlake160 = 'changeBlake160'
      getNextChangeAddressMock.mockResolvedValueOnce({ blake160: changeBlake160 })
      addressParseMock.mockReturnValueOnce(targetLockScript)
      isSecpScriptMock.mockReturnValueOnce(true)
      getOneByLockScriptAndTypeScriptMock.mockResolvedValueOnce(null)
      generateAnyoneCanPayToSudtTxMock.mockReturnValueOnce({})
      const output = {}
      fromObjectMock.mockReturnValueOnce(output)
      await AnyoneCanPayServece.generateAnyoneCanPayTx('walletId', 'targetAddress', 'capacityOrAmount', assetAccountEntity.id)
      expect(fromObjectMock).toHaveBeenCalledWith({
        capacity: '0',
        lock: targetLockScript,
        type: null
      })
      expect(generateAnyoneCanPayToSudtTxMock).toHaveBeenCalledWith(
        'walletId',
        [new AssetAccountInfo().generateAnyoneCanPayScript(ckbAssetAccount.blake160)],
        output,
        'capacityOrAmount',
        changeBlake160,
        '0',
        '0'
      )
    })
    it('not SecpScript with ckb throw exception', async () => {
      const targetLockScript = { args: 'args', codeHash: 'codeHash', hashType: 'hashType' }
      const changeBlake160 = 'changeBlake160'
      getNextChangeAddressMock.mockResolvedValueOnce({ blake160: changeBlake160 })
      addressParseMock.mockReturnValueOnce(targetLockScript)
      isSecpScriptMock.mockReturnValueOnce(false)
      getOneByLockScriptAndTypeScriptMock.mockResolvedValueOnce(null)
      const output = {}
      fromObjectMock.mockReturnValueOnce(output)
      expect(AnyoneCanPayServece.generateAnyoneCanPayTx('walletId', 'targetAddress', 'capacityOrAmount', ckbAssetAccountEntity.id)).rejects.toThrow(new TargetOutputNotFoundError())
    })
    it('not SecpScript with sudt', async () => {
      const targetLockScript = { args: 'args', codeHash: 'codeHash', hashType: 'hashType' }
      const changeBlake160 = 'changeBlake160'
      const targetOutputLiveCell = {
        capacity: 'capacity',
        lock() { return 'lock' },
        type() { return 'type' },
        data: 'data',
        outPoint() { return 'outPoint' }
      }
      getNextChangeAddressMock.mockResolvedValueOnce({ blake160: changeBlake160 })
      addressParseMock.mockReturnValueOnce(targetLockScript)
      isSecpScriptMock.mockReturnValueOnce(false)
      getOneByLockScriptAndTypeScriptMock.mockResolvedValueOnce(targetOutputLiveCell)
      generateAnyoneCanPayToSudtTxMock.mockReturnValueOnce({})
      const output = {}
      fromObjectMock.mockReturnValueOnce(output)
      await AnyoneCanPayServece.generateAnyoneCanPayTx('walletId', 'targetAddress', 'capacityOrAmount', assetAccountEntity.id)
      expect(fromObjectMock).toHaveBeenLastCalledWith({
        ...targetOutputLiveCell,
        lock: targetOutputLiveCell.lock(),
        type: targetOutputLiveCell.type(),
        outPoint: targetOutputLiveCell.outPoint(),
      })
      expect(generateAnyoneCanPayToSudtTxMock).toHaveBeenCalledWith(
        'walletId',
        [new AssetAccountInfo().generateAnyoneCanPayScript(ckbAssetAccount.blake160)],
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
      expect(AnyoneCanPayServece.generateSudtMigrateAcpTx({ txHash: '', index: '0' })).rejects.toThrow(new Error('sudt live cell not found'))
    })
    it('normal', async () => {
      const cell = {}
      getLiveCellMock.mockResolvedValueOnce(cell)
      await AnyoneCanPayServece.generateSudtMigrateAcpTx({ txHash: '', index: '0' })
      expect(generateSudtMigrateAcpTxMock).toHaveBeenLastCalledWith(cell, undefined)
    })
  })
})