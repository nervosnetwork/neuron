import { ckbCore } from 'services/chain'
import { FieldRequiredException, FieldInvalidException, AddressDeprecatedException } from 'exceptions'
import {
  SHORT_ADDR_DEFAULT_LOCK_PREFIX,
  SHORT_ADDR_LENGTH,
  LONG_TYPE_PREFIX,
  SHORT_ADDR_SUDT_LOCK_PREFIX,
} from 'utils/const'
import { DeprecatedScript, AccountType } from 'utils/enums'
import { validateAddress } from './address'

export const validateAssetAccountAddress = ({
  address,
  isMainnet,
  required = false,
  type = AccountType.SUDT,
}: {
  address: string
  codeHash?: string
  isMainnet: boolean
  required?: boolean
  type?: AccountType
}) => {
  const FIELD_NAME = 'address'
  if (address) {
    validateAddress(address, isMainnet)
    const parsed = ckbCore.utils.parseAddress(address, 'hex')

    if (
      type === AccountType.SUDT &&
      parsed.startsWith(SHORT_ADDR_DEFAULT_LOCK_PREFIX) &&
      address.length === SHORT_ADDR_LENGTH
    ) {
      return true
    }

    if ([DeprecatedScript.AcpOnAggron, DeprecatedScript.AcpOnLina].some(script => parsed.startsWith(script))) {
      throw new AddressDeprecatedException()
    }

    const ARGS_LENGTH = 40
    let minimums = ''

    if (parsed.startsWith(LONG_TYPE_PREFIX)) {
      const CODE_HASH_LENGTH = 64
      if (parsed.length < LONG_TYPE_PREFIX.length + CODE_HASH_LENGTH + ARGS_LENGTH) {
        throw new FieldInvalidException(FIELD_NAME)
      }
      minimums = parsed.slice(LONG_TYPE_PREFIX.length + CODE_HASH_LENGTH + ARGS_LENGTH)
    } else if (parsed.startsWith(SHORT_ADDR_SUDT_LOCK_PREFIX)) {
      minimums = parsed.slice(SHORT_ADDR_SUDT_LOCK_PREFIX.length + ARGS_LENGTH)
    } else {
      throw new FieldInvalidException(FIELD_NAME)
    }

    if (minimums && ((minimums.length !== 2 && minimums.length !== 4) || Number.isNaN(+`0x${minimums}`))) {
      throw new FieldInvalidException(FIELD_NAME)
    }
  } else if (required) {
    throw new FieldRequiredException(FIELD_NAME)
  }
  return true
}

export default validateAssetAccountAddress
