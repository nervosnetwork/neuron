import { CKBToShannonFormatter } from 'utils/formatters'
import { CapacityTooSmallException } from 'exceptions'
import { bytes as byteUtils } from '@ckb-lumos/lumos/codec'
import { addressToScript } from 'utils'

export const validateCapacity = (item: State.Output) => {
  const { amount, unit, address } = item
  const capacity = CKBToShannonFormatter(amount, unit)
  const script = addressToScript(address as string)
  const size = 1 + byteUtils.concat(script.args, script.codeHash).byteLength
  const outputSize = 8 + byteUtils.bytify('0x').byteLength + size

  if (BigInt(capacity) < BigInt(outputSize) * BigInt(10 ** 8)) {
    throw new CapacityTooSmallException(outputSize.toString())
  }

  return true
}
export default validateCapacity
