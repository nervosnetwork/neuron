import { remoteApi } from './remoteApiWrapper'

export const generateSUDTTransaction = remoteApi<Controller.GenerateSUDTTransaction.Params>(
  'generate-send-to-anyone-can-pay-tx'
)

export const generateSendAllSUDTTransaction = remoteApi<Controller.GenerateSendAllSUDTTransaction.Params>(
  'generate-send-all-to-anyone-can-pay-tx'
)

export const sendSUDTTransaction = remoteApi<Controller.SendSUDTTransaction.Params>('send-to-anyone-can-pay')
export default {
  generateSUDTTransaction,
  generateSendAllSUDTTransaction,
  sendSUDTTransaction,
}
