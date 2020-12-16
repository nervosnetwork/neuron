import OfflineSign, { SignType, SignStatus } from '../../src/models/offline-sign'

describe('OfflineSign', () => {
  const json = {
    transaction: {} as any,
    type: SignType.Regular,
    status: SignStatus.Unsigned,
    context: []
  }

  const jsonWithAssetAccount = {
    ...json,
    asset_account: {
      tokenID: 'tokenID'
    } as any
  }

  const allPropsJSON = {
    ...jsonWithAssetAccount,
    description: 'description'
  }

  describe('fromJSON', () => {
    it('should work without assetAcount', () => {
      const model = OfflineSign.fromJSON(json)
      expect(model.assetAccount).toBe(undefined)
    })

    it('should work without description', () => {
      const model = OfflineSign.fromJSON(json)
      expect(model.description).toBe('')
    })
  })

  describe('toJSON', () => {
    it('handle camel case properly', () => {
      const model = OfflineSign.fromJSON(jsonWithAssetAccount)

      expect(model.toJSON().asset_account).toEqual(model.assetAccount)
    })

    it('JSON should not have `description` key if init without it', () => {
      const model = OfflineSign.fromJSON(json)

      expect(model.toJSON().description).toBe(undefined)
    })
  })

  describe('setStatus', () => {
    it('it works', () => {
      const model = OfflineSign.fromJSON(allPropsJSON)
      model.setStatus(SignStatus.Signed)
      expect(model.status).toBe(SignStatus.Signed)
    })
  })
})
