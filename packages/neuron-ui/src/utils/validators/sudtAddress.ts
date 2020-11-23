import { ckbCore } from 'services/chain'
import { FieldRequiredException, FieldInvalidException, AddressDeprecatedException } from 'exceptions'
import { LONG_TYPE_PREFIX } from 'utils/const'
import { DeprecatedScript } from 'utils/enums'
import { validateAddress } from './address'

export const validateSUDTAddress = ({
  address,
  codeHash = '',
  isMainnet,
  required = false,
}: {
  address: string
  codeHash?: string
  isMainnet: boolean
  required?: boolean
}) => {
  const FIELD_NAME = 'address'
  if (address) {
    validateAddress(address, isMainnet)
    const parsed = ckbCore.utils.parseAddress(address, 'hex')

    if ([DeprecatedScript.AcpOnAggron, DeprecatedScript.AcpOnLina].some(script => parsed.startsWith(script))) {
      throw new AddressDeprecatedException()
    }

    if (!parsed.startsWith(LONG_TYPE_PREFIX)) {
      throw new FieldInvalidException(FIELD_NAME)
    }

    const CODE_HASH_LENGTH = 64
    const codeHashOfAddr = parsed.substr(4, CODE_HASH_LENGTH)
    if (codeHash && codeHashOfAddr !== codeHash.slice(2)) {
      throw new FieldInvalidException(FIELD_NAME)
    }
    const ARGS_LENGTH = 40
    const minimums = parsed.slice(4 + CODE_HASH_LENGTH + ARGS_LENGTH)
    if (minimums && ((minimums.length !== 2 && minimums.length !== 4) || Number.isNaN(+`0x${minimums}`))) {
      throw new FieldInvalidException(FIELD_NAME)
    }
  } else if (required) {
    throw new FieldRequiredException(FIELD_NAME)
  }
  return true
}

export default validateSUDTAddress
