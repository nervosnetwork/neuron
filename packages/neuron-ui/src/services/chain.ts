import { RPC } from '@ckb-lumos/lumos'

export const rpc = new RPC('')

export const { getHeader, getBlockchainInfo, getTipHeader, getHeaderByNumber, getFeeRateStatistics, getTransaction } =
  rpc
