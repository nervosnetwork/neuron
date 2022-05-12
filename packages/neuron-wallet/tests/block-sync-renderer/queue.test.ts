import { Subject } from 'rxjs'
import { Tip } from '@ckb-lumos/base'
import { scriptToAddress } from '@nervosnetwork/ckb-sdk-utils'
import { AddressType } from '../../src/models/keys/address'
import SystemScriptInfo from '../../src/models/system-script-info'
import TransactionWithStatus from '../../src/models/chain/transaction-with-status'
import { Address, AddressVersion } from '../../src/models/address'
import Queue from '../../src/block-sync-renderer/sync/queue'
import Transaction from '../../src/models/chain/transaction'
import TxStatus, { TxStatusType } from '../../src/models/chain/tx-status'
import Input from '../../src/models/chain/input'
import Output from '../../src/models/chain/output'
import OutPoint from '../../src/models/chain/out-point'
import Script, { ScriptHashType } from '../../src/models/chain/script'
import { flushPromises } from '../test-utils'
import AssetAccountInfo from '../../src/models/asset-account-info'
import MultiSign from '../../src/models/multi-sign'

const stubbedIndexerConnectorConstructor = jest.fn()
const stubbedTxAddressFinderConstructor = jest.fn()

const stubbedConnectFn = jest.fn()
const stubbedGetChainFn = jest.fn()
const stubbedGenesisBlockHashFn = jest.fn()
const stubbedGetTransactionFn = jest.fn()
const stubbedEmiterInvokeFn = jest.fn()
const stubbedAddressesFn = jest.fn()
const stubbedSaveFetchFn = jest.fn()
const stubbedCheckAndGenerateAddressesFn = jest.fn()
const stubbedNotifyCurrentBlockNumberProcessedFn = jest.fn()
const stubbedUpdateCacheProcessedFn = jest.fn()
const stubbedLoggerErrorFn = jest.fn()

const stubbedTxAddressFinder = jest.fn().mockImplementation((...args) => {
  stubbedTxAddressFinderConstructor(...args)
  return {
    addresses: stubbedAddressesFn
  }
})

const stubbedRPCServiceConstructor = jest.fn().mockImplementation(() => ({
  getChain: stubbedGetChainFn,
  getTransaction: stubbedGetTransactionFn,
  genesisBlockHash: stubbedGenesisBlockHashFn
}))

const stubbedProcessSend = jest.spyOn(process, 'send')

const resetMocks = () => {
  stubbedConnectFn.mockReset()
  stubbedGetChainFn.mockReset()
  stubbedGenesisBlockHashFn.mockReset()
  stubbedIndexerConnectorConstructor.mockReset()
  stubbedEmiterInvokeFn.mockReset()
  stubbedAddressesFn.mockReset()
  stubbedSaveFetchFn.mockReset()
  stubbedCheckAndGenerateAddressesFn.mockReset()
  stubbedGetTransactionFn.mockReset()
  stubbedNotifyCurrentBlockNumberProcessedFn.mockReset()
  stubbedUpdateCacheProcessedFn.mockReset()
  stubbedLoggerErrorFn.mockReset()
  stubbedProcessSend.mockReset()
}

