const stubbedRPCServiceConstructor = jest.fn()
const stubbedWalletsServiceConstructor = jest.fn()
const stubbedGetLiveCell = jest.fn()
const stubbedGetTransaction = jest.fn()
const stubbedGetBlockByNumber = jest.fn()
const stubbedGetHeaderByNumber = jest.fn()
const stubbedGetHeader = jest.fn()
const stubbedSendTransaction = jest.fn()
const stubbedCalculateDaoMaximumWithdraw = jest.fn()
const stubbedGetNextAddress = jest.fn()
const stubbedGetNextChangeAddress = jest.fn()
const stubbedGetWallet = jest.fn()
const stubbedGetCurrentWallet = jest.fn()
const stubbedStartWithdrawFromDao = jest.fn()
const stubbedGenerateDepositTx = jest.fn()
const stubbedGenerateSendingAllTx = jest.fn()
const stubbedGenerateTx = jest.fn()
const stubbedSaveWithSentTx = jest.fn()
const stubbedCheckAndGenerateAddresses = jest.fn()
const stubbedGenerateDepositAllTx = jest.fn()
const stubbedGenerateWithdrawMultiSignTx = jest.fn()
const stubbedHardWalletGetCurrent = jest.fn()

const resetMocks = () => {
  stubbedGetLiveCell.mockReset()
  stubbedGetTransaction.mockReset()
  stubbedGetBlockByNumber.mockReset()
  stubbedGetHeaderByNumber.mockReset()
  stubbedGetHeader.mockReset()
  stubbedSendTransaction.mockReset()
  stubbedCalculateDaoMaximumWithdraw.mockReset()
  stubbedGetNextAddress.mockReset()
  stubbedGetNextChangeAddress.mockReset()
  stubbedGetWallet.mockReset()
  stubbedGetCurrentWallet.mockReset()
  stubbedStartWithdrawFromDao.mockReset()
  stubbedGenerateDepositTx.mockReset()
  stubbedGenerateSendingAllTx.mockReset()
  stubbedGenerateTx.mockReset()
  stubbedSaveWithSentTx.mockReset()
  stubbedCheckAndGenerateAddresses.mockReset()
  stubbedGenerateDepositAllTx.mockReset()
  stubbedGenerateWithdrawMultiSignTx.mockReset()
}

stubbedRPCServiceConstructor.mockImplementation(() => ({
  getLiveCell: stubbedGetLiveCell,
  getTransaction: stubbedGetTransaction,
  getBlockByNumber: stubbedGetBlockByNumber,
  getHeaderByNumber: stubbedGetHeaderByNumber,
  getHeader: stubbedGetHeader,
}))

stubbedWalletsServiceConstructor.mockImplementation(() => ({
  get: stubbedGetWallet,
  isHardware: () => false,
}))
//@ts-ignore
stubbedWalletsServiceConstructor.getInstance = () => ({
  get: stubbedGetWallet,
  getCurrent: stubbedGetCurrentWallet,
})

jest.doMock('services/rpc-service', () => {
  return stubbedRPCServiceConstructor
})
jest.doMock('services/wallets', () => {
  return stubbedWalletsServiceConstructor
})
jest.doMock('services/tx/transaction-generator', () => {
  return {
    TransactionGenerator: {
      startWithdrawFromDao: stubbedStartWithdrawFromDao,
      generateDepositTx: stubbedGenerateDepositTx,
      generateSendingAllTx: stubbedGenerateSendingAllTx,
      generateTx: stubbedGenerateTx,
      generateDepositAllTx: stubbedGenerateDepositAllTx,
      generateWithdrawMultiSignTx: stubbedGenerateWithdrawMultiSignTx,
    },
  }
})
jest.doMock('services/tx/transaction-persistor', () => {
  return {
    TransactionPersistor: {
      saveSentTx: stubbedSaveWithSentTx,
    },
  }
})

jest.doMock('services/multisig', () => {
  return {
    saveSentMultisigOutput: jest.fn(),
  }
})

jest.mock('../../../src/models/system-script-info', () => {
  const originalModule = jest.requireActual('../../../src/models/system-script-info')
  return {
    ...originalModule.default,
    isSecpScript: originalModule.default.isSecpScript,
    generateDaoScript: originalModule.default.generateDaoScript,
    generateSecpScript: originalModule.default.generateSecpScript,
    generateMultiSignScript: originalModule.default.generateMultiSignScript,
    getInstance: () => ({
      getSecpCellDep: jest
        .fn()
        .mockReturnValue(
          new CellDep(
            new OutPoint('0x3e6790b2f47c7de911c2def3c0a3b5bf613e457e38f185e2e566f9010e495874', '0'),
            DepType.DepGroup
          )
        ),
      getDaoCellDep: jest
        .fn()
        .mockReturnValue(
          new CellDep(
            new OutPoint('0x3e6790b2f47c7de911c2def3c0a3b5bf613e457e38f185e2e566f9010e495874', '0'),
            DepType.DepGroup
          )
        ),
    }),
  }
})
jest.doMock('services/hardware', () => ({
  getInstance: () => ({
    getCurrent: stubbedHardWalletGetCurrent,
    initHardware: () => ({
      connect: jest.fn(),
    }),
  }),
}))

jest.doMock('@nervosnetwork/ckb-sdk-core', () => {
  return function() {
    return {
      calculateDaoMaximumWithdraw: stubbedCalculateDaoMaximumWithdraw,
    }
  }
})

