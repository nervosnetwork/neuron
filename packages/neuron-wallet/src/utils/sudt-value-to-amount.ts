import { formatUnit } from '@ckb-lumos/lumos/utils'

const sudtValueToAmount = (value: string | null = '0', decimal: string | null = '') => {
  return value === null || value === '0'
    ? '+0'
    : decimal === null || Number.isNaN(+value) || Number.isNaN(+decimal)
    ? '--'
    : `${+value >= 0 ? '+' : ''}${formatUnit(BigInt(value), +decimal)}`
}

export default sudtValueToAmount
