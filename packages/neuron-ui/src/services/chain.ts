import { CKBRPC } from '@ckb-lumos/rpc'

export const rpc = new CKBRPC('')

export const { getHeader, getBlockchainInfo, getTipHeader, getHeaderByNumber, getFeeRateStatistics, getTransaction } =
  rpc
