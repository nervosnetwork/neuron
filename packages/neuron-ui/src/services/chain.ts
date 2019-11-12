import CKBCore from '@nervosnetwork/ckb-sdk-core'

export const ckbCore = new CKBCore('')
export const { getBlockchainInfo, getTipHeader, getBlockByNumber } = ckbCore.rpc

export default {
  ckbCore,
  getBlockchainInfo,
  getTipHeader,
  getBlockByNumber,
}