jest.doMock('utils/ckb-rpc.ts', () => ({
  generateRPC() {
    return {
      sendTransaction: stubbedSendTransaction
    }
  }
}))

jest.doMock('services/cells', () => ({
  getLiveCell: stubbedGetLiveCell
}))

import Transaction from '../../../src/models/chain/transaction'
import TxStatus from '../../../src/models/chain/tx-status'
import CellDep, { DepType } from '../../../src/models/chain/cell-dep'
import OutPoint from '../../../src/models/chain/out-point'
import Input from '../../../src/models/chain/input'
import Script, { ScriptHashType } from '../../../src/models/chain/script'
import Output from '../../../src/models/chain/output'
import Keystore from '../../../src/models/keys/keystore'
import { AddressType } from '../../../src/models/keys/address'
import WitnessArgs from '../../../src/models/chain/witness-args'
import CellWithStatus from '../../../src/models/chain/cell-with-status'
import SystemScriptInfo from '../../../src/models/system-script-info'
import AssetAccountInfo from '../../../src/models/asset-account-info'
import {
  CapacityNotEnoughForChange,
  CapacityNotEnoughForChangeByTransfer,
  MultisigConfigNeedError,
  NoMatchAddressForSign,
} from '../../../src/exceptions'
import TransactionSender from '../../../src/services/transaction-sender'
import MultisigConfigModel from '../../../src/models/multisig-config'
import Multisig from '../../../src/models/multisig'
import { config, helpers } from '@ckb-lumos/lumos'
import { bytes } from '@ckb-lumos/codec'
import { blockchain } from '@ckb-lumos/base'

const fakeScript = new Script(
  '0x9bd7e06f3ecf4be0f2fcd2188b23f1b9fcc88e5d4b65a8637b17723bbda3cce8',
  '0x36c329ed630d6ce750712a477543672adab57f4c',
  ScriptHashType.Type
)
const generateTxWithStatus = (
  id: string,
  block: any,
  lock: Script = fakeScript,
  type: Script | undefined,
  outputsData: string[] | undefined
) => {
  const inputs = [
    Input.fromObject({
      previousOutput: new OutPoint('0x' + (parseInt(id) - 1).toString().repeat(64), '0'),
      since: '',
      lock: fakeScript,
    }),
  ]
  const outputs = [
    Output.fromObject({
      capacity: '1',
      lock,
      type,
    }),
  ]

  return {
    transaction: Transaction.fromObject({
      version: '1',
      hash: '0x' + id.repeat(64),
      blockNumber: block.number,
      timestamp: block.timestamp.toString(),
      inputs,
      outputs,
      outputsData,
    }),
    txStatus: TxStatus.fromSDK({ status: 'committed', blockHash: block.hash }),
  }
}

