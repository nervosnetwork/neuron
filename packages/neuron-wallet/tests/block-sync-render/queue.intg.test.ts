import { when } from 'jest-when'
import { getConnection } from 'typeorm'
import { initConnection } from '../../src/database/chain/ormconfig'
import AddressMeta from '../../src/database/address/meta';
import { Address, AddressVersion } from '../../src/models/address';
import {default as TransactionEntity} from '../../src/database/chain/entities/transaction';
import {default as InputEntity} from '../../src/database/chain/entities/input';
import {default as OutputEntity} from '../../src/database/chain/entities/output';
import IndexerTxHashCache from '../../src/database/chain/entities/indexer-tx-hash-cache';
import SudtTokenInfoEntity from "../../src/database/chain/entities/sudt-token-info"
import AssetAccountEntity from "../../src/database/chain/entities/asset-account"
import AddressGenerator from '../../src/models/address-generator';
import SystemScriptInfo from '../../src/models/system-script-info';
import AssetAccountInfo from '../../src/models/asset-account-info';
import { AddressPrefix, AddressType } from '../../src/models/keys/address';
import { flushPromises } from '../test-utils'
import Input from '../../src/models/chain/input';
import OutPoint from '../../src/models/chain/out-point';
import Output from '../../src/models/chain/output';
import Transaction from '../../src/models/chain/transaction';
import Script from '../../src/models/chain/script';

