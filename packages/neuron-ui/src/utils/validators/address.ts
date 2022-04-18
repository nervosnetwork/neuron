import { ckbCore } from 'services/chain'
import {
  FieldInvalidException,
  MainnetAddressRequiredException,
  TestnetAddressRequiredException,
  AddressEmptyException,
  AddressNotMatchException,
} from 'exceptions'
import {
  NEW_LONG_ADDR_PREFIX,
  LONG_DATA_PREFIX,
  LONG_TYPE_PREFIX,
  SHORT_ADDR_LENGTH,
  SHORT_ADDR_DEFAULT_LOCK_PREFIX,
  SHORT_ADDR_MULTISIGN_LOCK_PREFIX,
  SHORT_ADDR_SUDT_LOCK_PREFIX,
} from 'utils/const'
import {
  DefaultLockInfo,
  MultiSigLockInfo,
  LocktimeLockInfo,
  AnyoneCanPayLockInfoOnAggron,
  AnyoneCanPayLockInfoOnLina,
  ChequeLockInfoOnAggron,
  ChequeLockInfoOnLina,
} from '../enums'

export const validateAddress = (address: string, isMainnet: boolean): boolean => {
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

  if (
    parsed.startsWith(LONG_DATA_PREFIX) ||
    parsed.startsWith(LONG_TYPE_PREFIX) ||
    parsed.startsWith(NEW_LONG_ADDR_PREFIX)
  ) {
    return true
  }

  if (
    (!parsed.startsWith(SHORT_ADDR_DEFAULT_LOCK_PREFIX) &&
      !parsed.startsWith(SHORT_ADDR_MULTISIGN_LOCK_PREFIX) &&
      !parsed.startsWith(SHORT_ADDR_SUDT_LOCK_PREFIX)) ||
    address.length !== SHORT_ADDR_LENGTH
  ) {
    throw new FieldInvalidException(FIELD_NAME, address)
  }

  return true
}

const addressTagMap = {
  [DefaultLockInfo.TagName]: [DefaultLockInfo, DefaultLockInfo],
  [MultiSigLockInfo.TagName]: [MultiSigLockInfo, MultiSigLockInfo],
  [LocktimeLockInfo.TagName]: [LocktimeLockInfo, LocktimeLockInfo],
  [AnyoneCanPayLockInfoOnAggron.TagName]: [AnyoneCanPayLockInfoOnLina, AnyoneCanPayLockInfoOnAggron],
  [ChequeLockInfoOnAggron.TagName]: [ChequeLockInfoOnLina, ChequeLockInfoOnAggron],
}

export function validateSpecificAddress(address: string, isMainnet: boolean, tagName: keyof typeof addressTagMap) {
  validateAddress(address, isMainnet)
  const script = ckbCore.utils.addressToScript(address)
  const lockInfo = addressTagMap[tagName][isMainnet ? 1 : 0] // first is lock on Lina
  if (script.codeHash !== lockInfo.CodeHash || script.hashType !== lockInfo.HashType) {
    throw new AddressNotMatchException(tagName)
  }
  return true
}
export default validateAddress
