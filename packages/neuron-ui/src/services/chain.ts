import CKBCore from '@nervosnetwork/ckb-sdk-core'

export const ckbCore = new CKBCore('')
export const { getBlockchainInfo, getTipHeader, getHeaderByNumber } = ckbCore.rpc

export default {
  ckbCore,
  getBlockchainInfo,
  getTipHeader,
  getHeaderByNumber,
}
