import { type CKBComponents } from '@ckb-lumos/lumos/rpc'

const CODE_HASH_LENGTH = 32
const HASH_TYPE_LENGTH = 1
const CAPACITY_LENGTH = 8

export const calculateUsedCapacity = (cell: CKBComponents.Cell & { data?: CKBComponents.Bytes }) => {
  const lockUsed = CODE_HASH_LENGTH + HASH_TYPE_LENGTH + cell.lock.args.slice(2).length / 2
  const typeUsed = cell?.type ? CODE_HASH_LENGTH + HASH_TYPE_LENGTH + cell.type.args.slice(2).length / 2 : 0
  const dataUsed = cell.data ? cell.data.slice(2).length / 2 : 0
  return lockUsed + typeUsed + dataUsed + CAPACITY_LENGTH
}

export default calculateUsedCapacity
