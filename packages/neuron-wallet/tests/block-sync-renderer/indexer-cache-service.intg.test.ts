import { when } from 'jest-when'
import { getConnection } from 'typeorm'
import { initConnection } from '../../src/database/chain/ormconfig'
import AddressMeta from '../../src/database/address/meta'
import { AddressType } from '../../src/models/keys/address'
import { AddressVersion } from '../../src/models/address'
import IndexerTxHashCache from '../../src/database/chain/entities/indexer-tx-hash-cache'
import RpcService from '../../src/services/rpc-service'

const stubbedGetTransactionFn = jest.fn()
const stubbedGetHeaderFn = jest.fn()
const stubbedCollectFn = jest.fn(() => {
  return {
    [Symbol.asyncIterator]: () => {
      return {
        next: async () => {
          return { done: true }
        },
      }
    },
  }
})
const ckbRpcUrl = 'http://localhost:8114'
const stubbedGetTipBlockNumberFn = jest.fn()

const stubbedRPCServiceConstructor = jest.fn().mockImplementation(() => ({
  getTransaction: stubbedGetTransactionFn,
  getHeader: stubbedGetHeaderFn,
  getTipBlockNumber: stubbedGetTipBlockNumberFn,
}))

const stubbedIndexerConstructor = jest.fn().mockImplementation(() => ({
  ckbRpcUrl,
}))

const stubbedTransactionCollectorConstructor = jest.fn()
const stubbedCellCollectorConstructor = jest.fn().mockImplementation(() => ({
  collect: stubbedCollectFn,
}))

const resetMocks = () => {
  stubbedGetTransactionFn.mockReset()
  stubbedGetHeaderFn.mockReset()
  stubbedGetTipBlockNumberFn.mockReset()

  mockGetTransactionHashes()
}

let IndexerCacheService: any
let indexerCacheService: any
let rpcService: RpcService

const walletId = '1'
const address = {
  walletId,
  address: 'ckt1qyqrdsefa43s6m882pcj53m4gdnj4k440axqswmu83',
  path: "m/44'/309'/0'/0/0",
  addressType: AddressType.Receiving,
  addressIndex: 0,
  txCount: 0,
  liveBalance: '0',
  sentBalance: '0',
  pendingBalance: '0',
  balance: '0',
  blake160: '0x36c329ed630d6ce750712a477543672adab57f4c',
  version: AddressVersion.Testnet,
}
const addressMeta = AddressMeta.fromObject(address)
const addressMetas = [addressMeta]
const defaultLockScript = addressMeta.generateDefaultLockScript()
const singleMultiSignLockScript = addressMeta.generateSingleMultiSignLockScript()
const chequeLockScript = addressMeta.generateChequeLockScriptWithReceiverLockHash()
const acpLockScript = addressMeta.generateACPLockScript()
const legacyAcpLockScript = addressMeta.generateLegacyACPLockScript()
const formattedDefaultLockScript = {
  codeHash: defaultLockScript.codeHash,
  hashType: defaultLockScript.hashType,
  args: defaultLockScript.args,
}
const formattedSingleMultiSignLockScript = {
  codeHash: singleMultiSignLockScript.codeHash,
  hashType: singleMultiSignLockScript.hashType,
  args: singleMultiSignLockScript.args + '0'.repeat(14),
}
const formattedChequeLockScript = {
  codeHash: chequeLockScript.codeHash,
  hashType: chequeLockScript.hashType,
  args: chequeLockScript.args,
}
const formattedAcpLockScript = {
  codeHash: acpLockScript.codeHash,
  hashType: acpLockScript.hashType,
  args: acpLockScript.args,
}
const formattedLegacyAcpLockScript = {
  codeHash: legacyAcpLockScript.codeHash,
  hashType: legacyAcpLockScript.hashType,
  args: legacyAcpLockScript.args,
}

const mockTipBlockNumber = '0x100'

