import CKBCore from '@nervosnetwork/ckb-sdk-core'

export const ckbCore = new CKBCore('')
export const { getBlock, getBlockchainInfo, getTipHeader, getHeaderByNumber, calculateDaoMaximumWithdraw } = ckbCore.rpc

export default {
  ckbCore,
  getBlock,
  getBlockchainInfo,
  getTipHeader,
  getHeaderByNumber,
  calculateDaoMaximumWithdraw,
}
