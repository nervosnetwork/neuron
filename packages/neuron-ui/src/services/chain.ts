import CKBCore from '@nervosnetwork/ckb-sdk-core'

export const ckbCore = new CKBCore('')

export const { getTipBlockNumber } = ckbCore.rpc

export default {
  ckbCore,
  getTipBlockNumber,
}
