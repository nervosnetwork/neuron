import { when } from 'jest-when'
import { getConnection } from 'typeorm'
import { initConnection } from '../../src/database/chain/ormconfig'
// import IndexerCacheService from '../../src/block-sync-renderer/sync/indexer-cache-service';
import AddressMeta from '../../src/database/address/meta';
import { AddressType } from '../../src/models/keys/address';
import { AddressVersion } from '../../src/database/address/address-dao';
import IndexerTxHashCache from '../../src/database/chain/entities/indexer-tx-hash-cache';
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

const stubbedTransactionCollectorConstructor = jest.fn()

const resetMocks = () => {
  stubbedGetTransactionFn.mockReset()
  stubbedGetHeaderFn.mockReset()
  stubbedGetTransactionsByLockScriptFn.mockReset()
}

describe('indexer cache service', () => {
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
  const acpLockScript = addressMeta.generateACPLockScript()
  const formattedDefaultLockScript = {
    code_hash: defaultLockScript.codeHash,
    hash_type: defaultLockScript.hashType,
    args: defaultLockScript.args
  }
  const formattedSingleMultiSignLockScript = {
    code_hash: singleMultiSignLockScript.codeHash,
    hash_type: singleMultiSignLockScript.hashType,
    args: singleMultiSignLockScript.args
  }
  const formattedAcpLockScript = {
    code_hash: acpLockScript.codeHash,
    hash_type: acpLockScript.hashType,
    args: acpLockScript.args
  }

  const mockGetTransactionHashes = (mocks: any[]) => {
    const stubbedConstructor = when(stubbedTransactionCollectorConstructor)
    for (const mock of mocks) {
      const {lock, hashes} = mock
      stubbedConstructor
        .calledWith(expect.anything(), {lock})
        .mockReturnValue({
          get_transaction_hashes: jest.fn().mockReturnValue({
            toArray: () => hashes
          }),
        })
    }
  }

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

    jest.doMock('@ckb-lumos/indexer', () => {
      return {
        Indexer : stubbedIndexerConstructor,
        TransactionCollector : stubbedTransactionCollectorConstructor
      }
    });

    rpcService = new stubbedRPCServiceConstructor()
    IndexerCacheService = require('../../src/block-sync-renderer/sync/indexer-cache-service').default
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
        mockGetTransactionHashes([
          {
            lock: formattedDefaultLockScript,
            hashes: [
              fakeTx1.transaction.hash,
              fakeTx3.transaction.hash,
            ]
          },
          {
            lock: formattedSingleMultiSignLockScript,
            hashes: []
          },
          {
            lock: formattedAcpLockScript,
            hashes: []
          }
        ])
        when(stubbedGetTransactionFn)
          .calledWith(fakeTx1.transaction.hash).mockReturnValueOnce(fakeTx1)
          .calledWith(fakeTx3.transaction.hash).mockReturnValueOnce(fakeTx3)
        when(stubbedGetHeaderFn)
          .calledWith(fakeBlock1.hash).mockReturnValueOnce(fakeBlock1)
          .calledWith(fakeBlock2.hash).mockReturnValueOnce(fakeBlock2)

        initTxHashes = await indexerCacheService.upsertTxHashes()
      });
      it('returns newly cached tx hashes', () => {
        expect(initTxHashes).toEqual([txHashes[0], txHashes[2]])
      })
      describe('when no tx hashes cache exists', () => {
        it('saves all tx hashes', async () => {
          const caches = await getConnection()
            .getRepository(IndexerTxHashCache)
            .find()
          expect(caches).toHaveLength(2)
          expect(caches.filter(cache => cache.txHash === txHashes[0])).toHaveLength(1)
          expect(caches.filter(cache => cache.txHash === txHashes[2])).toHaveLength(1)
        });
      });
      describe('when new tx hash available', () => {
        beforeEach(async () => {
          mockGetTransactionHashes([
            {
              lock: formattedDefaultLockScript,
              hashes: [
                fakeTx1.transaction.hash,
                fakeTx2.transaction.hash,
                fakeTx3.transaction.hash,
              ]
            },
            {
              lock: formattedSingleMultiSignLockScript,
              hashes: []
            },
            {
              lock: formattedAcpLockScript,
              hashes: []
            }
          ])
          when(stubbedGetTransactionFn)
            .calledWith(fakeTx2.transaction.hash)
            .mockReturnValueOnce(fakeTx2)
          when(stubbedGetHeaderFn)
            .calledWith(fakeBlock2.hash)
            .mockReturnValueOnce(fakeBlock2)

          await indexerCacheService.upsertTxHashes()
        });
        it('saves the new ones', async () => {
          const caches = await getConnection()
            .getRepository(IndexerTxHashCache)
            .find()
          expect(caches).toHaveLength(3)
          expect(caches.filter(cache => cache.txHash === txHashes[0])).toHaveLength(1)
          expect(caches.filter(cache => cache.txHash === txHashes[1])).toHaveLength(1)
          expect(caches.filter(cache => cache.txHash === txHashes[2])).toHaveLength(1)
        });
      });
      describe('when all of tx hashes cache exists', () => {
        beforeEach(async () => {
          resetMocks()
          mockGetTransactionHashes([
            {
              lock: formattedDefaultLockScript,
              hashes: [
                fakeTx1.transaction.hash,
                fakeTx3.transaction.hash,
              ]
            },
            {
              lock: formattedSingleMultiSignLockScript,
              hashes: []
            },
            {
              lock: formattedAcpLockScript,
              hashes: []
            }
          ])

          await indexerCacheService.upsertTxHashes()
        });
        it('should not do any new inserts', async () => {
          const caches = await getConnection()
            .getRepository(IndexerTxHashCache)
            .find()
          expect(caches).toHaveLength(2)

          expect(stubbedGetTransactionFn).toHaveBeenCalledTimes(0)
          expect(stubbedGetHeaderFn).toHaveBeenCalledTimes(0)
        });
      });
    });
  });
  describe('#updateProcessedTxHashes', () => {
    beforeEach(async () => {
      mockGetTransactionHashes([
        {
          lock: formattedDefaultLockScript,
          hashes: [
            fakeTx1.transaction.hash,
            fakeTx2.transaction.hash,
            fakeTx3.transaction.hash,
          ]
        },
        {
          lock: formattedSingleMultiSignLockScript,
          hashes: []
        },
        {
          lock: formattedAcpLockScript,
          hashes: []
        }
      ])
      when(stubbedGetTransactionFn)
        .calledWith(fakeTx1.transaction.hash).mockReturnValueOnce(fakeTx1)
        .calledWith(fakeTx2.transaction.hash).mockReturnValueOnce(fakeTx2)
        .calledWith(fakeTx3.transaction.hash).mockReturnValueOnce(fakeTx3)
      when(stubbedGetHeaderFn)
        .calledWith(fakeBlock1.hash).mockReturnValueOnce(fakeBlock1)
        .calledWith(fakeBlock2.hash).mockReturnValue(fakeBlock2)

      await indexerCacheService.upsertTxHashes()
      await indexerCacheService.updateProcessedTxHashes(fakeBlock2.number)
    });

    it('updates isProcessed by block number', async () => {
      const caches = await getConnection()
        .getRepository(IndexerTxHashCache)
        .find()
      const cachesByBlock2 = caches.filter(cache => cache.isProcessed && cache.blockNumber === parseInt(fakeBlock2.number))
      expect(cachesByBlock2).toHaveLength(2)
    })
  });
  describe('#nextUnprocessedTxsGroupedByBlockNumber', () => {
    describe('when there are caches', () => {
      beforeEach(async () => {
        mockGetTransactionHashes([
          {
            lock: formattedDefaultLockScript,
            hashes: [
              fakeTx1.transaction.hash,
              fakeTx2.transaction.hash,
              fakeTx3.transaction.hash,
            ]
          },
          {
            lock: formattedSingleMultiSignLockScript,
            hashes: []
          },
          {
            lock: formattedAcpLockScript,
            hashes: []
          }
        ])
        when(stubbedGetTransactionFn)
          .calledWith(fakeTx1.transaction.hash).mockReturnValueOnce(fakeTx1)
          .calledWith(fakeTx2.transaction.hash).mockReturnValueOnce(fakeTx2)
          .calledWith(fakeTx3.transaction.hash).mockReturnValueOnce(fakeTx3)
        when(stubbedGetHeaderFn)
          .calledWith(fakeBlock1.hash).mockReturnValueOnce(fakeBlock1)
          .calledWith(fakeBlock2.hash).mockReturnValue(fakeBlock2)

        await indexerCacheService.upsertTxHashes()
      });
      describe('with all unprocessed transactions', () => {
        it('returns the tx hashes for the next block number', async () => {
          const txHashes = await indexerCacheService.nextUnprocessedTxsGroupedByBlockNumber()
          expect(txHashes).toHaveLength(1)
          expect(txHashes![0].blockNumber).toEqual(parseInt(fakeBlock1.number))
        });
      });
      describe('with some blocks has been fully processed', () => {
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
          expect(txHashes![0].blockNumber).toEqual(parseInt(fakeBlock2.number))
        });
        describe('when some transactions has been partially processed in a block', () => {
          beforeEach(async () => {
            await getConnection()
              .createQueryBuilder()
              .update(IndexerTxHashCache)
              .where({
                txHash: fakeTx2.transaction.hash
              })
              .set({
                isProcessed: true
              })
              .execute()
          })
          it('returns the unprocessed tx hash in the next block number', async () => {
            const txHashes = await indexerCacheService.nextUnprocessedTxsGroupedByBlockNumber()
            expect(txHashes).toHaveLength(1)
            expect(txHashes![0].blockNumber).toEqual(parseInt(fakeBlock2.number))
            expect(txHashes![0].txHash).toEqual(fakeTx3.transaction.hash)
          });
        });
      });
    });
    describe('when all transactions are processed', () => {
      beforeEach(async () => {
        mockGetTransactionHashes([
          {
            lock: formattedDefaultLockScript,
            hashes: [
              fakeTx1.transaction.hash,
              fakeTx2.transaction.hash,
              fakeTx3.transaction.hash,
            ]
          },
          {
            lock: formattedSingleMultiSignLockScript,
            hashes: []
          },
          {
            lock: formattedAcpLockScript,
            hashes: []
          }
        ])
        when(stubbedGetTransactionFn)
          .calledWith(fakeTx1.transaction.hash).mockReturnValueOnce(fakeTx1)
          .calledWith(fakeTx2.transaction.hash).mockReturnValueOnce(fakeTx2)
          .calledWith(fakeTx3.transaction.hash).mockReturnValueOnce(fakeTx3)
        when(stubbedGetHeaderFn)
          .calledWith(fakeBlock1.hash).mockReturnValueOnce(fakeBlock1)
          .calledWith(fakeBlock2.hash).mockReturnValue(fakeBlock2)

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
  describe('#nextUnprocessedBlock', () => {
    beforeEach(async () => {
      mockGetTransactionHashes([
        {
          lock: formattedDefaultLockScript,
          hashes: [
            fakeTx1.transaction.hash,
          ]
        },
        {
          lock: formattedSingleMultiSignLockScript,
          hashes: []
        },
        {
          lock: formattedAcpLockScript,
          hashes: []
        }
      ])
      when(stubbedGetTransactionFn)
        .calledWith(fakeTx1.transaction.hash).mockReturnValueOnce(fakeTx1)
      when(stubbedGetHeaderFn)
        .calledWith(fakeBlock1.hash).mockReturnValueOnce(fakeBlock1)

      await indexerCacheService.upsertTxHashes()
    });
    describe('when has unprocessed blocks', () => {
      it('returns next unprocessed block number', async () => {
        const nextUnprocessedBlock = await IndexerCacheService.nextUnprocessedBlock()
        expect(nextUnprocessedBlock).toEqual({
          blockNumber: fakeBlock1.number, blockHash: fakeBlock1.hash
        })
      });
    });
    describe('when has no unprocessed blocks', () => {
      beforeEach(async () => {
        await getConnection()
          .createQueryBuilder()
          .update(IndexerTxHashCache)
          .set({
            isProcessed: true
          })
          .execute()
      });
      it('returns undefined', async () => {
        const nextUnprocessedBlock = await IndexerCacheService.nextUnprocessedBlock()
        expect(nextUnprocessedBlock).toEqual(undefined)
      });
    });
  });
  describe('#updateCacheProcessed', () => {
    describe('when there are unprocessed tx hash cache', () => {
      beforeEach(async () => {
        mockGetTransactionHashes([
          {
            lock: formattedDefaultLockScript,
            hashes: [
              fakeTx1.transaction.hash,
              fakeTx2.transaction.hash,
              fakeTx3.transaction.hash,
            ]
          },
          {
            lock: formattedSingleMultiSignLockScript,
            hashes: []
          },
          {
            lock: formattedAcpLockScript,
            hashes: []
          }
        ])
        when(stubbedGetTransactionFn)
          .calledWith(fakeTx1.transaction.hash).mockReturnValueOnce(fakeTx1)
          .calledWith(fakeTx2.transaction.hash).mockReturnValueOnce(fakeTx2)
          .calledWith(fakeTx3.transaction.hash).mockReturnValueOnce(fakeTx3)
        when(stubbedGetHeaderFn)
          .calledWith(fakeBlock1.hash).mockReturnValueOnce(fakeBlock1)
          .calledWith(fakeBlock2.hash).mockReturnValue(fakeBlock2)

        await indexerCacheService.upsertTxHashes()

        const caches = await getConnection()
          .getRepository(IndexerTxHashCache)
          .find()
        const processedCaches = caches.filter(cache => !cache.isProcessed)
        expect(processedCaches).toHaveLength(3)

        for (const hash of [
          fakeTx1.transaction.hash,
          fakeTx3.transaction.hash,
        ]) {
          await IndexerCacheService.updateCacheProcessed(hash)
        }
      });
      it('updates isProcessed to be true', async () => {
        const caches = await getConnection()
          .getRepository(IndexerTxHashCache)
          .find()
        const processedCaches = caches.filter(cache => cache.isProcessed)
        expect(processedCaches).toHaveLength(2)
        expect(processedCaches.filter(cache => cache.txHash === fakeTx1.transaction.hash)).toHaveLength(1)
        expect(processedCaches.filter(cache => cache.txHash === fakeTx3.transaction.hash)).toHaveLength(1)
      });
    });
  });
})
