import CKBCore from '@nervosnetwork/ckb-sdk-core'

export const ckbCore = new CKBCore('')

ckbCore.rpc.addMethod({
  name: 'calculateDaoMaximumWithdraw',
  method: 'calculate_dao_maximum_withdraw',
  paramsFormatters: [ckbCore.rpc.paramsFormatter.toOutPoint, ckbCore.rpc.paramsFormatter.toHash],
})

export const { getBlockchainInfo, getTipHeader, getBlockByNumber } = ckbCore.rpc

export default {
  ckbCore,
  getBlockchainInfo,
  getTipHeader,
  getBlockByNumber,
}
