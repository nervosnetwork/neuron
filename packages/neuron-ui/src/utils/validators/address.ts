import { ckbCore } from 'services/chain'
import {
  FieldInvalidException,
  MainnetAddressRequiredException,
  TestnetAddressRequiredException,
  AddressEmptyException,
} from 'exceptions'
import { SHORT_ADDR_00_LENGTH, SHORT_ADDR_00_PREFIX, LONG_DATA_PREFIX, LONG_TYPE_PREFIX } from 'utils/const'

export const validateAddress = (address: string, isMainnet?: boolean): boolean => {
  const FIELD_NAME = 'address'

  if (typeof address !== 'string') {
    throw new FieldInvalidException(FIELD_NAME, `${address}`)
  }

  if (!address) {
    throw new AddressEmptyException()
  }

  if (isMainnet === true && !address.startsWith('ckb')) {
    throw new MainnetAddressRequiredException()
  }

  if (isMainnet === false && !address.startsWith('ckt')) {
    throw new TestnetAddressRequiredException()
  }

  let parsed = ''

  try {
    parsed = ckbCore.utils.parseAddress(address, 'hex')
  } catch (err) {
    throw new FieldInvalidException(FIELD_NAME, address)
  }

  if (parsed.startsWith(LONG_DATA_PREFIX) || parsed.startsWith(LONG_TYPE_PREFIX)) {
    return true
  }

  if (!parsed.startsWith(SHORT_ADDR_00_PREFIX) || address.length !== SHORT_ADDR_00_LENGTH) {
    throw new FieldInvalidException(FIELD_NAME, address)
  }

  return true
}

export default validateAddress
