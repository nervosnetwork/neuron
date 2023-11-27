import { CKBToShannonFormatter } from 'utils/formatters'
import { CapacityTooSmallException } from 'exceptions'
import { bytes as byteUtils } from '@ckb-lumos/codec'
import { ckbCore } from 'services/chain'

export const validateCapacity = (item: State.Output, isSendMax?: boolean, isLast?: boolean) => {
  const { amount, unit, address } = item
  const capacity = CKBToShannonFormatter(amount, unit)
  const script = ckbCore.utils.addressToScript(address as string)

  const size = 1 + byteUtils.concat(script.args, script.codeHash).byteLength
  const outputSize = 8 + byteUtils.bytify('0x').byteLength + size

  const judgement = isSendMax ? !isLast : true

  if (BigInt(capacity) < BigInt(outputSize) * BigInt(10 ** 8) && judgement) {
    throw new CapacityTooSmallException(outputSize.toString())
  }

  return true
}
export default validateCapacity
