import { remoteApi } from './remoteApiWrapper'

// eslint-disable-next-line import/prefer-default-export
export const generateNFTSendTransaction = remoteApi<
  Controller.CreateNFTSendTransaction.Params,
  Controller.CreateNFTSendTransaction.Response
>('generate-transfer-nft-tx')
