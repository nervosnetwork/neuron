import { scriptToAddress } from '../../src/utils/scriptAndAddress'
import { type Cell, hd } from '@ckb-lumos/lumos'
import { QueryOptions } from '@ckb-lumos/base'
import { Address, AddressVersion } from '../../src/models/address'
import SystemScriptInfo from '../../src/models/system-script-info'
import { Synchronizer } from '../../src/block-sync-renderer/sync/synchronizer'
import AddressMeta from '../../src/database/address/meta'
import IndexerTxHashCache from '../../src/database/chain/entities/indexer-tx-hash-cache'
import { ScriptHashType } from '../../src/models/chain/script'

const stubbedNextUnprocessedBlockFn = jest.fn()
const stubbedNextUnprocessedTxsGroupedByBlockNumberFn = jest.fn()
const stubbedProcessTxsInNextBlockNumberFn = jest.fn()
const stubbedIndexerConstructor = jest.fn()
const stubbedCellCollectorConstructor = jest.fn()
const stubbedBlockTipsSubscribe = jest.fn()
const stubbedCellCellectFn = jest.fn()

class TestSynchronizer extends Synchronizer {
  async connect() {}
  async processTxsInNextBlockNumber(): Promise<void> {
    return stubbedProcessTxsInNextBlockNumberFn()
  }

  async upsertTxHashes(): Promise<void> {}

  async notifyCurrentBlockNumberProcessed() {}

  getAddressesByWalletId() {
    return this.addressesByWalletId
  }
}

const script = SystemScriptInfo.generateSecpScript('0x36c329ed630d6ce750712a477543672adab57f4c')
const address = scriptToAddress(script, false)
const walletId1 = 'walletid1'
const walletId2 = 'walletid2'
const addressObj1: Address = {
  address,
  blake160: '0x',
  walletId: walletId1,
  path: '',
  addressType: hd.AddressType.Receiving,
  addressIndex: 0,
  txCount: 0,
  liveBalance: '',
  sentBalance: '',
  pendingBalance: '',
  balance: '',
  version: AddressVersion.Testnet,
}
const addressObj2: Address = {
  address,
  blake160: '0x',
  walletId: walletId2,
  path: '',
  addressType: hd.AddressType.Receiving,
  addressIndex: 0,
  txCount: 0,
  liveBalance: '',
  sentBalance: '',
  pendingBalance: '',
  balance: '',
  version: AddressVersion.Testnet,
}

const resetMocks = () => {
  stubbedNextUnprocessedBlockFn.mockReset()
  stubbedNextUnprocessedTxsGroupedByBlockNumberFn.mockReset()
  stubbedProcessTxsInNextBlockNumberFn.mockReset()
  stubbedIndexerConstructor.mockReset()
  stubbedCellCollectorConstructor.mockReset()
  stubbedBlockTipsSubscribe.mockReset()
  stubbedCellCellectFn.mockReset()
}

jest.mock('@ckb-lumos/ckb-indexer', () => {
  return {
    Indexer: class {
      constructor(...params: unknown[]) {
        stubbedIndexerConstructor(...params)
      }
    },
    CellCollector: class {
      constructor(...params: unknown[]) {
        return stubbedCellCollectorConstructor(...params)
      }

      collect(...params: unknown[]) {
        return stubbedCellCellectFn(...params)
      }
    },
  }
})

jest.mock('../../src/block-sync-renderer/sync/indexer-cache-service', () => ({
  nextUnprocessedBlock: () => stubbedNextUnprocessedBlockFn(),
  nextUnprocessedTxsGroupedByBlockNumber: (walletId: string) =>
    stubbedNextUnprocessedTxsGroupedByBlockNumberFn(walletId),
}))

