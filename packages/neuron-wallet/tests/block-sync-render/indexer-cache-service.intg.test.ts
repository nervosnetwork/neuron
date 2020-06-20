import { getConnection } from 'typeorm'
import { initConnection } from '../../src/database/chain/ormconfig'
import IndexerCacheService from '../../src/block-sync-renderer/sync/indexer-cache-service';
import AddressMeta from '../../src/database/address/meta';
import { AddressType } from '../../src/models/keys/address';
import { AddressVersion } from '../../src/database/address/address-dao';
import IndexerTxHashCache from '../../dist/database/chain/entities/indexer-tx-hash-cache';
import RpcService from '../../src/services/rpc-service';

const stubbedGetTransactionFn = jest.fn()
const stubbedGetHeaderFn = jest.fn()
const stubbedGetTransactionsByLockScriptFn = jest.fn()

const stubbedRPCServiceConstructor = jest.fn().mockImplementation(
  () => ({
    getTransaction: stubbedGetTransactionFn,
    getHeader: stubbedGetHeaderFn
  })
)

const stubbedIndexerConstructor = jest.fn().mockImplementation(
  () => ({
    getTransactionsByLockScript: stubbedGetTransactionsByLockScriptFn
  })
)

const resetMocks = () => {
  stubbedGetTransactionFn.mockReset()
  stubbedGetHeaderFn.mockReset()
  stubbedGetTransactionsByLockScriptFn.mockReset()
}

