import { remoteApi } from './remoteApiWrapper'

export const getSpecialAssets = remoteApi<Controller.GetSpeicalAssetsParams>('get-customized-asset-cells')
export const unlockSpecialAsset = remoteApi<Controller.UnlockSpecialAssetParams>('generate-withdraw-customized-cell-tx')
export const destoryCKBAssetAccount = remoteApi<Controller.GetSUDTAccount.Params>('generate-destroy-ckb-account-tx')