const generateFakeTx = (id: string, publicKeyHash: string = '0x') => {
  const fakeTx = new Transaction('')
  fakeTx.hash = 'hash1'
  fakeTx.inputs = [new Input(new OutPoint('0x' + id.repeat(64), '0'))]
  fakeTx.outputs = [
    Output.fromObject({
      capacity: '1',
      lock: Script.fromObject({ hashType: ScriptHashType.Type, codeHash: '0x' + id.repeat(64), args: publicKeyHash })
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
    lock: SystemScriptInfo.generateSecpScript('0x36c329ed630d6ce750712a477543672adab57f4c')
  }
  const address = scriptToAddress(shortAddressInfo.lock, false)
  const fakeWalletId = 'w1'
  const addressInfo: Address = {
    address,
    blake160: '0xfakeblake160',
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

  let stubbedBlockTipsSubject: any
  let stubbedTransactionsSubject: any

  beforeEach(async () => {
    resetMocks()
    jest.useFakeTimers('legacy')

    stubbedBlockTipsSubject = new Subject<Tip>()
    stubbedTransactionsSubject = new Subject<Array<TransactionWithStatus>>()
    const stubbedIndexerConnector = jest.fn().mockImplementation((...args) => {
      stubbedIndexerConnectorConstructor(...args)
      return {
        connect: stubbedConnectFn,
        blockTipsSubject: stubbedBlockTipsSubject,
        transactionsSubject: stubbedTransactionsSubject,
        notifyCurrentBlockNumberProcessed: stubbedNotifyCurrentBlockNumberProcessedFn
      }
    })
    jest.doMock('controllers/sync-api', () => {
      return {
        emiter: {
          emit: stubbedEmiterInvokeFn
        }
      }
    })
    jest.doMock('services/rpc-service', () => {
      return stubbedRPCServiceConstructor
    })
    jest.doMock('services/tx', () => {
      return {
        TransactionPersistor: {
          saveFetchTx: stubbedSaveFetchFn
        }
      }
    })
    jest.doMock('services/wallets', () => ({
      getInstance: () => ({
        get: () => ({
          checkAndGenerateAddresses: stubbedCheckAndGenerateAddressesFn
        })
      })
    }))
    jest.doMock('utils/logger', () => {
      return { error: stubbedLoggerErrorFn, info: jest.fn() }
    })
    jest.doMock('../../src/block-sync-renderer/sync/indexer-connector', () => {
      return stubbedIndexerConnector
    })
    jest.doMock('../../src/block-sync-renderer/sync/tx-address-finder', () => {
      return stubbedTxAddressFinder
    })
    jest.doMock('../../src/block-sync-renderer/sync/indexer-cache-service', () => {
      return { updateCacheProcessed: stubbedUpdateCacheProcessedFn }
    })
    const Queue = require('../../src/block-sync-renderer/sync/queue').default
    queue = new Queue(fakeNodeUrl, addresses)
  })
  afterEach(() => {
    jest.clearAllTimers()
  })
  describe('#start', () => {
    describe('when success', () => {
      beforeEach(async () => {
        stubbedGenesisBlockHashFn.mockResolvedValue('fakegenesisblockhash')
        stubbedGetChainFn.mockResolvedValue(fakeChain)
        await queue.start()
      })
      it('inits IndexerConnector', () => {
        const [call] = stubbedIndexerConnectorConstructor.mock.calls
        expect(call[0]).toEqual(addresses)
        expect(call[1]).toEqual(fakeNodeUrl)
      })
      it('connects indexer', () => {
        expect(stubbedConnectFn).toHaveBeenCalled()
      })
      describe('subscribes to IndexerConnector#blockTipsSubject', () => {
        describe('when new block tip emits from IndexerConnector', () => {
          it('notify latest block numbers', () => {
            stubbedBlockTipsSubject.next({ cacheTipNumber: 3, indexerTipNumber: 3 })
            expect(stubbedProcessSend).toHaveBeenCalledWith({
              channel: 'cache-tip-block-updated',
              message: { cacheTipNumber: 3, indexerTipNumber: 3, timestamp: expect.anything() }
            })
          })
        })
      })
      describe('subscribes to IndexerConnector#transactionsSubject', () => {
        const fakeTxWithStatus1 = generateFakeTx('1', addresses[0].blake160)
        const fakeTxWithStatus2 = generateFakeTx('2', addresses[0].blake160)

        const fakeTxs = [fakeTxWithStatus2]
        describe('processes transactions from an event', () => {
          beforeEach(() => {
            stubbedAddressesFn.mockResolvedValue([true, addresses.map(addressMeta => addressMeta.address), []])
            stubbedGetTransactionFn.mockResolvedValue(fakeTxWithStatus1)
            stubbedTransactionsSubject.next(fakeTxs)
          })
          describe('when saving transactions is succeeded', () => {
            beforeEach(flushPromises)

            it('check infos by hashes derived from addresses', () => {
              const lockHashes = ['0x1f2615a8dde4e28ca736ff763c2078aff990043f4cbf09eb4b3a58a140a0862d']
              expect(stubbedTxAddressFinderConstructor).toHaveBeenCalledWith(
                lockHashes,
                [new AssetAccountInfo().generateAnyoneCanPayScript(addressInfo.blake160).computeHash()],
                fakeTxs[0].transaction,
                [new MultiSign().hash(addressInfo.blake160)]
              )
            })
            it('saves transactions', () => {
              for (const { transaction } of fakeTxs) {
                expect(stubbedSaveFetchFn).toHaveBeenCalledWith(transaction)
              }
            })
            it('checks and generate new addresses', () => {
              expect(stubbedCheckAndGenerateAddressesFn).toHaveBeenCalledTimes(fakeTxs.length)
            })
            it('notify indexer connector of processed block number', () => {
              expect(stubbedNotifyCurrentBlockNumberProcessedFn).toHaveBeenCalledWith(
                fakeTxs[0].transaction.blockNumber
              )
            })
            it('updates tx hash cache to be processed', () => {
              expect(stubbedUpdateCacheProcessedFn).toHaveBeenCalledWith(fakeTxs[0].transaction.hash)
            })
          })
          describe('when failed saving transactions', () => {
            const err = new Error()
            beforeEach(async () => {
              stubbedSaveFetchFn.mockRejectedValueOnce(err)
              await flushPromises()
            })
            it('handles the exception', async () => {
              expect(stubbedLoggerErrorFn).toHaveBeenCalledWith(
                expect.stringMatching(/retry saving transactions in.*seconds/),
                err
              )
            })
          })
        })
      })
    })
    describe('when fails', () => {
      describe('fails in connecting indexer', () => {
        beforeEach(async () => {
          stubbedConnectFn.mockRejectedValue(new Error())
          await queue.start()
        })
        it('emit event indexer-error', () => {
          expect(stubbedProcessSend).toHaveBeenCalledWith({
            channel: 'indexer-error'
          })
        })
      })
    })
  })
})