describe('unit tests for IndexerConnector', () => {
  const nodeUrl = 'http://nodeurl:8114'

  beforeEach(() => {
    resetMocks()
    jest.useFakeTimers('legacy')
  })
  afterEach(() => {
    jest.clearAllTimers()
  })

  describe('#constructor', () => {
    it('inits lumos indexer with a node url and indexer folder path', () => {
      new TestSynchronizer({
        addresses: [],
        nodeUrl,
      })
      expect(stubbedIndexerConstructor).toHaveBeenCalledWith(nodeUrl)
    })

    it('init with addresses', () => {
      const synchronizer = new TestSynchronizer({
        addresses: [addressObj1, addressObj2],
        nodeUrl,
      })
      expect(synchronizer.getAddressesByWalletId().get(walletId1)?.[0]).toStrictEqual(
        AddressMeta.fromObject(addressObj1)
      )
      expect(synchronizer.getAddressesByWalletId().get(walletId2)?.[0]).toStrictEqual(
        AddressMeta.fromObject(addressObj2)
      )
    })
  })

  describe('#getTxHashesWithNextUnprocessedBlockNumber', () => {
    const synchronizer = new TestSynchronizer({
      addresses: [addressObj1, addressObj2],
      nodeUrl,
    })
    it('no cached tx', async () => {
      stubbedNextUnprocessedTxsGroupedByBlockNumberFn.mockResolvedValue([])
      // @ts-ignore private method
      const result = await synchronizer.getTxHashesWithNextUnprocessedBlockNumber()
      expect(result).toStrictEqual([undefined, [], []])
    })
    it('get cached tx and sort by block number', async () => {
      stubbedNextUnprocessedTxsGroupedByBlockNumberFn.mockImplementation(walletId =>
        walletId === walletId1
          ? [
              IndexerTxHashCache.fromObject({
                txHash: 'hash1',
                blockNumber: 10,
                lockHash: script.computeHash(),
                walletId,
              }),
            ]
          : [
              IndexerTxHashCache.fromObject({
                txHash: 'hash2',
                blockNumber: 2,
                lockHash: script.computeHash(),
                walletId,
              }),
            ]
      )
      // @ts-ignore private method
      const result = await synchronizer.getTxHashesWithNextUnprocessedBlockNumber()
      expect(result).toStrictEqual(['2', ['hash2'], [walletId2]])
    })
  })

  describe('#notifyAndSyncNext', () => {
    const synchronizer = new TestSynchronizer({
      addresses: [addressObj1, addressObj2],
      nodeUrl,
    })
    synchronizer.blockTipsSubject.subscribe(stubbedBlockTipsSubscribe)

    it('exist unprocessed block and no current process block', async () => {
      //@ts-ignore private property
      synchronizer.processingBlockNumber = undefined
      stubbedNextUnprocessedBlockFn.mockResolvedValue('10')
      //@ts-ignore private method
      await synchronizer.notifyAndSyncNext(100)
      expect(stubbedBlockTipsSubscribe).toHaveBeenCalledWith({
        cacheTipNumber: 10,
        indexerTipNumber: 100,
      })
      expect(stubbedProcessTxsInNextBlockNumberFn).toHaveBeenCalled()
    })
    it('exist unprocessed block and has current process block', async () => {
      //@ts-ignore private property
      synchronizer.processingBlockNumber = '5'
      stubbedNextUnprocessedBlockFn.mockResolvedValue('10')
      //@ts-ignore private method
      await synchronizer.notifyAndSyncNext(100)
      expect(stubbedBlockTipsSubscribe).toHaveBeenCalledWith({
        cacheTipNumber: 10,
        indexerTipNumber: 100,
      })
      expect(stubbedProcessTxsInNextBlockNumberFn).toHaveBeenCalledTimes(0)
    })
    it('no unprocessed block', async () => {
      //@ts-ignore private property
      synchronizer.processingBlockNumber = '5'
      stubbedNextUnprocessedBlockFn.mockResolvedValue(undefined)
      //@ts-ignore private method
      await synchronizer.notifyAndSyncNext(100)
      expect(stubbedBlockTipsSubscribe).toHaveBeenCalledWith({
        cacheTipNumber: 100,
        indexerTipNumber: 100,
      })
    })
  })

  describe('#getLiveCellsByScript', () => {
    let fakeCell1: Cell, fakeCell2: Cell
    let cells: Cell[]

    fakeCell1 = {
      data: '0x',
      blockHash: '0x',
      outPoint: {
        txHash: '0x',
        index: '0x0',
      },
      cellOutput: {
        capacity: '0x0',
        lock: {
          hashType: 'type',
          codeHash: '0xcode',
          args: '0x1',
        },
        type: {
          hashType: 'data',
          codeHash: '0xcode',
          args: '0x1',
        },
      },
    }
    fakeCell2 = {
      data: '0x',
      blockHash: '0x',
      outPoint: {
        txHash: '0x',
        index: '0x0',
      },
      cellOutput: {
        capacity: '0x0',
        lock: {
          hashType: 'type',
          codeHash: '0xcode',
          args: '0x2',
        },
        type: {
          hashType: 'data',
          codeHash: '0xcode',
          args: '0x2',
        },
      },
    }
    const fakeCells = [fakeCell1, fakeCell2]

    const synchronizer = new TestSynchronizer({
      addresses: [addressObj1, addressObj2],
      nodeUrl,
    })

    describe('when success', () => {
      const query = {
        lock: {
          hashType: ScriptHashType.Data,
          codeHash: '0xcode',
          args: '0x',
        },
        type: {
          hashType: ScriptHashType.Data,
          codeHash: '0xcode',
          args: '0x',
        },
      }

      beforeEach(async () => {
        stubbedCellCellectFn.mockReturnValueOnce([
          new Promise(resolve => resolve(JSON.parse(JSON.stringify(fakeCells[0])))),
          new Promise(resolve => resolve(JSON.parse(JSON.stringify(fakeCells[1])))),
        ])

        //@ts-ignore
        cells = await synchronizer.getLiveCellsByScript(query)
      })
      it('transform the query parameter', () => {
        expect(stubbedCellCollectorConstructor.mock.calls[0][1]).toEqual({
          lock: {
            hashType: query.lock.hashType,
            codeHash: query.lock.codeHash,
            args: query.lock.args,
          },
          type: {
            hashType: query.type.hashType,
            codeHash: query.type.codeHash,
            args: query.type.args,
          },
          data: 'any',
        })
      })
      it('returns live cells with property value fix', async () => {
        fakeCell2.cellOutput.type!.hashType = 'data'
        expect(cells).toEqual([fakeCell1, fakeCell2])
      })
    })
    describe('when handling concurrent requests', () => {
      const query1: QueryOptions = {
        lock: {
          hashType: ScriptHashType.Data,
          codeHash: '0xcode',
          args: '0x1',
        },
        type: {
          hashType: ScriptHashType.Data,
          codeHash: '0xcode',
          args: '0x1',
        },
      }
      const query2: QueryOptions = {
        lock: {
          hashType: ScriptHashType.Type,
          codeHash: '0xcode',
          args: '0x2',
        },
        type: {
          hashType: ScriptHashType.Type,
          codeHash: '0xcode',
          args: '0x2',
        },
      }

      const results: unknown[] = []
      beforeEach(async () => {
        const stubbedCellCellect1 = jest.fn()
        stubbedCellCellect1.mockReturnValueOnce([
          new Promise(resolve => {
            //fake the waiting, the other concurrent requests should wait until this is finished
            setTimeout(() => {
              resolve(JSON.parse(JSON.stringify(fakeCells[0])))
            }, 500)
          }),
        ])

        const stubbedCellCellect2 = jest.fn()
        stubbedCellCellect2.mockReturnValueOnce([
          new Promise(resolve => resolve(JSON.parse(JSON.stringify(fakeCells[1])))),
        ])

        stubbedCellCollectorConstructor.mockImplementation((_indexer: any, query: any) => {
          if (query.lock.args === '0x1') {
            return {
              collect: stubbedCellCellect1,
            }
          }
          if (query.lock.args === '0x2') {
            return {
              collect: stubbedCellCellect2,
            }
          }
        })

        const promises = Promise.all([
          new Promise<void>(resolve => {
            synchronizer.getLiveCellsByScript(query1).then(cells => {
              results.push(cells)
              resolve()
            })
          }),
          new Promise<void>(resolve => {
            synchronizer.getLiveCellsByScript(query2).then(cells => {
              results.push(cells)
              resolve()
            })
          }),
        ])

        jest.advanceTimersByTime(500)
        await promises
      })
      it('process one by one in order', () => {
        expect(results.length).toEqual(2)
        expect(results[0]).toEqual([fakeCells[0]])
      })
    })
    describe('when fails', () => {
      describe('when both type and lock parameter is not specified', () => {
        it('throws error', async () => {
          let err
          try {
            await synchronizer.getLiveCellsByScript({})
          } catch (error) {
            err = error
          }
          expect(err).toEqual(new Error('at least one parameter is required'))
        })
      })
    })
  })
})
