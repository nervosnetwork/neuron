import { remoteApi } from './remoteApiWrapper'

export const generateChequeTransaction = remoteApi<
  Controller.CreateChequeTransaction.Params,
  Controller.CreateChequeTransaction.Response
>('generate-create-cheque-tx')

export const generateWithdrawChequeTransaction = remoteApi<
  Controller.GenerateWithdrawChequeTransaction.Params,
  Controller.GenerateWithdrawChequeTransaction.Response
>('generate-withdraw-cheque-tx')

export const sendWithdrawChequeTransaction = remoteApi<
  Controller.SendWithdrawChequeTransaction.Params,
  Controller.SendWithdrawChequeTransaction.Response
>('send-withdraw-cheque-tx')
