import CKBCore from '@nervosnetwork/ckb-sdk-core'

export const ckbCore = new CKBCore('')
export const { getHeader, getBlock, getBlockchainInfo, getTipHeader, getHeaderByNumber, getFeeRateStats } = ckbCore.rpc

export const { calculateDaoMaximumWithdraw } = ckbCore

export const { toUint64Le, parseEpoch } = ckbCore.utils
export default {
  ckbCore,
  getBlock,
  getBlockchainInfo,
  getHeader,
  getTipHeader,
  getHeaderByNumber,
  calculateDaoMaximumWithdraw,
  toUint64Le,
  getFeeRateStats,
}