describe('integration tests for sync pipeline', () => {
  const fakeNodeUrl = 'http://fakenode:8114'
  const fakeGenesisHash = 'fakegenesishash'
  const pubkeyInBlake160 = '0x36c329ed630d6ce750712a477543672adab57f4c'
  const shortAddressInfo = {
    lock: SystemScriptInfo.generateSecpScript(pubkeyInBlake160),
  }
  const address = AddressGenerator.toShort(shortAddressInfo.lock, AddressPrefix.Testnet)
  const fakeWalletId = 'w1'
  const addressInfo: Address = {
    address,
    blake160: shortAddressInfo.lock.args,
    walletId: fakeWalletId,
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

  const generateTxWithStatus = (
    id: string,
    block: any,
    lock: Script = script,
    type: Script | undefined,
    outputsData: string[] | undefined
  ) => {
    const inputs = [
      Input.fromObject({
        previousOutput: new OutPoint('0x' + (parseInt(id) - 1).toString().repeat(64), '0'),
        since: ''
      })
    ]
    const outputs = [
      Output.fromObject({
        capacity: '1',
        lock,
        type
      })
    ]

    return {
      transaction: Transaction.fromObject({
        version: '',
        hash: '0x' + id.repeat(64),
        blockNumber: block.number,
        timestamp: block.timestamp.toString(),
        inputs,
        outputs,
        outputsData
      }),
      txStatus: {status: 'committed', blockHash: block.hash}
    }
  }

  const assetAccountInfo = new AssetAccountInfo()

  const fakeBlock1 = {number: '1', hash: '1', timestamp: '1'}

  const fakeTx1 = generateTxWithStatus(
    '1',
    fakeBlock1,
    undefined,
    SystemScriptInfo.generateDaoScript(),
    ['0x0000000000000000'],
  )
  const fakeTx2 = generateTxWithStatus('2', fakeBlock1, undefined, undefined, undefined)
  const fakeTx3 = generateTxWithStatus(
    '3',
    fakeBlock1,
    addressMeta.generateACPLockScript(),
    assetAccountInfo.generateSudtScript('0xargs'),
    undefined
  )

  const fakeTxs = [fakeTx1, fakeTx2, fakeTx3]

  let queue: any

  const stubbedGetTransactionFn = jest.fn()
  const stubbedGetHeaderFn = jest.fn()
  const stubbedGenesisBlockHashFn = jest.fn()
  const stubbedGetTransactionsByLockScriptFn = jest.fn()
  const stubbedCheckAndGenerateAddressesFn = jest.fn()
  const stubbedCellCollectorConstructor = jest.fn()

  const resetMocks = () => {
    stubbedGetTransactionFn.mockReset()
    stubbedGetHeaderFn.mockReset()
    stubbedGetTransactionsByLockScriptFn.mockReset()
    stubbedCheckAndGenerateAddressesFn.mockReset()
  }

  let stubbedIndexerConstructor: any
  let stubbedTransactionCollectorConstructor: any
  let stubbedRPCServiceConstructor: any

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

    jest.mock('services/networks', () => {
      return {
        getInstance: () => ({
          isMainnet: () => false,
          getCurrent: () => ({
            genesisHash: fakeGenesisHash
          })
        }),
      }
    })

    stubbedGenesisBlockHashFn.mockResolvedValue(fakeGenesisHash)

    when(stubbedGetTransactionFn)
      .calledWith(fakeTx1.transaction.hash).mockResolvedValue(fakeTx1)
      .calledWith(fakeTx2.transaction.hash).mockResolvedValue(fakeTx2)
      .calledWith(fakeTx3.transaction.hash).mockResolvedValue(fakeTx3)
      .calledWith(fakeTx2.transaction.inputs[0]!.previousOutput!.txHash).mockResolvedValue(fakeTx1)
      .calledWith(fakeTx3.transaction.inputs[0]!.previousOutput!.txHash).mockResolvedValue(fakeTx2)

    when(stubbedGetHeaderFn).calledWith(fakeBlock1.hash).mockReturnValue(fakeBlock1)

    when(stubbedCellCollectorConstructor)
      .calledWith(expect.anything())
      .mockReturnValue({
        collect: () => {
          return {
            [Symbol.asyncIterator]: () => {
              return {
                next: async () => {
                  return {done: true}
                }
              }
            }
          }
        }
      })

    stubbedIndexerConstructor = jest.fn().mockImplementation(
      () => ({
        startForever: stubbedStartForeverFn,
        tip: stubbedTipFn,
      })
    )
    stubbedTransactionCollectorConstructor = jest.fn().mockImplementation(
      () => ({
        getTransactionHashes: stubbedGetTransactionsByLockScriptFn,
      })
    )
    stubbedRPCServiceConstructor = jest.fn().mockImplementation(
      () => ({
        getTransaction: stubbedGetTransactionFn,
        getHeader: stubbedGetHeaderFn,
        genesisBlockHash: stubbedGenesisBlockHashFn
      })
    )

    jest.doMock('@nervina-labs/ckb-indexer', () => {
      return {
        CkbIndexer : stubbedIndexerConstructor,
        TransactionCollector : stubbedTransactionCollectorConstructor,
        CellCollector : stubbedCellCollectorConstructor
      }
    });

    jest.doMock('services/rpc-service', () => {
      return stubbedRPCServiceConstructor
    });

    jest.doMock('services/wallets', () => ({
      getInstance: () => ({
        get: () => ({
          checkAndGenerateAddresses: stubbedCheckAndGenerateAddressesFn
        })
      }),
    }));

    const Queue = require('../../src/block-sync-renderer/sync/queue').default
    queue = new Queue(fakeNodeUrl, addresses)
  })
  afterEach(() => {
    jest.clearAllTimers()
  });

  describe('when there are unprocessed tx hashes at queue startup', () => {
    beforeEach(async () => {
      for (const tx of fakeTxs) {
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

      stubbedGetTransactionsByLockScriptFn
        .mockReturnValue([])

      stubbedTipFn.mockResolvedValue({block_number: '1'})
      queue.start()
      await flushPromises()
      await queue.waitForDrained()
    });
    it('inserts new transactions', async () => {
      const txs = await getConnection()
        .getRepository(TransactionEntity)
        .find()

      console.log(txs)
      expect(txs).toHaveLength(fakeTxs.length)
      for (const fakeTx of fakeTxs) {
        expect(txs.filter(tx => tx.hash === fakeTx.transaction.hash)).toHaveLength(1)
      }
    });
    it('inserts related inputs', async () => {
      const inputs = await getConnection()
        .getRepository(InputEntity)
        .find()
      expect(inputs).toHaveLength(fakeTxs.length)
      for (const fakeTx of fakeTxs) {
        expect(inputs.filter(input => input.transactionHash === fakeTx.transaction.hash)).toHaveLength(1)
      }
    })
    it('inserts ACP sUDT token info', async () => {
      const tokenInfos = await getConnection()
        .getRepository(SudtTokenInfoEntity)
        .find()

      expect(tokenInfos.filter(t => t.tokenID === '0xargs')).toHaveLength(1)
    })
    it('inserts asset accounts', async () => {
      const assetAccounts = await getConnection()
        .getRepository(AssetAccountEntity)
        .find()

      expect(assetAccounts.filter(a => a.tokenID === '0xargs')).toHaveLength(1)
    })
    it('updates tx hash cache is_processed', async () => {
      const caches = await getConnection()
        .getRepository(IndexerTxHashCache)
        .find()

      expect(caches).toHaveLength(3)
      for (const fakeTx of fakeTxs) {
        expect(caches.filter(cache => cache.txHash === fakeTx.transaction.hash && cache.isProcessed)).toHaveLength(1)
      }
    });
    it('checks and generates new addresses', () => {
      expect(stubbedCheckAndGenerateAddressesFn).toHaveBeenCalledTimes(fakeTxs.length)
    });
    describe('inserts related outputs', () => {
      let outputs: OutputEntity[] = []
      beforeEach(async () => {
        outputs = await getConnection()
          .getRepository(OutputEntity)
          .find()
      });
      it('inserts related outputs', async () => {
        expect(outputs).toHaveLength(fakeTxs.length)
        for (const fakeTx of fakeTxs) {
          expect(outputs.filter(output => output.outPointTxHash === fakeTx.transaction.hash)).toHaveLength(1)
        }
      })
      it('sets deposit tx hash in an output', async () => {
        const daoRelatedOutputs = outputs.filter(output => output.depositTxHash)
        expect(daoRelatedOutputs).toHaveLength(1)
        expect(daoRelatedOutputs[0].depositTxHash).toEqual(fakeTx1.transaction.hash)
        expect(daoRelatedOutputs[0].outPointTxHash).toEqual(fakeTx2.transaction.hash)
      })
    });
  });
  describe('when there are new tx hashes found in a poll', () => {
    beforeEach(async () => {
      stubbedGetTransactionsByLockScriptFn
        .mockReturnValue(fakeTxs.map(tx => tx.transaction.hash))

      queue.start()
      await flushPromises()
      await queue.waitForDrained()
    });
    it('inserts new transactions', async () => {
      const txs = await getConnection()
        .getRepository(TransactionEntity)
        .find()
      expect(txs).toHaveLength(fakeTxs.length)
      for (const fakeTx of fakeTxs) {
        expect(txs.filter(tx => tx.hash === fakeTx.transaction.hash)).toHaveLength(1)
      }
    });
    it('inserts related inputs', async () => {
      const inputs = await getConnection()
        .getRepository(InputEntity)
        .find()
      expect(inputs).toHaveLength(fakeTxs.length)
      for (const fakeTx of fakeTxs) {
        expect(inputs.filter(input => input.transactionHash === fakeTx.transaction.hash)).toHaveLength(1)
      }
    })
    it('inserts ACP sUDT token info', async () => {
      const tokenInfos = await getConnection()
        .getRepository(SudtTokenInfoEntity)
        .find()

      expect(tokenInfos.filter(t => t.tokenID === '0xargs')).toHaveLength(1)
    })
    it('inserts asset accounts', async () => {
      const assetAccounts = await getConnection()
        .getRepository(AssetAccountEntity)
        .find()

      expect(assetAccounts.filter(a => a.tokenID === '0xargs')).toHaveLength(1)
    })
    it('updates tx hash cache is_processed', async () => {
      const caches = await getConnection()
        .getRepository(IndexerTxHashCache)
        .find()

      expect(caches).toHaveLength(3)
      for (const fakeTx of fakeTxs) {
        expect(caches.filter(cache => cache.txHash === fakeTx.transaction.hash && cache.isProcessed)).toHaveLength(1)
      }
    });
    it('checks and generates new addresses', () => {
      expect(stubbedCheckAndGenerateAddressesFn).toHaveBeenCalledTimes(fakeTxs.length)
    });
    describe('handles outputs', () => {
      let outputs: OutputEntity[] = []
      beforeEach(async () => {
        outputs = await getConnection()
          .getRepository(OutputEntity)
          .find()
      });
      it('inserts related outputs', async () => {
        expect(outputs).toHaveLength(fakeTxs.length)
        for (const fakeTx of fakeTxs) {
          expect(outputs.filter(output => output.outPointTxHash === fakeTx.transaction.hash)).toHaveLength(1)
        }
      })
      it('sets deposit tx hash in an output', async () => {
        const daoRelatedOutputs = outputs.filter(output => output.depositTxHash)
        expect(daoRelatedOutputs).toHaveLength(1)
        expect(daoRelatedOutputs[0].depositTxHash).toEqual(fakeTx1.transaction.hash)
        expect(daoRelatedOutputs[0].outPointTxHash).toEqual(fakeTx2.transaction.hash)
      })
    });
  });
})
