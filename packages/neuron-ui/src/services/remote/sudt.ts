import { remoteApi } from './remoteApiWrapper'

export const getSUDTAccountList = remoteApi<Controller.GetSUDTAccountList.Params>('asset-accounts')

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
export default {
  getSUDTAccountList,
  generateCreateSUDTAccountTransaction,
  sendCreateSUDTAccountTransaction,
  updateSUDTAccount,
  generateSUDTTransaction,
  generateSendAllSUDTTransaction,
  sendSUDTTransaction,
}
