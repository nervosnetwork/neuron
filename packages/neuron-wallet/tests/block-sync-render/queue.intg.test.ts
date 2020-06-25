import { when } from 'jest-when'
import { getConnection } from 'typeorm'
import { initConnection } from '../../src/database/chain/ormconfig'
import AddressGenerator from '../../src/models/address-generator';
import SystemScriptInfo from '../../src/models/system-script-info';
import { AddressPrefix, AddressType } from '../../src/models/keys/address';
import { Address, AddressVersion } from '../../src/database/address/address-dao';
import { flushPromises } from '../test-utils'
import AddressMeta from '../../src/database/address/meta';
import Input from '../../src/models/chain/input';
import OutPoint from '../../src/models/chain/out-point';
import Output from '../../src/models/chain/output';
import Transaction from '../../src/models/chain/transaction';
import {default as TransactionEntity} from '../../src/database/chain/entities/transaction';
import {default as InputEntity} from '../../src/database/chain/entities/input';
import {default as OutputEntity} from '../../src/database/chain/entities/output';
import IndexerTxHashCache from '../../src/database/chain/entities/indexer-tx-hash-cache';

const stubbedGetTransactionFn = jest.fn()
const stubbedGetHeaderFn = jest.fn()
const stubbedGenesisBlockHashFn = jest.fn()
const stubbedGetTransactionsByLockScriptFn = jest.fn()

const stubbedRPCServiceConstructor = jest.fn().mockImplementation(
  () => ({
    getTransaction: stubbedGetTransactionFn,
    getHeader: stubbedGetHeaderFn,
    genesisBlockHash: stubbedGenesisBlockHashFn
  })
)

const resetMocks = () => {
  stubbedGetTransactionFn.mockReset()
  stubbedGetHeaderFn.mockReset()
  stubbedGetTransactionsByLockScriptFn.mockReset()
}

