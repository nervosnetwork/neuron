import { formatUnit, ckbDecimals } from '@ckb-lumos/bi'

const shannonToCKB = (shannon: bigint) => {
  return new Intl.NumberFormat('en-US', {
    useGrouping: false,
    signDisplay: 'always',
    minimumFractionDigits: ckbDecimals,
    maximumFractionDigits: ckbDecimals,
  }).format(formatUnit(shannon, 'ckb') as any)
}

export default shannonToCKB
