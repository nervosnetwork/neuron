import { Subject } from 'rxjs'
import { Tip } from '@ckb-lumos/indexer'
import { AddressType } from '../../src/models/keys/address'
import AddressGenerator from "../../src/models/address-generator"
import { AddressPrefix } from '../../src/models/keys/address'
import SystemScriptInfo from '../../src/models/system-script-info'
import TransactionWithStatus from '../../src/models/chain/transaction-with-status'
import {Address, AddressVersion} from '../../src/database/address/address-dao'
import Queue from '../../src/block-sync-renderer/sync/queue'
import Transaction from '../../src/models/chain/transaction'
import TxStatus, {TxStatusType} from '../../src/models/chain/tx-status'
import Input from '../../src/models/chain/input'
import Output from '../../src/models/chain/output'
import OutPoint from '../../src/models/chain/out-point'
import Script, {ScriptHashType} from '../../src/models/chain/script'
import { flushPromises } from '../test-utils'

const stubbedIndexerConnectorConstructor = jest.fn()
const stubbedTxAddressFinderConstructor = jest.fn()

const stubbedConnectFn = jest.fn()
const stubbedGetChainFn = jest.fn()
const stubbedGenesisBlockHashFn = jest.fn()
const stubbedGetTransactionFn = jest.fn()
const stubbedIpcRenderInvokeFn = jest.fn()
const stubbedAddressesFn = jest.fn()
const stubbedSaveFetchFn = jest.fn()
const stubbedUpdateUsedAddressesFn = jest.fn()
const stubbedNotifyCurrentBlockNumberProcessedFn = jest.fn()
const stubbedUpdateCacheProcessedFn = jest.fn()
const stubbedLoggerErrorFn = jest.fn()

const stubbedTxAddressFinder = jest.fn().mockImplementation(
  (...args) => {
    stubbedTxAddressFinderConstructor(...args)
    return {
      addresses: stubbedAddressesFn
    }
  }
)

const stubbedRPCServiceConstructor = jest.fn().mockImplementation(
  () => ({
    getChain: stubbedGetChainFn,
    getTransaction: stubbedGetTransactionFn,
    genesisBlockHash: stubbedGenesisBlockHashFn
  })
)

const resetMocks = () => {
  stubbedConnectFn.mockReset()
  stubbedGetChainFn.mockReset()
  stubbedGenesisBlockHashFn.mockReset()
  stubbedIndexerConnectorConstructor.mockReset()
  stubbedIpcRenderInvokeFn.mockReset()
  stubbedAddressesFn.mockReset()
  stubbedSaveFetchFn.mockReset()
  stubbedUpdateUsedAddressesFn.mockReset()
  stubbedGetTransactionFn.mockReset()
  stubbedNotifyCurrentBlockNumberProcessedFn.mockReset()
  stubbedUpdateCacheProcessedFn.mockReset()
  stubbedLoggerErrorFn.mockReset()
}

const generateFakeTx = (id: string) => {
  const fakeTx = new Transaction('')
  fakeTx.hash = 'hash1'
  fakeTx.inputs = [
    new Input(new OutPoint('0x' + id.repeat(64), '0'))
  ]
  fakeTx.outputs = [
    Output.fromObject({
      capacity: '1',
      lock: Script.fromObject(
        {hashType: ScriptHashType.Type, codeHash: '0x' + id.repeat(64), args: '0x'}
      )
    })
  ]
  fakeTx.blockNumber = '1'
  const fakeTxWithStatus = {
    transaction: fakeTx,
    txStatus: new TxStatus('0x' + id.repeat(64), TxStatusType.Committed)
  }
  return fakeTxWithStatus
}

