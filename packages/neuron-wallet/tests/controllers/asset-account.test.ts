import { SyncStatus } from '../../src/controllers/sync-api'
import { ServiceHasNoResponse } from '../../src/exceptions'

const stubbedGetSyncStatus = jest.fn()
const stubbedGetAllWindows = jest.fn()
const stubbedGetFocusedWindow = jest.fn()
const stubbedShowMessageBox = jest.fn()
const stubbedGenerateMigrateLegacyACPTx = jest.fn()
const stubbedCommandSubjectNext = jest.fn()
const stubbedAssetAccountServiceGetAccount = jest.fn()
const stubbedAssetAccountServiceDestroyAssetAccount = jest.fn()

const resetMocks = () => {
  stubbedGetSyncStatus.mockReset()
  stubbedGetAllWindows.mockReset()
  stubbedShowMessageBox.mockReset()
  stubbedGetFocusedWindow.mockReset()
  stubbedGenerateMigrateLegacyACPTx.mockReset()
  stubbedCommandSubjectNext.mockReset()
  stubbedAssetAccountServiceGetAccount.mockReset()
  stubbedAssetAccountServiceDestroyAssetAccount.mockReset()
}

jest.mock('../../src/services/settings', () => {
  return {
    getInstance() {
      return {}
    },
  }
})

describe('AssetAccountController', () => {
  let assetAccountController: any
  let AssetAccountController: any
  const walletId = 'w1'

  jest.doMock('electron', () => {
    return {
      BrowserWindow: {
        getAllWindows: stubbedGetAllWindows,
        getFocusedWindow: stubbedGetFocusedWindow,
      },
      dialog: {
        showMessageBox: stubbedShowMessageBox,
      },
    }
  })

  jest.doMock('../../src/services/wallets', () => {
    return {
      getInstance: () => ({
        getCurrent: () => ({ id: walletId }),
      }),
    }
  })

  jest.doMock('../../src/controllers/sync-api', () => ({
    __esModule: true,
    default: {
      getInstance: () => ({
        getSyncStatus: stubbedGetSyncStatus,
      }),
    },
    SyncStatus: SyncStatus,
  }))

  jest.doMock('../../src/services/tx', () => ({
    TransactionGenerator: {
      generateMigrateLegacyACPTx: stubbedGenerateMigrateLegacyACPTx,
    },
  }))

  jest.doMock('../../src/models/subjects/command', () => ({
    next: stubbedCommandSubjectNext,
  }))

  jest.doMock('../../src/services/asset-account-service.ts', () => ({
    getAccount: stubbedAssetAccountServiceGetAccount,
    destroyAssetAccount: stubbedAssetAccountServiceDestroyAssetAccount,
  }))

  beforeEach(() => {
    resetMocks()
    AssetAccountController = require('../../src/controllers/asset-account').default
    assetAccountController = new AssetAccountController()
  })
  describe('destroyAssetAccount', () => {
    const params = {
      walletID: 'walletID',
      id: 1,
    }
    it('no AssetAccount', async () => {
      stubbedAssetAccountServiceGetAccount.mockResolvedValueOnce(undefined)
      await expect(assetAccountController.destroyAssetAccount(params)).rejects.toThrow(
        new ServiceHasNoResponse('AssetAccount')
      )
    })
    it('execute success', async () => {
      stubbedAssetAccountServiceGetAccount.mockResolvedValueOnce({})
      stubbedAssetAccountServiceDestroyAssetAccount.mockResolvedValueOnce({})
      await assetAccountController.destroyAssetAccount(params)
      expect(stubbedAssetAccountServiceDestroyAssetAccount).toHaveBeenCalledWith(params.walletID, {})
    })
  })
})
