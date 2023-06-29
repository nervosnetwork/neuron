import CKBCore from '@nervosnetwork/ckb-sdk-core'

export const ckbCore = new CKBCore('')
export const { getHeader, getBlockchainInfo, getTipHeader, getHeaderByNumber, getFeeRateStats, getTransaction } =
  ckbCore.rpc

export const { calculateDaoMaximumWithdraw } = ckbCore

export const { toUint64Le, parseEpoch } = ckbCore.utils

export default {
  ckbCore,
  getHeader,
  getTipHeader,
  getTransaction,
  toUint64Le,
  getFeeRateStats,
}