describe('indexer cache service', () => {
  let indexerCacheService: IndexerCacheService
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

  const fakeBlock1 = {number: '1', hash: '1', timestamp: '1'}
  const fakeBlock2 = {number: '2', hash: '2', timestamp: '2'}
  const fakeTx1 = {transaction: {hash: 'hash1', blockNumber: fakeBlock1.number}, txStatus: {status: 'committed', blockHash: fakeBlock1.hash}}
  const fakeTx2 = {transaction: {hash: 'hash2', blockNumber: fakeBlock2.number}, txStatus: {status: 'committed', blockHash: fakeBlock2.hash}}
  const fakeTx3 = {transaction: {hash: 'hash3', blockNumber: fakeBlock2.number}, txStatus: {status: 'committed', blockHash: fakeBlock2.hash}}

  const txHashes = [
    fakeTx1.transaction.hash,
    fakeTx2.transaction.hash,
    fakeTx3.transaction.hash
  ]

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

    rpcService = new stubbedRPCServiceConstructor()
    indexerCacheService = new IndexerCacheService(walletId, addressMetas, rpcService, stubbedIndexerConstructor())
  })

  describe('#constructor', () => {
    describe('when an address does not belong to a wallet', () => {
      it('throws error', () => {
        expect(() => {
          new IndexerCacheService('walletId', addressMetas, rpcService, stubbedIndexerConstructor())
        }).toThrow(new Error('address ckt1qyqrdsefa43s6m882pcj53m4gdnj4k440axqswmu83 does not belong to wallet id walletId'))
      });
    });
  });

  describe('#upsertTxHashes', () => {
    describe('when there are tx hashes from indexer', () => {
      let initTxHashes: any
      beforeEach(async () => {
        stubbedGetTransactionsByLockScriptFn.mockReturnValueOnce([
          fakeTx1.transaction.hash,
          fakeTx3.transaction.hash,
        ])
        stubbedGetTransactionFn.mockReturnValueOnce(fakeTx1)
        stubbedGetTransactionFn.mockReturnValueOnce(fakeTx3)
        stubbedGetHeaderFn.mockReturnValueOnce(fakeBlock1)
        stubbedGetHeaderFn.mockReturnValueOnce(fakeBlock2)
        initTxHashes = await indexerCacheService.upsertTxHashes()
      });
      describe('when no tx hashes cache exists', () => {
        it('saves all tx hashes', async () => {
          const caches = await getConnection()
            .getRepository(IndexerTxHashCache)
            .find()
          expect(caches).toHaveLength(2)
          expect(caches.filter(cache => cache.txHash === txHashes[0])).toHaveLength(1)
          expect(caches.filter(cache => cache.txHash === txHashes[2])).toHaveLength(1)
          expect(initTxHashes).toEqual([txHashes[0], txHashes[2]])
        });
      });
      describe('when some of tx hashes cache exists', () => {
        beforeEach(async () => {
          stubbedGetTransactionsByLockScriptFn.mockReturnValueOnce([
            fakeTx1.transaction.hash,
            fakeTx2.transaction.hash,
            fakeTx3.transaction.hash,
          ])
          stubbedGetTransactionFn.mockReturnValueOnce(fakeTx2)
          stubbedGetHeaderFn.mockReturnValueOnce(fakeBlock2)
        });
        it('saves the new ones', async () => {
          const savedTxHashes = await indexerCacheService.upsertTxHashes()
          const caches = await getConnection()
            .getRepository(IndexerTxHashCache)
            .find()
          expect(caches).toHaveLength(3)
          expect(caches.filter(cache => cache.txHash === txHashes[0])).toHaveLength(1)
          expect(caches.filter(cache => cache.txHash === txHashes[1])).toHaveLength(1)
          expect(caches.filter(cache => cache.txHash === txHashes[2])).toHaveLength(1)
          expect(savedTxHashes).toEqual([txHashes[1]])
        });
      });
    });
    describe('when all of tx hashes cache exists', () => {
      beforeEach(async () => {
        stubbedGetTransactionsByLockScriptFn.mockReturnValueOnce([
          fakeTx1.transaction.hash,
          fakeTx2.transaction.hash,
          fakeTx3.transaction.hash,
        ])
        stubbedGetTransactionFn.mockReturnValueOnce(fakeTx1)
        stubbedGetTransactionFn.mockReturnValueOnce(fakeTx2)
        stubbedGetTransactionFn.mockReturnValueOnce(fakeTx3)
        stubbedGetHeaderFn.mockReturnValueOnce(fakeBlock1)
        stubbedGetHeaderFn.mockReturnValueOnce(fakeBlock2)
        stubbedGetHeaderFn.mockReturnValueOnce(fakeBlock2)

        await indexerCacheService.upsertTxHashes()
        const caches = await getConnection()
          .getRepository(IndexerTxHashCache)
          .find()
        expect(caches).toHaveLength(3)
      });
      it('should not do any new inserts', async () => {
        resetMocks()
        stubbedGetTransactionsByLockScriptFn.mockReturnValueOnce([
          fakeTx1.transaction.hash,
          fakeTx2.transaction.hash,
          fakeTx3.transaction.hash,
        ])

        const savedTxHashes = await indexerCacheService.upsertTxHashes()
        const caches = await getConnection()
          .getRepository(IndexerTxHashCache)
          .find()
        expect(caches).toHaveLength(3)

        expect(stubbedGetTransactionFn).toHaveBeenCalledTimes(0)
        expect(stubbedGetHeaderFn).toHaveBeenCalledTimes(0)
        expect(savedTxHashes).toEqual([])
      });
    });
  });
  describe('#updateProcessedTxHashes', () => {
    beforeEach(async () => {
      stubbedGetTransactionsByLockScriptFn.mockReturnValueOnce([
        fakeTx1.transaction.hash,
        fakeTx2.transaction.hash,
        fakeTx3.transaction.hash,
      ])
      stubbedGetTransactionFn.mockReturnValueOnce(fakeTx1)
      stubbedGetTransactionFn.mockReturnValueOnce(fakeTx2)
      stubbedGetTransactionFn.mockReturnValueOnce(fakeTx3)
      stubbedGetHeaderFn.mockReturnValueOnce(fakeBlock1)
      stubbedGetHeaderFn.mockReturnValueOnce(fakeBlock2)
      stubbedGetHeaderFn.mockReturnValueOnce(fakeBlock2)

      await indexerCacheService.upsertTxHashes()
      await indexerCacheService.updateProcessedTxHashes(fakeBlock2.number)
    });

    it('updates isProcessed by block number', async () => {
      const caches = await getConnection()
        .getRepository(IndexerTxHashCache)
        .find()
      const cachesByBlock2 = caches.filter(cache => cache.isProcessed && cache.blockNumber === fakeBlock2.number)
      expect(cachesByBlock2).toHaveLength(2)
    })
  });
  describe('#nextUnprocessedTxsGroupedByBlockNumber', () => {
    describe('when there are caches', () => {
      beforeEach(async () => {
        stubbedGetTransactionsByLockScriptFn.mockReturnValueOnce([
          fakeTx1.transaction.hash,
          fakeTx2.transaction.hash,
          fakeTx3.transaction.hash,
        ])
        stubbedGetTransactionFn.mockReturnValueOnce(fakeTx1)
        stubbedGetTransactionFn.mockReturnValueOnce(fakeTx2)
        stubbedGetTransactionFn.mockReturnValueOnce(fakeTx3)
        stubbedGetHeaderFn.mockReturnValueOnce(fakeBlock1)
        stubbedGetHeaderFn.mockReturnValueOnce(fakeBlock2)
        stubbedGetHeaderFn.mockReturnValueOnce(fakeBlock2)

        await indexerCacheService.upsertTxHashes()
      });
      describe('with all unprocessed transactions', () => {
        it('returns the tx hashes for the next block number', async () => {
          const txHashes = await indexerCacheService.nextUnprocessedTxsGroupedByBlockNumber()
          expect(txHashes).toHaveLength(1)
          expect(txHashes![0].blockNumber).toEqual(fakeBlock1.number)
        });
      });
      describe('with some processed transactions', () => {
        beforeEach(async () => {
          await getConnection()
            .createQueryBuilder()
            .update(IndexerTxHashCache)
            .where({
              blockNumber: fakeBlock1.number
            })
            .set({
              isProcessed: true
            })
            .execute()
        })
        it('returns the tx hashes for the next block number', async () => {
          const txHashes = await indexerCacheService.nextUnprocessedTxsGroupedByBlockNumber()
          expect(txHashes).toHaveLength(2)
          expect(txHashes![0].blockNumber).toEqual(fakeBlock2.number)
        });
      });
    });
    describe('when all transactions are processed', () => {
      beforeEach(async () => {
        stubbedGetTransactionsByLockScriptFn.mockReturnValueOnce([
          fakeTx1.transaction.hash,
          fakeTx2.transaction.hash,
          fakeTx3.transaction.hash,
        ])
        stubbedGetTransactionFn.mockReturnValueOnce(fakeTx1)
        stubbedGetTransactionFn.mockReturnValueOnce(fakeTx2)
        stubbedGetTransactionFn.mockReturnValueOnce(fakeTx3)
        stubbedGetHeaderFn.mockReturnValueOnce(fakeBlock1)
        stubbedGetHeaderFn.mockReturnValueOnce(fakeBlock2)
        stubbedGetHeaderFn.mockReturnValueOnce(fakeBlock2)

        await indexerCacheService.upsertTxHashes()
        await getConnection()
          .createQueryBuilder()
          .update(IndexerTxHashCache)
          .set({
            isProcessed: true
          })
          .execute()
      });
      it('returns empty array when no unprocessed transactions', async () => {
        const txHashes = await indexerCacheService.nextUnprocessedTxsGroupedByBlockNumber()
        expect(txHashes).toEqual([])
      });
    });
  });
})