describe('integration tests for sync pipeline', () => {
  const fakeNodeUrl = 'http://fakenode:8114'
  const fakeGenesisHash = 'fakegenesishash'
  const shortAddressInfo = {
    lock: SystemScriptInfo.generateSecpScript('0x36c329ed630d6ce750712a477543672adab57f4c'),
  }
  const address = AddressGenerator.toShort(shortAddressInfo.lock, AddressPrefix.Testnet)
  const addressInfo: Address = {
    address,
    blake160: shortAddressInfo.lock.args,
    walletId: '',
    path: '',
    addressType: AddressType.Receiving,
    addressIndex: 0,
    txCount: 0,
    liveBalance: '',
    sentBalance: '',
    pendingBalance: '',
    balance: '',
    version: AddressVersion.Testnet
  }
  const addresses = [addressInfo]

  const addressMeta = AddressMeta.fromObject(addressInfo)
  const script = addressMeta.generateDefaultLockScript()
  const formattedScript = {
    code_hash: script.codeHash,
    hash_type: script.hashType,
    args: script.args
  }

  const generateTxWithStatus = (id: string, block: any) => {
    const inputs = [
      Input.fromObject({
        previousOutput: new OutPoint('0x' + id.repeat(64), '0'),
        since: ''
      })
    ]
    const outputs = [
      Output.fromObject({
        capacity: '1',
        lock: script
      })
    ]

    return {
      transaction: Transaction.fromObject({
        version: '',
        hash: `hash${id}`,
        blockNumber: block.number,
        timestamp: block.timestamp.toString(),
        inputs,
        outputs
      }),
      txStatus: {status: 'committed', blockHash: block.hash}
    }
  }

  const fakeBlock1 = {number: '1', hash: '1', timestamp: '1'}

  const fakeTx1 = generateTxWithStatus('1', fakeBlock1)
  const fakeTx2 = generateTxWithStatus('2', fakeBlock1)

  let queue: any

  let stubbedIndexerConstructor: any
  const stubbedStartForeverFn = jest.fn()
  const stubbedTipFn = jest.fn()

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
    jest.useFakeTimers()

    stubbedGenesisBlockHashFn.mockResolvedValue(fakeGenesisHash)

    when(stubbedGetTransactionFn)
        .calledWith(fakeTx1.transaction.hash)
        .mockReturnValue(fakeTx1)
      when(stubbedGetTransactionFn)
        .calledWith(fakeTx2.transaction.hash)
        .mockReturnValue(fakeTx2)
      when(stubbedGetHeaderFn)
        .calledWith(fakeBlock1.hash)
        .mockReturnValue(fakeBlock1)

    stubbedIndexerConstructor = jest.fn().mockImplementation(
      () => ({
        getTransactionsByLockScript: stubbedGetTransactionsByLockScriptFn,
        startForever: stubbedStartForeverFn,
        tip: stubbedTipFn,
      })
    )

    jest.doMock('@ckb-lumos/indexer', () => {
      return {
        Indexer : stubbedIndexerConstructor
      }
    });

    jest.doMock('services/rpc-service', () => {
      return stubbedRPCServiceConstructor
    });

    const Queue = require('../../src/block-sync-renderer/sync/queue').default
    queue = new Queue(fakeNodeUrl, addresses)
  })
  afterEach(() => {
    jest.clearAllTimers()
  });

  describe('when there are unprocessed tx hashes at queue startup', () => {
    beforeEach(async () => {
      for (const tx of [fakeTx1, fakeTx2]) {
        await getConnection()
          .createQueryBuilder()
          .insert()
          .into(IndexerTxHashCache)
          .values({
            txHash: tx.transaction.hash,
            blockNumber: parseInt(tx.transaction.blockNumber!),
            blockHash: tx.txStatus.blockHash!,
            blockTimestamp: tx.transaction.timestamp,
            lockHash: shortAddressInfo.lock.computeHash(),
            address,
            walletId: addressInfo.walletId,
            isProcessed: false
          })
          .execute()
      }

      queue.start()
      await flushPromises()
      await queue.waitForDrained()
    });
    it('inserts new transactions', async () => {
      const txs = await getConnection()
        .getRepository(TransactionEntity)
        .find()
      expect(txs).toHaveLength(2)
      expect(txs.filter(tx => tx.hash === fakeTx1.transaction.hash)).toHaveLength(1)
      expect(txs.filter(tx => tx.hash === fakeTx2.transaction.hash)).toHaveLength(1)
    });
    it('inserts related inputs', async () => {
      const inputs = await getConnection()
        .getRepository(InputEntity)
        .find()
      expect(inputs).toHaveLength(2)
      expect(inputs.filter(input => input.transactionHash === fakeTx1.transaction.hash)).toHaveLength(1)
      expect(inputs.filter(input => input.transactionHash === fakeTx2.transaction.hash)).toHaveLength(1)
    })
    it('inserts related outputs', async () => {
      const outputs = await getConnection()
        .getRepository(OutputEntity)
        .find()
      expect(outputs).toHaveLength(2)
      expect(outputs.filter(output => output.outPointTxHash === fakeTx1.transaction.hash)).toHaveLength(1)
      expect(outputs.filter(output => output.outPointTxHash === fakeTx2.transaction.hash)).toHaveLength(1)
    })
    it('updates tx hash cache is_processed', async () => {
      const caches = await getConnection()
        .getRepository(IndexerTxHashCache)
        .find()
      expect(caches).toHaveLength(2)
      expect(caches.filter(cache => cache.txHash === fakeTx1.transaction.hash && cache.isProcessed)).toHaveLength(1)
      expect(caches.filter(cache => cache.txHash === fakeTx2.transaction.hash && cache.isProcessed)).toHaveLength(1)
    });
  });
  describe('when there are new tx hashes found in a poll', () => {
    beforeEach(async () => {
      when(stubbedGetTransactionsByLockScriptFn)
        .calledWith(formattedScript).mockReturnValue([
          fakeTx1.transaction.hash,
          fakeTx2.transaction.hash,
        ])

      queue.start()
      await flushPromises()
      await queue.waitForDrained()
    });
    it('inserts new transactions', async () => {
      const txs = await getConnection()
        .getRepository(TransactionEntity)
        .find()
      expect(txs).toHaveLength(2)
      expect(txs.filter(tx => tx.hash === fakeTx1.transaction.hash)).toHaveLength(1)
      expect(txs.filter(tx => tx.hash === fakeTx2.transaction.hash)).toHaveLength(1)
    });
    it('inserts related inputs', async () => {
      const inputs = await getConnection()
        .getRepository(InputEntity)
        .find()
      expect(inputs).toHaveLength(2)
      expect(inputs.filter(input => input.transactionHash === fakeTx1.transaction.hash)).toHaveLength(1)
      expect(inputs.filter(input => input.transactionHash === fakeTx2.transaction.hash)).toHaveLength(1)
    })
    it('inserts related outputs', async () => {
      const outputs = await getConnection()
        .getRepository(OutputEntity)
        .find()
      expect(outputs).toHaveLength(2)
      expect(outputs.filter(output => output.outPointTxHash === fakeTx1.transaction.hash)).toHaveLength(1)
      expect(outputs.filter(output => output.outPointTxHash === fakeTx2.transaction.hash)).toHaveLength(1)
    })
    it('updates tx hash cache is_processed', async () => {
      const caches = await getConnection()
        .getRepository(IndexerTxHashCache)
        .find()
      expect(caches).toHaveLength(2)
      expect(caches.filter(cache => cache.txHash === fakeTx1.transaction.hash && cache.isProcessed)).toHaveLength(1)
      expect(caches.filter(cache => cache.txHash === fakeTx2.transaction.hash && cache.isProcessed)).toHaveLength(1)
    });
  });
})
