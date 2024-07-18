import { type CKBComponents } from '@ckb-lumos/lumos/rpc'

export const outPointToStr = (value: CKBComponents.OutPoint): string => {
  return `${value.txHash}_${value.index}`
}

export const strToOutPoint = (value: string): CKBComponents.OutPoint => {
  const [txHash, index] = value.split('_')
  return {
    txHash,
    index,
  }
}
