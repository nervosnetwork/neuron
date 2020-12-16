import { remoteApi } from './remoteApiWrapper'

export const getAnyoneCanPayScript = remoteApi<void>('get-anyone-can-pay-script')

export const getTokenInfoList = remoteApi<void>('get-token-info-list')

export const getSUDTAccountList = remoteApi<Controller.GetSUDTAccountList.Params>('asset-accounts')

export const getSUDTAccount = remoteApi<Controller.GetSUDTAccount.Params>('get-asset-account')

export const generateCreateSUDTAccountTransaction = remoteApi<Controller.GenerateCreateSUDTAccountTransaction.Params>(
  'generate-create-asset-account-tx'
)

export const sendCreateSUDTAccountTransaction = remoteApi<Controller.SendCreateSUDTAccountTransaction.Params>(
  'send-create-asset-account-tx'
)

export const updateSUDTAccount = remoteApi<Controller.UpdateSUDTAccount.Params>('update-asset-account')

export const generateSUDTTransaction = remoteApi<Controller.GenerateSUDTTransaction.Params>(
  'generate-send-to-anyone-can-pay-tx'
)

export const generateSendAllSUDTTransaction = remoteApi<Controller.GenerateSendAllSUDTTransaction.Params>(
  'generate-send-all-to-anyone-can-pay-tx'
)

export const sendSUDTTransaction = remoteApi<Controller.SendSUDTTransaction.Params>('send-to-anyone-can-pay')

export const checkMigrateAcp = remoteApi<Controller.CheckMigrateAcp.Params, Controller.CheckMigrateAcp.Response>(
  'check-migrate-acp'
)

export const generateChequeTransaction = remoteApi<
  Controller.CreateChequeTransaction.Params,
  Controller.CreateChequeTransaction.Response
>('generate-create-cheque-tx')

export const migrateAcp = remoteApi<Controller.MigrateAcp.Params>('migrate-acp')