const mockGetTransactionHashes = (mocks: any[] = []) => {
  const stubbedConstructor = when(stubbedTransactionCollectorConstructor)

  for (const lock of [formattedDefaultLockScript, formattedAcpLockScript, formattedLegacyAcpLockScript]) {
    const { hashes } = mocks.find(mock => mock.lock === lock) || { hashes: [] }
    stubbedConstructor
      .calledWith(expect.anything(), expect.objectContaining({ lock }), rpcService?.url, { includeStatus: false })
      .mockReturnValue({
        getTransactionHashes: jest.fn().mockReturnValue(hashes),
      })
  }
}
const fakeBlock1 = { number: '1', hash: '1', timestamp: '1' }
const fakeBlock2 = { number: '2', hash: '2', timestamp: '2' }
const fakeTx1 = {
  transaction: { hash: 'hash1', blockNumber: fakeBlock1.number },
  txStatus: { status: 'committed', blockHash: fakeBlock1.hash },
}
const fakeTx2 = {
  transaction: { hash: 'hash2', blockNumber: fakeBlock2.number },
  txStatus: { status: 'committed', blockHash: fakeBlock2.hash },
}
const fakeTx3 = {
  transaction: { hash: 'hash3', blockNumber: fakeBlock2.number },
  txStatus: { status: 'committed', blockHash: fakeBlock2.hash },
}

