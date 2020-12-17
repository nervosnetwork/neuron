import CKBCore from '@nervosnetwork/ckb-sdk-core'

export const ckbCore = new CKBCore('')
export const {
  getHeader,
  getBlock,
  getBlockchainInfo,
  getTipHeader,
  getHeaderByNumber,
  calculateDaoMaximumWithdraw,
} = ckbCore.rpc

export const { toUint64Le } = ckbCore.utils
export default {
  ckbCore,
  getBlock,
  getBlockchainInfo,
  getHeader,
  getTipHeader,
  getHeaderByNumber,
  calculateDaoMaximumWithdraw,
  toUint64Le,
}