describe('queue', () => {
  let queue: Queue
  const fakeNodeUrl = 'http://fakenode:8114'
  const fakeChain = 'ckb_test'
  const shortAddressInfo = {
    lock: SystemScriptInfo.generateSecpScript('0x36c329ed630d6ce750712a477543672adab57f4c'),
  }
  const address = AddressGenerator.toShort(shortAddressInfo.lock, AddressPrefix.Testnet)
  const addressInfo: Address = {
    address,
    blake160: '0xfakeblake160',
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

  let stubbedBlockTipSubject: any
  let stubbedTransactionsSubject: any

  beforeEach(async () => {
    resetMocks()
    jest.useFakeTimers()

    stubbedBlockTipSubject = new Subject<Tip>()
    stubbedTransactionsSubject = new Subject<Array<TransactionWithStatus>>()
    const stubbedIndexerConnector = jest.fn().mockImplementation(
      (...args) => {
        stubbedIndexerConnectorConstructor(...args)
        return {
          connect: stubbedConnectFn,
          blockTipSubject: stubbedBlockTipSubject,
          transactionsSubject: stubbedTransactionsSubject,
          notifyCurrentBlockNumberProcessed: stubbedNotifyCurrentBlockNumberProcessedFn,
        }
      }
    )
    jest.doMock('electron', () => {
      return {
        ipcRenderer: {
          invoke: stubbedIpcRenderInvokeFn
        }
      }
    });
    jest.doMock('services/rpc-service', () => {
      return stubbedRPCServiceConstructor
    });
    jest.doMock('services/tx', () => {
      return {
        TransactionPersistor: {
          saveFetchTx: stubbedSaveFetchFn
        }
      }
    });
    jest.doMock('services/wallets', () => {
      return {
        updateUsedAddresses: stubbedUpdateUsedAddressesFn
      }
    });
    jest.doMock('utils/logger', () => {
      return {error: stubbedLoggerErrorFn}
    });
    jest.doMock('../../src/block-sync-renderer/sync/indexer-connector', () => {
      return stubbedIndexerConnector
    });
    jest.doMock('../../src/block-sync-renderer/sync/tx-address-finder', () => {
      return stubbedTxAddressFinder
    });
    jest.doMock('../../src/block-sync-renderer/sync/indexer-cache-service', () => {
      return { updateCacheProcessed: stubbedUpdateCacheProcessedFn }
    });
    const Queue = require('../../src/block-sync-renderer/sync/queue').default
    queue = new Queue(fakeNodeUrl, addresses)
  });
  afterEach(() => {
    jest.clearAllTimers()
  });
  describe('#start', () => {
    beforeEach(async () => {
      stubbedGenesisBlockHashFn.mockResolvedValue('fakegenesisblockhash')
      stubbedGetChainFn.mockResolvedValue(fakeChain)
      await queue.start()
    });
    it('inits IndexerConnector', () => {
      expect(stubbedIndexerConnectorConstructor).toHaveBeenCalledWith(
        addresses,
        fakeNodeUrl
      )
    });
    it('connects indexer', () => {
      expect(stubbedConnectFn).toHaveBeenCalled()
    });
    describe('subscribes to IndexerConnector#blockTipSubject', () => {
      describe('when new block tip emits from IndexerConnector', () => {
        beforeEach(() => {
          stubbedBlockTipSubject.next({block_number: '3', block_hash: '0x'})
        });
        it('notify latest block numbers', () => {
          expect(stubbedIpcRenderInvokeFn).toHaveBeenCalledWith('synced-block-number-updated', '3')
        })
      });
    })
    describe('subscribes to IndexerConnector#transactionsSubject', () => {
      const fakeTxWithStatus1 = generateFakeTx('1')
      const fakeTxWithStatus2 = generateFakeTx('2')

      const fakeTxs = [
        fakeTxWithStatus2
      ]
      describe('processes transactions from an event', () => {
        beforeEach(() => {
          stubbedAddressesFn.mockResolvedValue([
            true,
            addresses.map(addressMeta => addressMeta.address),
            []
          ])
          stubbedGetTransactionFn.mockResolvedValue(fakeTxWithStatus1)
          stubbedTransactionsSubject.next(fakeTxs)
        });
        describe('when saving transactions is succeeded', () => {
          beforeEach(flushPromises)

          it('check infos by hashes derived from addresses', () => {
            const lockHashes = ['0x1f2615a8dde4e28ca736ff763c2078aff990043f4cbf09eb4b3a58a140a0862d']
            const acpLockHashes = ['0xbda2cfe4214ec63ec301170527222742d9af51b876af12d842a309bc28ee6523']
            const multiSignBlake160s = ['0x3f9dcc063f5212ec07bbee31e62950b4ea481c53']
            expect(stubbedTxAddressFinderConstructor).toHaveBeenCalledWith(
              lockHashes,
              acpLockHashes,
              fakeTxs[0].transaction,
              multiSignBlake160s
            )
          })
          it('saves transactions', () => {
            for (const {transaction} of fakeTxs) {
              expect(stubbedSaveFetchFn).toHaveBeenCalledWith(transaction)
            }
          });
          it('updates used addresses', () => {
            for (let i = 0; i < fakeTxs.length; i++) {
              expect(stubbedUpdateUsedAddressesFn).toHaveBeenCalledWith(
                addresses.map(addressMeta => addressMeta.address), []
              )
            }
          });
          it('notify indexer connector of processed block number', () => {
            expect(stubbedNotifyCurrentBlockNumberProcessedFn).toHaveBeenCalledWith(fakeTxs[0].transaction.blockNumber)
          });
          it('updates tx hash cache to be processed', () => {
            expect(stubbedUpdateCacheProcessedFn).toHaveBeenCalledWith(fakeTxs[0].transaction.hash)
          })
        });
        describe('when failed saving transactions', () => {
          const err = new Error()
          beforeEach(async () => {
            stubbedSaveFetchFn.mockRejectedValueOnce(err)
            await flushPromises()
          });
          it('handles the exception', async () => {
            expect(stubbedLoggerErrorFn).toHaveBeenCalledWith(
              expect.stringMatching(/retry saving transactions in.*seconds/),
              err
            )
          })
        });
      });
    });
  });
});