describe('TransactionSender Test', () => {
  const transactionSender = new TransactionSender()
  const fakeBlock1 = { number: '1', hash: '0x' + '0'.repeat(64), timestamp: '1' }
  const fakeTx1 = generateTxWithStatus('1', fakeBlock1, undefined, SystemScriptInfo.generateDaoScript(), [
    '0x0000000000000000',
  ])

  const fakeWallet = {
    name: 'wallet-test1',
    id: '11',
    extendedKey: 'a',
    keystore: new Keystore(
      {
        cipher: 'wallet1',
        cipherparams: { iv: 'wallet1' },
        ciphertext: 'wallet1',
        kdf: '1',
        kdfparams: {
          dklen: 1,
          n: 1,
          r: 1,
          p: 1,
          salt: '1',
        },
        mac: '1',
      },
      '0'
    ),
    isHardware: () => false,
    getNextAddress: stubbedGetNextAddress,
    getNextChangeAddress: stubbedGetNextChangeAddress,
    checkAndGenerateAddresses: stubbedCheckAndGenerateAddresses,
  }

  const fakeCellWithStatus = CellWithStatus.fromSDK({
    cell: {
      output: {
        capacity: '10200000000',
        lock: {
          args: '0x61c928dedf2afc8cb434c1af311a29cbb16f7076',
          codeHash: '0x9bd7e06f3ecf4be0f2fcd2188b23f1b9fcc88e5d4b65a8637b17723bbda3cce8',
          hashType: 'type',
        },
        type: {
          args: '0x',
          codeHash: '0x82d76d1b75fe2fd9a27dfbaa65a039221a380d76c926f378d3f81cf3e7e13f2e',
          hashType: 'type',
        },
      },
      data: {
        content: '0x6400000000000000',
        hash: '0xa731cac6893c41dba273a301c57e5bd2cf88dbcf8e1ddd39961b97dd0b710822',
      },
    },
    status: 'live' as CKBComponents.CellStatus,
  })

  const fakeAddress1 = 'ckt1qyqrdsefa43s6m882pcj53m4gdnj4k440axqswmu83'
  const fakeAddress2 = 'ckt1qyqrdsefa43s6m882pcj53m4gdnj4k440axqswmu82'

  beforeEach(async () => {
    resetMocks()

    stubbedGetWallet.mockReturnValue(fakeWallet)
  })

  describe('sign', () => {
    const pathAndPrivateKey = {
      path: `m/44'/309'/0'/0/0`,
      privateKey: '0xe79f3207ea4980b7fed79956d5934249ceac4751a4fae01a0f7c4a96884bc4e3',
    }

    const mockGetPk = jest.fn()
    mockGetPk.mockReturnValue([pathAndPrivateKey])
    transactionSender.getPrivateKeys = mockGetPk.bind(transactionSender)

    const addr = {
      walletId: fakeWallet.id,
      address: '',
      path: `m/44'/309'/0'/0/0`,
      addressType: AddressType.Receiving,
      addressIndex: 1,
      txCount: 0,
      liveBalance: '0',
      sentBalance: '0',
      pendingBalance: '0',
      balance: '0',
      blake160: '0x36c329ed630d6ce750712a477543672adab57f4c',
      version: 'testnet',
    }

    const mockGAI = jest.fn()
    mockGAI.mockReturnValue([addr])
    transactionSender.getAddressInfos = mockGAI.bind(transactionSender)

    describe('#sign', () => {
      describe('single sign', () => {
        const tx = Transaction.fromObject({
          version: '0x0',
          cellDeps: [
            CellDep.fromObject({
              outPoint: OutPoint.fromObject({
                txHash: '0x0d9c4af3dd158d6359c9d25d0a600f1dd20b86072b85a095e7bc70c34509b73d',
                index: '0x0',
              }),
              depType: 'depGroup' as DepType,
            }),
          ],
          headerDeps: [],
          inputs: [
            Input.fromObject({
              previousOutput: OutPoint.fromObject({
                txHash: '0x1879851943fa686af29bed5c95acd566d0244e7b3ca89cf7c435622a5a5b4cb3',
                index: '0x0',
              }),
              since: '0x0',
              lock: Script.fromObject({
                args: '0x36c329ed630d6ce750712a477543672adab57f4c',
                codeHash: '0x9bd7e06f3ecf4be0f2fcd2188b23f1b9fcc88e5d4b65a8637b17723bbda3cce8',
                hashType: 'type' as ScriptHashType,
              }),
            }),
          ],
          outputs: [
            Output.fromObject({
              capacity: '0x174876e800',
              lock: Script.fromObject({
                codeHash: '0x9bd7e06f3ecf4be0f2fcd2188b23f1b9fcc88e5d4b65a8637b17723bbda3cce8',
                args: '0xe2193df51d78411601796b35b17b4f8f2cd85bd0',
                hashType: 'type' as ScriptHashType,
              }),
              type: null,
            }),
            Output.fromObject({
              capacity: '0x12319d9962f4',
              lock: Script.fromObject({
                codeHash: '0x9bd7e06f3ecf4be0f2fcd2188b23f1b9fcc88e5d4b65a8637b17723bbda3cce8',
                args: '0x36c329ed630d6ce750712a477543672adab57f4c',
                hashType: 'type' as ScriptHashType,
              }),
              type: null,
            }),
          ],
          outputsData: ['0x', '0x'],
          witnesses: [
            '0x55000000100000005500000055000000410000003965f54cc684d35d886358ad57214e5f4a5fd13ecc7aba67950495b9be7740267a1d6bb14f1c215e3bc926f9655648b75e173ce6f5fd1e60218383b45503c30301',
          ],
          hash: '0x230ab250ee0ae681e88e462102e5c01a9994ac82bf0effbfb58d6c11a86579f1',
        })

        it('success', async () => {
          const ntx = await transactionSender.sign(fakeWallet.id, tx, '1234', false)

          expect(ntx.witnesses[0]).toEqual(tx.witnesses[0])
        })
      })

      describe('multi sign with since', () => {
        const tx = Transaction.fromObject({
          version: '0x0',
          cellDeps: [
            CellDep.fromObject({
              outPoint: OutPoint.fromObject({
                txHash: '0x0d9c4af3dd158d6359c9d25d0a600f1dd20b86072b85a095e7bc70c34509b73d',
                index: '0x1',
              }),
              depType: 'depGroup' as DepType,
            }),
          ],
          headerDeps: [],
          inputs: [
            Input.fromObject({
              previousOutput: OutPoint.fromSDK({
                txHash: '0xf1181e7d0ef95fa2e6c334f6aa647520a898d9f8259a2bb021a622434bc73a63',
                index: '0x0',
              }),
              since: '0x2000f00078000002',
              lock: Script.fromObject({
                // "args": "0x36c329ed630d6ce750712a477543672adab57f4c",
                args: '0x56f281b3d4bb5fc73c751714af0bf78eb8aba0d80200007800f00020',
                codeHash: '0x9bd7e06f3ecf4be0f2fcd2188b23f1b9fcc88e5d4b65a8637b17723bbda3cce8',
                hashType: 'type' as ScriptHashType,
              }),
            }),
          ],
          outputs: [
            Output.fromObject({
              capacity: '0xd18c2e2800',
              lock: Script.fromObject({
                codeHash: '0x9bd7e06f3ecf4be0f2fcd2188b23f1b9fcc88e5d4b65a8637b17723bbda3cce8',
                args: '0x36c329ed630d6ce750712a477543672adab57f4c',
                hashType: 'type' as ScriptHashType,
              }),
              type: null,
            }),
          ],
          outputsData: ['0x'],
          witnesses: [new WitnessArgs()],
          hash: '0x7e69c5b95b25aa70e6e72f0e29ec7b92d6415f4bdacfb9562f9d40c3fddb8dca',
        })

        const expectedWitness = [
          '0x6d000000100000006d0000006d000000590000000000010136c329ed630d6ce750712a477543672adab57f4c1c12c81448189a3455996c31022b8a5407a3d54ff1710eaf4220375f906cb53423040ca9f81e56f41f2df0d6cfd124dbda30b8213a0b15173b745e20449afd5401',
        ]

        it('success', async () => {
          // @ts-ignore: Private method
          const ntx = await transactionSender.sign(fakeWallet.id, tx, '1234', false)

          expect(ntx.witnesses[0]).toEqual(expectedWitness[0])
        })
      })

      describe('sign for cheque claim tx', () => {
        const assetAccountInfo = new AssetAccountInfo()
        const receiverDefaultLock = SystemScriptInfo.generateSecpScript(addr.blake160)
        const tx = Transaction.fromObject({
          version: '0x0',
          cellDeps: [],
          headerDeps: [],
          inputs: [
            Input.fromObject({
              previousOutput: OutPoint.fromObject({
                txHash: '0x1879851943fa686af29bed5c95acd566d0244e7b3ca89cf7c435622a5a5b4cb3',
                index: '0x0',
              }),
              since: '0x0',
            }),
          ],
          outputs: [],
          outputsData: [],
          witnesses: [
            '0x5500000010000000550000005500000041000000b6d1e054606d7229b594820357397ececac31685646d3dbf07d6afe421c96ff72d32ed139f20c7b97b47ec8361c00c1924976ed90031380c488c1bae8ce3bd9d00',
          ],
        })
        describe('when matched receiver lock hash', () => {
          beforeEach(() => {
            const chequeLock = assetAccountInfo.generateChequeScript(receiverDefaultLock.computeHash(), '0'.repeat(40))
            tx.inputs[0].lock = chequeLock
          })
          it('success', async () => {
            // @ts-ignore: Private method
            const ntx = await transactionSender.sign(fakeWallet.id, tx, '1234', false)

            expect(ntx.witnesses[0]).toEqual(tx.witnesses[0])
          })
        })
        describe('when not matched receiver lock hash', () => {
          beforeEach(() => {
            const chequeLock = assetAccountInfo.generateChequeScript('0'.repeat(40), '0'.repeat(40))
            tx.inputs[0].lock = chequeLock
          })
          it('throws', async () => {
            try {
              // @ts-ignore: Private method
              await transactionSender.sign(fakeWallet.id, tx, '1234')
            } catch (error) {
              expect(error.message).toBe('no private key found')
            }
          })
        })
      })

      describe('sign for cheque withdraw tx', () => {
        const assetAccountInfo = new AssetAccountInfo()
        const senderDefaultLock = SystemScriptInfo.generateSecpScript(addr.blake160)
        const tx = Transaction.fromObject({
          version: '0x0',
          cellDeps: [],
          headerDeps: [],
          inputs: [
            Input.fromObject({
              previousOutput: OutPoint.fromObject({
                txHash: '0x1879851943fa686af29bed5c95acd566d0244e7b3ca89cf7c435622a5a5b4cb3',
                index: '0x0',
              }),
              since: '0x0',
            }),
          ],
          outputs: [],
          outputsData: [],
          witnesses: [
            '0x5500000010000000550000005500000041000000b6d1e054606d7229b594820357397ececac31685646d3dbf07d6afe421c96ff72d32ed139f20c7b97b47ec8361c00c1924976ed90031380c488c1bae8ce3bd9d00',
          ],
        })
        describe('when matched sender lock hash', () => {
          beforeEach(() => {
            const chequeLock = assetAccountInfo.generateChequeScript('0'.repeat(40), senderDefaultLock.computeHash())
            tx.inputs[0].lock = chequeLock
          })
          it('success', async () => {
            const ntx = await transactionSender.sign(fakeWallet.id, tx, '1234', false)

            expect(ntx.witnesses[0]).toEqual(tx.witnesses[0])
          })
        })
        describe('when not matched sender lock hash', () => {
          beforeEach(() => {
            const chequeLock = assetAccountInfo.generateChequeScript('0'.repeat(40), '0'.repeat(40))
            tx.inputs[0].lock = chequeLock
          })
          it('throws', async () => {
            try {
              await transactionSender.sign(fakeWallet.id, tx, '1234')
            } catch (error) {
              expect(error.message).toBe('no private key found')
            }
          })
        })
      })
    })

    describe('#sendTx', () => {
      let txHash: any
      beforeEach(async () => {
        txHash = await transactionSender.sendTx(fakeWallet.id, fakeTx1.transaction)
      })
      it('posts tx to rpc', () => {
        expect(stubbedSendTransaction).toHaveBeenCalled()
      })
      it('saves tx', () => {
        expect(stubbedSaveWithSentTx).toHaveBeenCalled()
      })
      it('returns tx hash', () => {
        expect(txHash).toEqual('0xb3dcea26138cb9f714502e52ad2c18a60a197cc2f397301da0b84ad727051158')
      })
      it('check and generate new addresses', () => {
        expect(stubbedCheckAndGenerateAddresses).toHaveBeenCalled()
      })
    })

    describe('#generateTx', () => {
      const fee = '1'
      const feeRate = '10'
      const targetOutputs = [
        { address: '1', capacity: '1' },
        { address: '1', capacity: '1' },
      ]
      beforeEach(() => {
        stubbedGetCurrentWallet.mockReturnValue(fakeWallet)
        stubbedGetNextChangeAddress.mockReturnValue({
          address: fakeAddress1,
        })
      })
      describe('success', () => {
        beforeEach(async () => {
          await transactionSender.generateTx(fakeWallet.id, targetOutputs, fee, feeRate)
        })
        it('generates transaction', () => {
          expect(stubbedGenerateTx).toHaveBeenCalledWith(
            fakeWallet.id,
            [
              { address: '1', capacity: '1' },
              { address: '1', capacity: '1' },
            ],
            fakeAddress1,
            fee,
            feeRate
          )
        })
      })
      describe('fail', () => {
        beforeEach(async () => {
          stubbedGenerateTx.mockRejectedValue(new CapacityNotEnoughForChange())
        })
        it('generates transaction', async () => {
          expect(transactionSender.generateTx(fakeWallet.id, targetOutputs, fee, feeRate)).rejects.toThrowError(
            CapacityNotEnoughForChangeByTransfer
          )
        })
      })
    })

    describe('#generateSendingAllTx', () => {
      const fee = '1'
      const feeRate = '10'
      beforeEach(async () => {
        const targetOutputs = [
          { address: '1', capacity: '1' },
          { address: '1', capacity: '1' },
        ]
        await transactionSender.generateSendingAllTx(fakeWallet.id, targetOutputs, fee, feeRate)
      })
      it('generates transaction', () => {
        expect(stubbedGenerateSendingAllTx).toHaveBeenCalledWith(
          fakeWallet.id,
          [
            { address: '1', capacity: '1' },
            { address: '1', capacity: '1' },
          ],
          fee,
          feeRate
        )
      })
    })

    describe('#generateSendingAllTx', () => {
      it('generates transaction', async () => {
        const targetOutputs = [
          { address: '1', capacity: '1' },
          { address: '1', capacity: '1' },
        ]
        const multisigConfig = MultisigConfigModel.fromObject({
          walletId: 'walletId',
          m: 1,
          n: 1,
          r: 1,
          blake160s: ['blake160s'],
        })
        await transactionSender.generateMultisigSendAllTx(targetOutputs, multisigConfig)
        expect(stubbedGenerateSendingAllTx).toHaveBeenCalledWith('', targetOutputs, '0', '1000', multisigConfig)
      })
    })

    describe('#generateDepositTx', () => {
      const fee = '1'
      const feeRate = '10'
      const capacity = '100'
      beforeEach(async () => {
        stubbedGetCurrentWallet.mockReturnValue(fakeWallet)
        stubbedGetNextChangeAddress.mockReturnValue({
          address: fakeAddress1,
        })
        stubbedGetNextAddress.mockReturnValue({
          address: fakeAddress2,
        })
        await transactionSender.generateDepositTx(fakeWallet.id, capacity, fee, feeRate)
      })
      it('generates transaction', () => {
        expect(stubbedGenerateDepositTx).toHaveBeenCalledWith(
          fakeWallet.id,
          capacity,
          fakeAddress2,
          fakeAddress1,
          fee,
          feeRate
        )
      })
    })

    describe('#generateDepositAllTx', () => {
      const fee = '1'
      const feeRate = '10'
      beforeEach(async () => {
        stubbedGetWallet.mockReturnValue(fakeWallet)
        stubbedGetNextAddress.mockReturnValue({
          address: fakeAddress1,
        })
        stubbedGetNextChangeAddress.mockReturnValue({
          address: fakeAddress2,
        })
        await transactionSender.generateDepositAllTx(fakeWallet.id, false, fee, feeRate)
      })
      it('generates transaction', () => {
        expect(stubbedGenerateDepositAllTx).toHaveBeenCalledWith(
          fakeWallet.id,
          fakeAddress1,
          fakeAddress2,
          false,
          fee,
          feeRate
        )
      })
    })

    describe('#generateWithdrawMultiSignTx', () => {
      const fee = '1'
      const feeRate = '10'
      const fakeDepositOutPoint = OutPoint.fromObject({ txHash: '0x' + '0'.repeat(64), index: '0x0' })
      beforeEach(async () => {
        stubbedGetLiveCell.mockResolvedValue(fakeCellWithStatus.cell!.output)
        stubbedGetTransaction.mockResolvedValue(fakeTx1)
        stubbedGetNextAddress.mockResolvedValue({ address: fakeAddress1 })
        await transactionSender.generateWithdrawMultiSignTx(fakeWallet.id, fakeDepositOutPoint, fee, feeRate)
      })
      it('generates transaction', () => {
        expect(stubbedGenerateWithdrawMultiSignTx).toHaveBeenCalledWith(
          fakeDepositOutPoint,
          fakeCellWithStatus.cell!.output,
          fakeAddress1,
          fee,
          feeRate
        )
      })
    })

    describe('#startWithdrawFromDao', () => {
      const fakeDepositOutPoint = OutPoint.fromObject({ txHash: '0x' + '0'.repeat(64), index: '0x0' })
      const fakeDepositBlockHeader = {
        version: '0',
        timestamp: '1606961260974',
        number: '100',
        epoch: '2199023255602',
        hash: '0x97b3620c97bf47b4b85f4de678165ea78768be98f080854b54a9e03b78ba21b3',
        parentHash: '0x9ddda4dd7edd9e413cbd25f6258ad182ea4a0f8af6835a431e72553f28a61086',
      }
      const fee = '1'
      const feeRate = '10'
      beforeEach(async () => {
        stubbedGetLiveCell.mockResolvedValue(fakeCellWithStatus.cell!.output)
        stubbedGetTransaction.mockResolvedValue(fakeTx1)
        stubbedGetHeader.mockResolvedValue(fakeDepositBlockHeader)
        stubbedGetNextChangeAddress.mockReturnValue({
          address: fakeAddress1,
        })
        await transactionSender.startWithdrawFromDao(fakeWallet.id, fakeDepositOutPoint, '1', '10')
      })
      it('generates transaction', () => {
        expect(stubbedStartWithdrawFromDao).toHaveBeenCalledWith(
          fakeWallet.id,
          fakeDepositOutPoint,
          fakeCellWithStatus.cell!.output,
          fakeDepositBlockHeader.number,
          fakeDepositBlockHeader.hash,
          fakeAddress1,
          fee,
          feeRate
        )
      })
    })

    describe('#withdrawFromDao', () => {
      let tx: any

      beforeEach(async () => {
        const output = fakeCellWithStatus.cell!.output
        output.daoData = '0x6400000000000000'
        output.setDepositOutPoint(new OutPoint(`0x${'0'.repeat(64)}`, '0x0'))
        stubbedGetLiveCell.mockResolvedValue(output)
        stubbedGetTransaction.mockResolvedValue(fakeTx1)
        stubbedGetBlockByNumber.mockResolvedValue({
          header: { hash: '0x92b197aa1fba0f63633922c61c92375c9c074a93e85963554f5499fe1450d0e5' },
          transactions: [{ hash: '0x' + '0'.repeat(64) }, { hash: '0x' + '1'.repeat(64) }],
        })
        const depositBlockHeader = {
          version: '0',
          timestamp: '1606961260974',
          number: '100',
          epoch: '2199023255602',
          hash: '0x97b3620c97bf47b4b85f4de678165ea78768be98f080854b54a9e03b78ba21b3',
          parentHash: '0x9ddda4dd7edd9e413cbd25f6258ad182ea4a0f8af6835a431e72553f28a61086',
        }
        stubbedGetHeaderByNumber.mockResolvedValue(depositBlockHeader)

        const withdrawBlockHeader = {
          version: '0',
          timestamp: '1606961260974',
          number: '100',
          epoch: '2199023255602',
          hash: '0x97b3620c97bf47b4b85f4de678165ea78768be98f080854b54a9e03b78ba21b3',
          parentHash: '0x9ddda4dd7edd9e413cbd25f6258ad182ea4a0f8af6835a431e72553f28a61086',
        }
        stubbedGetHeader.mockResolvedValue(withdrawBlockHeader)

        stubbedCalculateDaoMaximumWithdraw.mockResolvedValue(10300000000)
        stubbedGetNextAddress.mockReturnValue({
          address: fakeAddress1,
        })

        const depositOutPoint = OutPoint.fromObject({
          txHash: '0x' + '0'.repeat(64),
          index: '0x0',
        })
        const withdrawingOutPoint = OutPoint.fromObject({
          txHash: '0x' + '1'.repeat(64),
          index: '0x0',
        })
        tx = await transactionSender.withdrawFromDao(
          fakeWallet.id,
          depositOutPoint,
          withdrawingOutPoint,
          undefined,
          '1000'
        )
      })
      it('generates transaction', () => {
        expect(tx.interest).toEqual('100000000')
        expect(tx.inputs[0].since).toEqual('2305845208236949554')
        expect(tx.witnesses[0].inputType).toEqual('0x0000000000000000')
      })
    })

    describe('#signMultisig', () => {
      const transcationObject = {
        version: '0x0',
        cellDeps: [
          CellDep.fromObject({
            outPoint: OutPoint.fromObject({
              txHash: '0x0d9c4af3dd158d6359c9d25d0a600f1dd20b86072b85a095e7bc70c34509b73d',
              index: '0x0',
            }),
            depType: 'depGroup' as DepType,
          }),
        ],
        headerDeps: [],
        inputs: [
          Input.fromObject({
            previousOutput: OutPoint.fromObject({
              txHash: '0x1879851943fa686af29bed5c95acd566d0244e7b3ca89cf7c435622a5a5b4cb3',
              index: '0x0',
            }),
            since: '0x0',
            lock: Script.fromObject({
              args: '',
              codeHash: SystemScriptInfo.MULTI_SIGN_CODE_HASH,
              hashType: SystemScriptInfo.MULTI_SIGN_HASH_TYPE,
            }),
          }),
        ],
        outputs: [
          Output.fromObject({
            capacity: '0x174876e800',
            lock: Script.fromObject({
              codeHash: '0x9bd7e06f3ecf4be0f2fcd2188b23f1b9fcc88e5d4b65a8637b17723bbda3cce8',
              args: '0xe2193df51d78411601796b35b17b4f8f2cd85bd0',
              hashType: 'type' as ScriptHashType,
            }),
            type: null,
          }),
          Output.fromObject({
            capacity: '0x12319d9962f4',
            lock: Script.fromObject({
              codeHash: '0x9bd7e06f3ecf4be0f2fcd2188b23f1b9fcc88e5d4b65a8637b17723bbda3cce8',
              args: '0x36c329ed630d6ce750712a477543672adab57f4c',
              hashType: 'type' as ScriptHashType,
            }),
            type: null,
          }),
        ],
        outputsData: ['0x', '0x'],
        witnesses: [],
        hash: '0x230ab250ee0ae681e88e462102e5c01a9994ac82bf0effbfb58d6c11a86579f1',
      }

      const createMultisigConfig = (r: number, m: number, addresses: string[]): [string, MultisigConfigModel] => {
        const blake160s = addresses.map(v => {
          const isMainnet = v.startsWith('ckb')
          const lumosOptions = isMainnet ? {config: config.predefined.LINA} : {config: config.predefined.AGGRON4};
          return helpers.addressToScript(v, lumosOptions).args
        })
        const multiArgs = Multisig.hash(blake160s, r, m, addresses.length)
        return [
          multiArgs,
          MultisigConfigModel.fromObject({
            walletId: fakeWallet.id,
            r,
            m,
            n: addresses.length,
            blake160s: addresses.map(v => {
              const isMainnet = v.startsWith('ckb')
              const lumosOptions = isMainnet ? config.predefined.LINA : config.predefined.AGGRON4;
              return  helpers.addressToScript(v, {config: lumosOptions}).args
            }),
          }),
        ]
      }

      it('m is 1', async () => {
        const addresses = [
          'ckt1qyq89x5ggpt0a5epm2k2gyxeffwkgfdxeg0s543mh4',
          'ckt1qyqql0vgjyxjxjxknkj6nq8jxa485xsyl66sy7c5f6',
        ]
        const [multiArgs, multisigConfig] = createMultisigConfig(1, 1, addresses)
        const addr = {
          walletId: fakeWallet.id,
          path: `m/44'/309'/0'/0/0`,
          blake160: helpers.addressToScript(addresses[0], {config: config.predefined.AGGRON4}).args,
          version: 'testnet',
        }

        const mockGAI = jest.fn()
        mockGAI.mockReturnValueOnce([addr])
        transactionSender.getAddressInfos = mockGAI.bind(transactionSender)
        const tx = Transaction.fromObject(transcationObject)
        tx.inputs[0]!.setLock(SystemScriptInfo.generateMultiSignScript(multiArgs))
        const res = await transactionSender.signMultisig(fakeWallet.id, tx, '1234', [multisigConfig])
        expect(res.witnesses[0]).toBe(
          '0x810000001000000081000000810000006d00000000010102729a884056fed321daaca410d94a5d6425a6ca1f0fbd88910d2348d69da5a980f2376a7a1a04feb5e3b593ad962c15abe214722ef6f84c186d757c6807a70e705adde5dea39b6856643cbf36312df13cc6a46e2a015e8508cecf2e31d5e2a65264516eb9b89ebbb701'
        )
      })

      describe('m is 2', () => {
        const addresses = [
          'ckt1qyq89x5ggpt0a5epm2k2gyxeffwkgfdxeg0s543mh4',
          'ckt1qyqql0vgjyxjxjxknkj6nq8jxa485xsyl66sy7c5f6',
          'ckt1qyqt9wqszk2lurw7h86wrt826cg8zx2f0lnq6e4vpl',
        ]
        const [multiArgs, multisigConfig] = createMultisigConfig(1, 2, addresses)
        const addr = {
          walletId: fakeWallet.id,
          path: `m/44'/309'/0'/0/0`,
          blake160: '',
          version: 'testnet',
        }

        const mockGAI = jest.fn()
        mockGAI.mockReturnValue(
          [addr, addr, addr].map((v, idx) => {
            const address = addresses[idx]
            const isMainnet = address.startsWith('ckb')
            const lumosOptions = isMainnet ? {config: config.predefined.LINA} : {config: config.predefined.AGGRON4};
            return { ...v, blake160: helpers.addressToScript(address, lumosOptions).args }
          })
        )
        let tx = Transaction.fromObject(transcationObject)
        it('first sign', async () => {
          const getAddressInfos = transactionSender.getAddressInfos
          transactionSender.getAddressInfos = mockGAI.bind(transactionSender)
          tx.inputs[0]!.setLock(SystemScriptInfo.generateMultiSignScript(multiArgs))
          tx = await transactionSender.signMultisig(fakeWallet.id, tx, '1234', [multisigConfig])
          const lock = (tx.witnesses[0] as WitnessArgs).lock!
          const serializedMultiSign: string = Multisig.serialize(
            addresses.map(v => {
              const isMainnet = v.startsWith('ckb')
              const lumosOptions = isMainnet ? config.predefined.LINA : config.predefined.AGGRON4;
              return  helpers.addressToScript(v, {config: lumosOptions}).args
            }),
            1,
            2,
            3
          )
          expect(lock.startsWith(serializedMultiSign)).toBeTruthy()
          transactionSender.getAddressInfos = getAddressInfos
        })
        it('second sign', async () => {
          const getAddressInfos = transactionSender.getAddressInfos
          transactionSender.getAddressInfos = mockGAI.bind(transactionSender)
          const res = await transactionSender.signMultisig(fakeWallet.id, tx, '1234', [multisigConfig])
          expect(res.witnesses[0]).toBe(
            '0xd600000010000000d6000000d6000000c200000000010203729a884056fed321daaca410d94a5d6425a6ca1f0fbd88910d2348d69da5a980f2376a7a1a04feb5b2b8101595fe0ddeb9f4e1acead6107119497fe601924464e3450110f2dcc02e6773c366602ba08463fda630d49d839024e7bc927575fd48340be1e78056f556cdced21d839a32b069d4fdb9c972e6e0bb075fbe0101924464e3450110f2dcc02e6773c366602ba08463fda630d49d839024e7bc927575fd48340be1e78056f556cdced21d839a32b069d4fdb9c972e6e0bb075fbe01'
          )
          transactionSender.getAddressInfos = getAddressInfos
        })
      })

      it('throw exception no matched multisig config', async () => {
        mockGAI.mockReturnValueOnce([{ path: '' }])
        transactionSender.getAddressInfos = mockGAI.bind(transactionSender)
        const tx = Transaction.fromObject(transcationObject)
        await expect(transactionSender.signMultisig(fakeWallet.id, tx, '1234', [])).rejects.toThrowError(
          new MultisigConfigNeedError()
        )
      })

      it('throw exception no matched multisig config addresses', async () => {
        const addresses = [
          'ckt1qyq89x5ggpt0a5epm2k2gyxeffwkgfdxeg0s543mh4',
          'ckt1qyqql0vgjyxjxjxknkj6nq8jxa485xsyl66sy7c5f6',
        ]
        const noMatchAddress = 'ckt1qyqf5v66n4vrxu75kks2ku06g7trnkdwt52s8000ee'
        const [multiArgs, multisigConfig] = createMultisigConfig(1, 1, addresses)
        const addr = {
          walletId: fakeWallet.id,
          address: noMatchAddress,
          blake160: helpers.addressToScript(noMatchAddress, {config: config.predefined.AGGRON4}).args,
          version: 'testnet',
        }

        const mockGAI = jest.fn()
        mockGAI.mockReturnValueOnce([addr])
        transactionSender.getAddressInfos = mockGAI.bind(transactionSender)

        const tx = Transaction.fromObject(transcationObject)
        tx.inputs[0]!.setLock(SystemScriptInfo.generateMultiSignScript(multiArgs))
        await expect(transactionSender.signMultisig(fakeWallet.id, tx, '1234', [multisigConfig])).rejects.toThrow(
          new NoMatchAddressForSign()
        )
      })

      describe('sign with hard wallet', () => {
        beforeEach(() => {
          stubbedGetWallet.mockReturnValue({
            ...fakeWallet,
            isHardware() {
              return true
            },
          })
        })

        it('m is 1', async () => {
          const witnessLock = '0'.repeat(130)
          stubbedHardWalletGetCurrent.mockReturnValueOnce({
            signTransaction: jest.fn().mockResolvedValueOnce(witnessLock),
          })
          const addresses = [
            'ckt1qyq89x5ggpt0a5epm2k2gyxeffwkgfdxeg0s543mh4',
            'ckt1qyqql0vgjyxjxjxknkj6nq8jxa485xsyl66sy7c5f6',
          ]
          const [multiArgs, multisigConfig] = createMultisigConfig(1, 1, addresses)
          const addr = {
            walletId: fakeWallet.id,
            path: `m/44'/309'/0'/0/0`,
            blake160: helpers.addressToScript(addresses[0], {config: config.predefined.AGGRON4}).args,
            version: 'testnet',
          }

          const mockGAI = jest.fn()
          mockGAI.mockReturnValueOnce([addr])
          transactionSender.getAddressInfos = mockGAI.bind(transactionSender)
          const tx = Transaction.fromObject(transcationObject)
          tx.inputs[0]!.setLock(SystemScriptInfo.generateMultiSignScript(multiArgs))
          const res = await transactionSender.signMultisig(fakeWallet.id, tx, '1234', [multisigConfig])
          const witness = {
            inputType: undefined,
            outputType: undefined,
            lock:
              Multisig.serialize(
                addresses.map(v => {
                  const isMainnet = v.startsWith('ckb')
                  const lumosOptions = isMainnet ? config.predefined.LINA : config.predefined.AGGRON4;
                  return  helpers.addressToScript(v, {config: lumosOptions}).args
                }),
                1,
                1,
                2
              ) + witnessLock,
          }
          const expectedValue = bytes.hexify(blockchain.WitnessArgs.pack(witness))
          expect(res.witnesses[0]).toBe(expectedValue)
        })
      })

      it(`input cell's length is 2`, async () => {
        const addresses = [
          'ckt1qyq89x5ggpt0a5epm2k2gyxeffwkgfdxeg0s543mh4',
          'ckt1qyqql0vgjyxjxjxknkj6nq8jxa485xsyl66sy7c5f6',
        ]
        const [multiArgs, multisigConfig] = createMultisigConfig(1, 1, addresses)
        const addr = {
          walletId: fakeWallet.id,
          path: `m/44'/309'/0'/0/0`,
          blake160: helpers.addressToScript(addresses[0], {config: config.predefined.AGGRON4}).args,
          version: 'testnet',
        }

        const mockGAI = jest.fn()
        mockGAI.mockReturnValueOnce([addr])
        transactionSender.getAddressInfos = mockGAI.bind(transactionSender)
        const tx = Transaction.fromObject(transcationObject)
        tx.inputs[0]!.setLock(SystemScriptInfo.generateMultiSignScript(multiArgs))
        tx.inputs.push(
          Input.fromObject({
            previousOutput: OutPoint.fromObject({
              txHash: '0x1879851943fa686af29bed5c95acd566d0244e7b3ca89cf7c435622a5a5b4cb3',
              index: '0x0',
            }),
            since: '0x0',
            lock: Script.fromObject({
              args: multiArgs,
              codeHash: SystemScriptInfo.MULTI_SIGN_CODE_HASH,
              hashType: SystemScriptInfo.MULTI_SIGN_HASH_TYPE,
            }),
          })
        )
        tx.witnesses = ['0x', '0x']
        const res = await transactionSender.signMultisig(fakeWallet.id, tx, '1234', [multisigConfig])
        expect(res.witnesses).toHaveLength(2)
        expect(res.witnesses[1]).toBe('0x')
        expect(res.witnesses[0]).toBe(
          '0x810000001000000081000000810000006d00000000010102729a884056fed321daaca410d94a5d6425a6ca1f0fbd88910d2348d69da5a980f2376a7a1a04feb595163e5edf15f297453a64f3248c69823afcfdaabc6771b088e4f6250e2e2f91136f5c6a9cbf49a79d955644d7381481f3c5c8ab93bcc52a71de4b072e0697c001'
        )
      })
    })
  })
})
