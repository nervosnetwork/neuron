import type OfflineSignController from '../../src/controllers/offline-sign'
import { SignStatus, SignType } from '../../src/models/offline-sign'
import { connectDeviceFailed, OfflineSignFailed } from '../../src/exceptions'

const stubbedElectronShowSaveDialog = jest.fn()
const stubbedElectronShowErrorBox = jest.fn()
const stubbedElectronShowMessageBox = jest.fn()
const stubbedReadfileSync = jest.fn()
const stubbedTransactionSenderSign = jest.fn()
const stubbedAssetAccountControllerSend = jest.fn()
const stubbedAnyoneCanPayControllerSend = jest.fn()
const stubbedWalletsControllerSend = jest.fn()

function resetMocks() {
  stubbedElectronShowErrorBox.mockReset()
  stubbedElectronShowSaveDialog.mockReset()
  stubbedReadfileSync.mockReset()
  stubbedElectronShowMessageBox.mockReset()
  stubbedTransactionSenderSign.mockReset()
  stubbedAssetAccountControllerSend.mockReset()
  stubbedAnyoneCanPayControllerSend.mockReset()
  stubbedWalletsControllerSend.mockReset()
}


describe('OfflineSignController', () => {
  let offlineSignController: OfflineSignController
  const mockTransaction = {
    "cellDeps": [
      {
        "outPoint": {
          "txHash": "0xf8de3bb47d055cdf460d93a2a6e1b05f7432f9777c8c474abf4eec1d4aee5d37",
          "index": "0"
        },
        "depType": "depGroup"
      },
      {
        "outPoint": {
          "txHash": "0xc1b2ae129fad7465aaa9acc9785f842ba3e6e8b8051d899defa89f5508a77958",
          "index": "0"
        },
        "depType": "code"
      },
      {
        "outPoint": {
          "txHash": "0x4f32b3e39bd1b6350d326fdfafdfe05e5221865c3098ae323096f0bfc69e0a8c",
          "index": "0"
        },
        "depType": "depGroup"
      }
    ],
    "headerDeps": [],
    "inputs": [],
    "outputs": [
      {
        "capacity": "14200000000",
        "lock": {
          "args": "0x8830a6e1db602cf8d37f5fd825c6a11c1ccd53a9",
          "codeHash": "0x86a1c6987a4acbe1a887cca4c9dd2ac9fcb07405bbeda51b861b18bbf7492c4b",
          "hashType": "type"
        },
        "type": {
          "args": "0xb58a6fa6f2c57ed45fbdfc7fcebd5c79575590ecf190b72fa6e6a767d57cb105",
          "codeHash": "0x48dbf59b4c7ee1547238021b4869bceedf4eea6b43772e5d66ef8865b6ae7212",
          "hashType": "data"
        },
        "lockHash": "0xe3f6ab9a880a87ea44b10ebb6d70bac1e08ac7dfb36b754d68d15d986cf54823",
        "typeHash": "0x7be5dd445f388c5f58b06b90cec6db09f70e47e2c6fc9c7547f2826066ba25e3",
        "data": "0x2c420f00000000000000000000000000"
      },
      {
        "capacity": "14200000000",
        "lock": {
          "args": "0x913c4f626f96b01c039a650819b0fb718ef5ad42",
          "codeHash": "0x86a1c6987a4acbe1a887cca4c9dd2ac9fcb07405bbeda51b861b18bbf7492c4b",
          "hashType": "type"
        },
        "type": {
          "args": "0xb58a6fa6f2c57ed45fbdfc7fcebd5c79575590ecf190b72fa6e6a767d57cb105",
          "codeHash": "0x48dbf59b4c7ee1547238021b4869bceedf4eea6b43772e5d66ef8865b6ae7212",
          "hashType": "data"
        },
        "lockHash": "0x1a729562de95cf74255da6d4a0fcf173b6d7d293452903a7290b4c0122fdd2a6",
        "typeHash": "0x7be5dd445f388c5f58b06b90cec6db09f70e47e2c6fc9c7547f2826066ba25e3",
        "outPoint": {
          "txHash": "0x156ac1ddf502f121790ba316889dfb89f2c4b99f37b1af3afadc121187f87070",
          "index": "1"
        },
        "data": "0x94841e00000000000000000000000000"
      },
      {
        "capacity": "19999998970",
        "lock": {
          "args": "0x8830a6e1db602cf8d37f5fd825c6a11c1ccd53a9",
          "codeHash": "0x9bd7e06f3ecf4be0f2fcd2188b23f1b9fcc88e5d4b65a8637b17723bbda3cce8",
          "hashType": "type"
        },
        "lockHash": "0x0986ec9d96d5bfc7a98c9f064c684e09d9afad4952f720a7e47cda73a1389c1c",
        "data": "0x"
      }
    ],
    "witnesses": [],
    "description": "",
    "nervosDao": false,
    "hash": "0x0213376e870aed74969a3f64d1e71eba88e9c0185d371e0f1ad5e6319a3fdaf4",
    "version": "0",
    "fee": "1030",
    "outputsData": [
      "0x2c420f00000000000000000000000000",
      "0x94841e00000000000000000000000000",
      "0x"
    ],
    "sudtInfo": {
      "amount": "20"
    }
  }

  const mockTxInstance = {
    toSDKRawTransaction() {
      return mockTransaction
    }
  }

  beforeEach(() => {
    resetMocks()

    jest.doMock('electron', () => {
      return {
        dialog: {
          showSaveDialog: stubbedElectronShowSaveDialog,
          showErrorBox: stubbedElectronShowErrorBox,
          showMessageBox: stubbedElectronShowMessageBox
        }
      }
    })

    jest.doMock('fs', () => {
      return {
        writeFileSync: jest.fn()
      }
    })

    jest.doMock('models/chain/transaction', () => {
      return class {
        static fromObject() {
          return mockTxInstance
        }
      }
    })

    jest.doMock('services/node', () => {
      return class {
        static getInstance() {
          return {
            ckb: {
              rpc: {
                paramsFormatter: {
                  toRawTransaction: (tx: any) => tx
                }
              }
            }
          }
        }
      }
    })

    jest.doMock('services/transaction-sender', () => {
      return jest.fn().mockImplementation(
        () => ({
          sign: stubbedTransactionSenderSign
        })
      )
    })

    jest.doMock('../../src/controllers/asset-account', () => {
      return jest.fn().mockImplementation(
        () => ({
          sendCreateTx: stubbedAssetAccountControllerSend
        })
      )
    })

    jest.doMock('../../src/controllers/anyone-can-pay', () => {
      return jest.fn().mockImplementation(
        () => ({
          sendTx: stubbedAnyoneCanPayControllerSend
        })
      )
    })

    jest.doMock('../../src/controllers/wallets', () => {
      return jest.fn().mockImplementation(
        () => ({
          sendTx: stubbedWalletsControllerSend
        })
      )
    })

    const OfflineSignController = require('../../src/controllers/offline-sign').default
    offlineSignController = new OfflineSignController()
  })

  describe('exportTransactionAsJSON', () => {
    beforeEach(() => {
      resetMocks()
    })

    describe('it throws', () => {
      beforeEach(() => {
        resetMocks()
      })

      it('throws if user cancel', async () => {
        stubbedElectronShowSaveDialog.mockReturnValue({
          canceled: true
        })

        expect(offlineSignController.exportTransactionAsJSON({} as any)).rejects.toThrow()
      })

      it('throws if file path is not provider', async () => {
        stubbedElectronShowSaveDialog.mockReturnValue({
          canceled: false
        })

        expect(offlineSignController.exportTransactionAsJSON({} as any)).rejects.toThrow()
      })
    })

    describe('it works', () => {
      beforeEach(() => {
        resetMocks()
      })

      it('should work with signed JSON', async () => {
        stubbedElectronShowSaveDialog.mockReturnValue({
          canceled: false,
          filePath: 'filePath.json'
        })
        const res = await offlineSignController.exportTransactionAsJSON({
          transaction: mockTransaction,
          status: SignStatus.Signed,
          context: [],
          type: SignType.Regular,
        } as any)

        expect(res.result).toEqual({
          transaction: mockTransaction,
          status: 'Signed',
          context: [],
          type: SignType.Regular,
        })
      })

      it('should work with unsigned JSON', async () => {
        stubbedElectronShowSaveDialog.mockReturnValue({
          canceled: false,
          filePath: 'filePath.json'
        })
        const res = await offlineSignController.exportTransactionAsJSON({
          transaction: mockTransaction,
          status: SignStatus.Unsigned,
          type: SignType.Regular,
        } as any)

        expect(res.result).toEqual({
          transaction: mockTransaction,
          status: SignStatus.Unsigned,
          type: SignType.Regular,
          context: []
        })
      })
    })
  })

  describe('signTransaction', () => {
    beforeEach(() => {
      resetMocks()
    })

    describe('throw error properly', () => {
      beforeEach(() => {
        resetMocks()

        stubbedElectronShowSaveDialog.mockReturnValue({
          canceled: false,
          filePath: 'filePath.json'
        })
      })

      it('throws original error', async () => {
        stubbedTransactionSenderSign.mockImplementation(() => {
          throw new connectDeviceFailed()
        })

        expect(offlineSignController.signTransaction({
          transaction: mockTransaction,
          status: SignStatus.Unsigned,
          type: SignType.Regular,
        } as any)).rejects.toThrowError(new connectDeviceFailed())
      })

      it('throws OfflineSignFailed error if error code is not provide', () => {
        stubbedTransactionSenderSign.mockImplementation(() => {
          throw new Error('')
        })

        expect(offlineSignController.signTransaction({
          transaction: mockTransaction,
          status: SignStatus.Unsigned,
          type: SignType.Regular,
        } as any)).rejects.toThrowError(new OfflineSignFailed())
      })
    })

    describe('it works', () => {
      beforeEach(() => {
        resetMocks()

        stubbedElectronShowSaveDialog.mockReturnValue({
          canceled: false,
          filePath: 'filePath.json'
        })

        stubbedTransactionSenderSign.mockReturnValue(mockTransaction)
      })

      it('sign status should change to `signed`', async () => {
        const res = await offlineSignController.signTransaction({
          transaction: mockTransaction,
          status: SignStatus.Unsigned,
          type: SignType.Regular,
        } as any)

        expect(res.result.status).toBe(SignStatus.Signed)
      })

      it('return the correct tx', async () => {
        const { result } = await offlineSignController.signTransaction({
          transaction: mockTransaction,
          status: SignStatus.Unsigned,
          type: SignType.Regular,
        } as any)

        expect(result.transaction).toEqual(mockTransaction)
        expect(result.type).toEqual(SignType.Regular)
      })

      it('should skip first input is signType is `SendSUDT`', async () => {
        await offlineSignController.signTransaction({
          transaction: mockTransaction,
          status: SignStatus.Unsigned,
          type: SignType.SendSUDT,
        } as any)

        const skipFirstInput = 1

        expect(stubbedTransactionSenderSign).toHaveBeenCalledWith(
          undefined,
          mockTxInstance,
          undefined,
          skipFirstInput,
          undefined
        )
      })
    })
  })

  describe('signAndExportTransaction', () => {
    describe('it works', () => {
      beforeEach(() => {
        resetMocks()

        stubbedElectronShowSaveDialog.mockReturnValue({
          canceled: false,
          filePath: 'filePath.json'
        })

        stubbedTransactionSenderSign.mockReturnValue(mockTransaction)
      })

      it('should signed', async () => {
        const { result } = await offlineSignController.signAndExportTransaction({
          transaction: mockTransaction,
          status: SignStatus.Unsigned,
          type: SignType.SendSUDT,
        } as any)

        expect(result.transaction).toEqual(mockTransaction)
        expect(result.status).toEqual(SignStatus.Signed)
        expect(result.type).toEqual(SignType.SendSUDT)
      })
    })
  })

  describe('broadcastTransaction', () => {
    beforeEach(() => {
      resetMocks()
    })

    describe('brocast according the signType', () => {
      beforeEach(() => {
        resetMocks()
      })

      it('CreateSUDTAccount', async () => {
        await offlineSignController.broadcastTransaction({
          transaction: mockTransaction,
          status: SignStatus.Signed,
          type: SignType.CreateSUDTAccount,
        } as any)

        expect(stubbedAssetAccountControllerSend).toHaveBeenCalled()
      })

      it('SendSUDT', async () => {
        await offlineSignController.broadcastTransaction({
          transaction: mockTransaction,
          status: SignStatus.Signed,
          type: SignType.SendSUDT,
        } as any)

        expect(stubbedAnyoneCanPayControllerSend).toHaveBeenCalled()
      })

      it('DAO', async () => {
        await offlineSignController.broadcastTransaction({
          transaction: mockTransaction,
          status: SignStatus.Signed,
          type: SignType.UnlockDAO,
        } as any)

        expect(stubbedWalletsControllerSend).toHaveBeenCalled()
      })

      it('Regular', async () => {
        await offlineSignController.broadcastTransaction({
          transaction: mockTransaction,
          status: SignStatus.Signed,
          type: SignType.Regular,
        } as any)

        expect(stubbedWalletsControllerSend).toHaveBeenCalled()
      })
    })
  })
})
