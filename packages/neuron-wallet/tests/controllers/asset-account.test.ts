
import {SyncStatus} from '../../src/controllers/sync-api'
import { ServiceHasNoResponse } from '../../src/exceptions'

const stubbedGetSyncStatus = jest.fn()
const stubbedGetAllWindows = jest.fn()
const stubbedGetFocusedWindow = jest.fn()
const stubbedShowMessageBox = jest.fn()
const stubbedGenerateMigrateLegacyACPTx = jest.fn()
const stubbedCommandSubjectNext = jest.fn()
const stubbedAssetAccountServiceGetAccount = jest.fn()
const stubbedAssetAccountServiceDestoryAssetAccount = jest.fn()

const resetMocks = () => {
  stubbedGetSyncStatus.mockReset()
  stubbedGetAllWindows.mockReset()
  stubbedShowMessageBox.mockReset()
  stubbedGetFocusedWindow.mockReset()
  stubbedGenerateMigrateLegacyACPTx.mockReset()
  stubbedCommandSubjectNext.mockReset()
  stubbedAssetAccountServiceGetAccount.mockReset()
  stubbedAssetAccountServiceDestoryAssetAccount.mockReset()
}

describe('AssetAccountController', () => {
  let assetAccountController: any;
  let AssetAccountController: any;
  const walletId = 'w1'

  jest.doMock('electron', () => {
    return {
      BrowserWindow : {
        getAllWindows: stubbedGetAllWindows,
        getFocusedWindow: stubbedGetFocusedWindow
      },
      dialog: {
        showMessageBox: stubbedShowMessageBox
      }
    }
  });

  jest.doMock('../../src/services/wallets', () => {
    return {
      getInstance : () => ({
        getCurrent: () => ({id: walletId})
      })
    }
  });

  jest.doMock('../../src/controllers/sync-api', () => ({
    __esModule: true,
    default: {
      getInstance: () => ({
        getSyncStatus: stubbedGetSyncStatus
      }),
    },
    SyncStatus: SyncStatus
  }));

  jest.doMock('../../src/services/tx', () => ({
    TransactionGenerator: {
      generateMigrateLegacyACPTx: stubbedGenerateMigrateLegacyACPTx
    }
  }));

  jest.doMock('../../src/models/subjects/command', () => ({
    next: stubbedCommandSubjectNext
  }));

  jest.doMock('../../src/services/asset-account-service.ts', () => ({
    getAccount: stubbedAssetAccountServiceGetAccount,
    destoryAssetAccount: stubbedAssetAccountServiceDestoryAssetAccount
  }))

  beforeEach(() => {
    resetMocks()
    AssetAccountController = require('../../src/controllers/asset-account').default
    assetAccountController = new AssetAccountController()
  });
  describe('#showACPMigrationDialog', () => {
    const mockStates = (syncStatus: any, windowsCount: any, hasFocusedWindow: any, hasTx: any) => {
      stubbedGetSyncStatus.mockResolvedValue(syncStatus)
      stubbedGetAllWindows.mockReturnValue(Array(windowsCount))
      stubbedGetFocusedWindow.mockReturnValue(hasFocusedWindow ? {id: '1'} : undefined)
      stubbedGenerateMigrateLegacyACPTx.mockResolvedValue(hasTx ? {} : null)
    }
    beforeEach(() => {
      stubbedShowMessageBox.mockResolvedValue({response: 1})
    });
    describe('when all conditions met to display dialog', () => {
      beforeEach(async () => {
        mockStates(SyncStatus.SyncCompleted, 1, true, true)
        await assetAccountController.showACPMigrationDialog()
      });
      it('broadcast migrate-acp command', () => {
        expect(stubbedCommandSubjectNext).toHaveBeenCalledWith({
          dispatchToUI: true, payload: "w1", type: "migrate-acp", winID: "1"
        })
      })
      describe('attempts to open dialog again', () => {
        beforeEach(async () => {
          stubbedCommandSubjectNext.mockReset()
          mockStates(SyncStatus.SyncCompleted, 1, true, true)
          await assetAccountController.showACPMigrationDialog()
        });
        it('should not broadcast migrate-acp command', () => {
          expect(stubbedCommandSubjectNext).not.toHaveBeenCalled()
        })
      });
      describe('force to open dialog again', () => {
        beforeEach(async () => {
          stubbedCommandSubjectNext.mockReset()
          mockStates(SyncStatus.SyncCompleted, 1, true, true)
          await assetAccountController.showACPMigrationDialog(true)
        });
        it('broadcast migrate-acp command', () => {
          expect(stubbedCommandSubjectNext).toHaveBeenCalledWith({
            dispatchToUI: true, payload: "w1", type: "migrate-acp", winID: "1"
          })
        })
      });
    });
    describe('when one of the conditions not met', () => {
      [
        [SyncStatus.SyncNotStart, 1, true, true],
        [SyncStatus.SyncPending, 1, true, true],
        [SyncStatus.Syncing, 1, true, true],
        [SyncStatus.SyncCompleted, 0, true, true],
        [SyncStatus.SyncCompleted, 2, true, true],
        [SyncStatus.SyncCompleted, 1, false, true],
        [SyncStatus.SyncCompleted, 1, true, false],
      ].forEach(([syncStatus, winCount, hasFocusedWindow, hasTx]) => {
        describe(`when SyncStatus: ${syncStatus}, winCount: ${winCount}, hasFocusedWindow: ${hasFocusedWindow}, hasTx: ${hasTx}`, () => {
          beforeEach(async () => {
            assetAccountController = new AssetAccountController()
            mockStates(syncStatus, winCount, hasFocusedWindow, hasTx)
            await assetAccountController.showACPMigrationDialog()
          });
          it('should not display again in the application session', () => {
            expect(stubbedCommandSubjectNext).not.toHaveBeenCalled()
          });
        });
      })
    });
  });
  describe('destoryAssetAccount', () => {
    const params = {
      walletID: 'walletID',
      id: 1
    }
    it('no AssetAccount', async () => {
      stubbedAssetAccountServiceGetAccount.mockResolvedValueOnce(undefined)
      await expect(assetAccountController.destoryAssetAccount(params)).rejects.toThrow(new ServiceHasNoResponse('AssetAccount'))
    })
    it('excute success', async () => {
      stubbedAssetAccountServiceGetAccount.mockResolvedValueOnce({})
      stubbedAssetAccountServiceDestoryAssetAccount.mockResolvedValueOnce({})
      await assetAccountController.destoryAssetAccount(params)
      expect(stubbedAssetAccountServiceDestoryAssetAccount).toHaveBeenCalledWith(params.walletID, {})
    })
  })
});
