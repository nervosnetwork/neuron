import { remoteApi } from './remoteApiWrapper'

export const getSpecialAssets = remoteApi<Controller.GetSpecialAssetsParams>('get-customized-asset-cells')
export const unlockSpecialAsset = remoteApi<Controller.UnlockSpecialAssetParams>('generate-withdraw-customized-cell-tx')
export const destroyAssetAccount = remoteApi<Controller.GetSUDTAccount.Params>('generate-destroy-asset-account-tx')
