import CKBCore from '@nervosnetwork/ckb-sdk-core'

export const ckbCore = new CKBCore('')
export const { getHeader, getBlockchainInfo, getTipHeader, getHeaderByNumber, getFeeRateStats, getTransaction } =
  ckbCore.rpc

export default {
  ckbCore,
  getHeader,
  getTipHeader,
  getTransaction,
  getFeeRateStats,
}
