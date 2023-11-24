import { remoteApi } from './remoteApiWrapper'

// eslint-disable-next-line import/prefer-default-export
export const generateSporeSendTransaction = remoteApi<
  Controller.CreateNFTSendTransaction.Params,
  Controller.CreateNFTSendTransaction.Response
>('generate-transfer-spore-tx')