describe('indexer cache service', () => {
  beforeAll(async () => {
    await initConnection('')
  })

  afterAll(async () => {
    await getConnection().close()
  })

  beforeEach(async () => {
    const connection = getConnection()
    await connection.synchronize(true)

    resetMocks()

    jest.doMock('@ckb-lumos/ckb-indexer', () => {
      return {
        Indexer: stubbedIndexerConstructor,
        TransactionCollector: stubbedTransactionCollectorConstructor,
        CellCollector: stubbedCellCollectorConstructor,
      }
    })

    stubbedGetTipBlockNumberFn.mockResolvedValue(mockTipBlockNumber)
    rpcService = new stubbedRPCServiceConstructor()
    IndexerCacheService = require('../../src/block-sync-renderer/sync/indexer-cache-service').default
    indexerCacheService = new IndexerCacheService(walletId, addressMetas, rpcService, stubbedIndexerConstructor())
  })

  describe('#constructor', () => {
    describe('when an address does not belong to a wallet', () => {
      it('throws error', () => {
        expect(() => {
          new IndexerCacheService('walletId', addressMetas, rpcService, stubbedIndexerConstructor())
        }).toThrow(
          new Error('address ckt1qyqrdsefa43s6m882pcj53m4gdnj4k440axqswmu83 does not belong to wallet id walletId')
        )
      })
    })
  })

  describe('#upsertTxHashes', () => {
    describe('with existing tx hashes from indexer', () => {
      let newTxHashes: any
      const initHashes = [fakeTx1.transaction.hash, fakeTx3.transaction.hash]
      beforeEach(async () => {
        mockGetTransactionHashes([
          {
            lock: formattedDefaultLockScript,
            hashes: initHashes,
          },
        ])
        when(stubbedGetTransactionFn)
          .calledWith(fakeTx1.transaction.hash)
          .mockReturnValueOnce(fakeTx1)
          .calledWith(fakeTx3.transaction.hash)
          .mockReturnValueOnce(fakeTx3)
        when(stubbedGetHeaderFn)
          .calledWith(fakeBlock1.hash)
          .mockReturnValueOnce(fakeBlock1)
          .calledWith(fakeBlock2.hash)
          .mockReturnValueOnce(fakeBlock2)

        newTxHashes = await indexerCacheService.upsertTxHashes()
      })
      it('returns newly cached tx hashes', () => {
        expect(newTxHashes).toEqual([fakeTx1.transaction.hash, fakeTx3.transaction.hash])
      })
      it('persists tx hashes', async () => {
        const caches = await getConnection().getRepository(IndexerTxHashCache).find()
        expect(caches).toHaveLength(2)
        expect(caches.filter(cache => cache.txHash === fakeTx1.transaction.hash)).toHaveLength(1)
        expect(caches.filter(cache => cache.txHash === fakeTx3.transaction.hash)).toHaveLength(1)
      })
      describe('when new tx hash available', () => {
        beforeEach(async () => {
          mockGetTransactionHashes([
            {
              lock: formattedDefaultLockScript,
              hashes: [...initHashes, fakeTx2.transaction.hash],
            },
          ])
          when(stubbedGetTransactionFn).calledWith(fakeTx2.transaction.hash).mockReturnValueOnce(fakeTx2)
          when(stubbedGetHeaderFn).calledWith(fakeBlock2.hash).mockReturnValueOnce(fakeBlock2)

          await indexerCacheService.upsertTxHashes()
        })
        it('saves the new ones', async () => {
          const caches = await getConnection().getRepository(IndexerTxHashCache).find()
          expect(caches).toHaveLength(3)
          expect(caches.filter(cache => cache.txHash === fakeTx1.transaction.hash)).toHaveLength(1)
          expect(caches.filter(cache => cache.txHash === fakeTx2.transaction.hash)).toHaveLength(1)
          expect(caches.filter(cache => cache.txHash === fakeTx3.transaction.hash)).toHaveLength(1)
        })
      })
      describe('when all of tx hashes cache exists', () => {
        beforeEach(async () => {
          resetMocks()
          mockGetTransactionHashes([
            {
              lock: formattedDefaultLockScript,
              hashes: initHashes,
            },
          ])

          await indexerCacheService.upsertTxHashes()
        })
        it('should not do any new inserts', async () => {
          const caches = await getConnection().getRepository(IndexerTxHashCache).find()
          expect(caches).toHaveLength(2)

          expect(stubbedGetTransactionFn).toHaveBeenCalledTimes(0)
          expect(stubbedGetHeaderFn).toHaveBeenCalledTimes(0)
        })
      })
    })
    describe('when found cells using cell collector', () => {
      let newTxHashes: any
      const fakeCollectorObj = {
        collect: () => {
          return {
            [Symbol.asyncIterator]: () => {
              let count = 0
              return {
                next: async () => {
                  if (count++ === 0) {
                    return {
                      done: false,
                      value: {
                        outPoint: {
                          txHash: fakeTx2.transaction.hash,
                        },
                      },
                    }
                  }
                  return { done: true }
                },
              }
            },
          }
        },
      }
      beforeEach(async () => {
        when(stubbedGetTransactionFn).calledWith(fakeTx2.transaction.hash).mockReturnValueOnce(fakeTx2)
        when(stubbedGetHeaderFn).calledWith(fakeBlock2.hash).mockReturnValueOnce(fakeBlock2)

        stubbedCellCollectorConstructor.mockReset()
        when(stubbedCellCollectorConstructor)
          .calledWith(expect.anything(), expect.objectContaining({
            lock: {
              ...formattedSingleMultiSignLockScript,
              args: formattedSingleMultiSignLockScript.args.slice(0, 42),
            },
            argsLen: 28,
          }))
          .mockReturnValue(fakeCollectorObj)
          .calledWith(expect.anything(), expect.objectContaining({
            lock: {
              ...formattedChequeLockScript,
              args: formattedChequeLockScript.args.slice(0, 42),
            },
            argsLen: 40,
          }))
          .mockReturnValue(fakeCollectorObj)

        newTxHashes = await indexerCacheService.upsertTxHashes()
      })
      it('saves related tx cache', async () => {
        expect(newTxHashes).toEqual([fakeTx2.transaction.hash])
      })
    })
  })
  describe('#updateProcessedTxHashes', () => {
    beforeEach(async () => {
      mockGetTransactionHashes([
        {
          lock: formattedDefaultLockScript,
          hashes: [fakeTx1.transaction.hash, fakeTx2.transaction.hash, fakeTx3.transaction.hash],
        },
      ])
      when(stubbedGetTransactionFn)
        .calledWith(fakeTx1.transaction.hash)
        .mockReturnValueOnce(fakeTx1)
        .calledWith(fakeTx2.transaction.hash)
        .mockReturnValueOnce(fakeTx2)
        .calledWith(fakeTx3.transaction.hash)
        .mockReturnValueOnce(fakeTx3)
      when(stubbedGetHeaderFn)
        .calledWith(fakeBlock1.hash)
        .mockReturnValueOnce(fakeBlock1)
        .calledWith(fakeBlock2.hash)
        .mockReturnValue(fakeBlock2)

      await indexerCacheService.upsertTxHashes()
      await indexerCacheService.updateProcessedTxHashes(fakeBlock2.number)
    })

    it('updates isProcessed by block number', async () => {
      const caches = await getConnection().getRepository(IndexerTxHashCache).find()
      const cachesByBlock2 = caches.filter(
        cache => cache.isProcessed && cache.blockNumber === parseInt(fakeBlock2.number)
      )
      expect(cachesByBlock2).toHaveLength(2)
    })
  })
  describe('#nextUnprocessedTxsGroupedByBlockNumber', () => {
    describe('when there are caches', () => {
      beforeEach(async () => {
        mockGetTransactionHashes([
          {
            lock: formattedDefaultLockScript,
            hashes: [fakeTx1.transaction.hash, fakeTx2.transaction.hash, fakeTx3.transaction.hash],
          },
        ])
        when(stubbedGetTransactionFn)
          .calledWith(fakeTx1.transaction.hash)
          .mockReturnValueOnce(fakeTx1)
          .calledWith(fakeTx2.transaction.hash)
          .mockReturnValueOnce(fakeTx2)
          .calledWith(fakeTx3.transaction.hash)
          .mockReturnValueOnce(fakeTx3)
        when(stubbedGetHeaderFn)
          .calledWith(fakeBlock1.hash)
          .mockReturnValueOnce(fakeBlock1)
          .calledWith(fakeBlock2.hash)
          .mockReturnValue(fakeBlock2)

        await indexerCacheService.upsertTxHashes()
      })
      describe('with all unprocessed transactions', () => {
        it('returns the tx hashes for the next block number', async () => {
          const txHashes = await indexerCacheService.nextUnprocessedTxsGroupedByBlockNumber()
          expect(txHashes).toHaveLength(1)
          expect(txHashes![0].blockNumber).toEqual(parseInt(fakeBlock1.number))
        })
      })
      describe('with some blocks has been fully processed', () => {
        beforeEach(async () => {
          await getConnection()
            .createQueryBuilder()
            .update(IndexerTxHashCache)
            .where({
              blockNumber: fakeBlock1.number,
            })
            .set({
              isProcessed: true,
            })
            .execute()
        })
        it('returns the tx hashes for the next block number', async () => {
          const txHashes = await indexerCacheService.nextUnprocessedTxsGroupedByBlockNumber()
          expect(txHashes).toHaveLength(2)
          expect(txHashes![0].blockNumber).toEqual(parseInt(fakeBlock2.number))
        })
        describe('when some transactions has been partially processed in a block', () => {
          beforeEach(async () => {
            await getConnection()
              .createQueryBuilder()
              .update(IndexerTxHashCache)
              .where({
                txHash: fakeTx2.transaction.hash,
              })
              .set({
                isProcessed: true,
              })
              .execute()
          })
          it('returns the unprocessed tx hash in the next block number', async () => {
            const txHashes = await indexerCacheService.nextUnprocessedTxsGroupedByBlockNumber()
            expect(txHashes).toHaveLength(1)
            expect(txHashes![0].blockNumber).toEqual(parseInt(fakeBlock2.number))
            expect(txHashes![0].txHash).toEqual(fakeTx3.transaction.hash)
          })
        })
      })
    })
    describe('when all transactions are processed', () => {
      beforeEach(async () => {
        mockGetTransactionHashes([
          {
            lock: formattedDefaultLockScript,
            hashes: [fakeTx1.transaction.hash, fakeTx2.transaction.hash, fakeTx3.transaction.hash],
          },
        ])
        when(stubbedGetTransactionFn)
          .calledWith(fakeTx1.transaction.hash)
          .mockReturnValueOnce(fakeTx1)
          .calledWith(fakeTx2.transaction.hash)
          .mockReturnValueOnce(fakeTx2)
          .calledWith(fakeTx3.transaction.hash)
          .mockReturnValueOnce(fakeTx3)
        when(stubbedGetHeaderFn)
          .calledWith(fakeBlock1.hash)
          .mockReturnValueOnce(fakeBlock1)
          .calledWith(fakeBlock2.hash)
          .mockReturnValue(fakeBlock2)

        await indexerCacheService.upsertTxHashes()
        await getConnection()
          .createQueryBuilder()
          .update(IndexerTxHashCache)
          .set({
            isProcessed: true,
          })
          .execute()
      })
      it('returns empty array when no unprocessed transactions', async () => {
        const txHashes = await indexerCacheService.nextUnprocessedTxsGroupedByBlockNumber()
        expect(txHashes).toEqual([])
      })
    })
  })
  describe('#nextUnprocessedBlock', () => {
    beforeEach(async () => {
      mockGetTransactionHashes([
        {
          lock: formattedDefaultLockScript,
          hashes: [fakeTx1.transaction.hash],
        },
      ])
      when(stubbedGetTransactionFn).calledWith(fakeTx1.transaction.hash).mockReturnValueOnce(fakeTx1)
      when(stubbedGetHeaderFn).calledWith(fakeBlock1.hash).mockReturnValueOnce(fakeBlock1)

      await indexerCacheService.upsertTxHashes()
    })
    describe('when has unprocessed blocks', () => {
      let nextUnprocessedBlock: any
      describe('check with walletId having tx hash caches', () => {
        beforeEach(async () => {
          nextUnprocessedBlock = await IndexerCacheService.nextUnprocessedBlock([walletId])
        })
        it('returns next unprocessed block number', async () => {
          expect(nextUnprocessedBlock).toEqual({
            blockNumber: fakeBlock1.number,
            blockHash: fakeBlock1.hash,
          })
        })
      })
      describe('check with walletId that does not have hash caches', () => {
        beforeEach(async () => {
          nextUnprocessedBlock = await IndexerCacheService.nextUnprocessedBlock(['w1'])
        })
        it('returns undefined', async () => {
          expect(nextUnprocessedBlock).toEqual(undefined)
        })
      })
      describe('check with empty walletIds array', () => {
        beforeEach(async () => {
          nextUnprocessedBlock = await IndexerCacheService.nextUnprocessedBlock([])
        })
        it('returns undefined', async () => {
          expect(nextUnprocessedBlock).toEqual(undefined)
        })
      })
    })
    describe('when has no unprocessed blocks', () => {
      beforeEach(async () => {
        await getConnection()
          .createQueryBuilder()
          .update(IndexerTxHashCache)
          .set({
            isProcessed: true,
          })
          .execute()
      })
      it('returns undefined', async () => {
        const nextUnprocessedBlock = await IndexerCacheService.nextUnprocessedBlock([walletId])
        expect(nextUnprocessedBlock).toEqual(undefined)
      })
    })
  })
  describe('#updateCacheProcessed', () => {
    describe('when there are unprocessed tx hash cache', () => {
      beforeEach(async () => {
        mockGetTransactionHashes([
          {
            lock: formattedDefaultLockScript,
            hashes: [fakeTx1.transaction.hash, fakeTx2.transaction.hash, fakeTx3.transaction.hash],
          },
        ])
        when(stubbedGetTransactionFn)
          .calledWith(fakeTx1.transaction.hash)
          .mockReturnValueOnce(fakeTx1)
          .calledWith(fakeTx2.transaction.hash)
          .mockReturnValueOnce(fakeTx2)
          .calledWith(fakeTx3.transaction.hash)
          .mockReturnValueOnce(fakeTx3)
        when(stubbedGetHeaderFn)
          .calledWith(fakeBlock1.hash)
          .mockReturnValueOnce(fakeBlock1)
          .calledWith(fakeBlock2.hash)
          .mockReturnValue(fakeBlock2)

        await indexerCacheService.upsertTxHashes()

        const caches = await getConnection().getRepository(IndexerTxHashCache).find()
        const processedCaches = caches.filter(cache => !cache.isProcessed)
        expect(processedCaches).toHaveLength(3)

        for (const hash of [fakeTx1.transaction.hash, fakeTx3.transaction.hash]) {
          await IndexerCacheService.updateCacheProcessed(hash)
        }
      })
      it('updates isProcessed to be true', async () => {
        const caches = await getConnection().getRepository(IndexerTxHashCache).find()
        const processedCaches = caches.filter(cache => cache.isProcessed)
        expect(processedCaches).toHaveLength(2)
        expect(processedCaches.filter(cache => cache.txHash === fakeTx1.transaction.hash)).toHaveLength(1)
        expect(processedCaches.filter(cache => cache.txHash === fakeTx3.transaction.hash)).toHaveLength(1)
      })
    })
  })
})
