import { addressToScript } from '@ckb-lumos/helpers'
import { predefined } from '@ckb-lumos/config-manager'
import {
  FieldInvalidException,
  MainnetAddressRequiredException,
  TestnetAddressRequiredException,
  AddressEmptyException,
  AddressNotMatchException,
} from 'exceptions'
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

  try {
    return Boolean(addressToScript(address, { config: isMainnet ? predefined.LINA : predefined.AGGRON4 }))
  } catch (err) {
    throw new FieldInvalidException(FIELD_NAME, address)
  }
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
  const script = addressToScript(address, { config: isMainnet ? predefined.LINA : predefined.AGGRON4 })
  const lockInfo = addressTagMap[tagName][isMainnet ? 0 : 1] // first is lock on Lina
  if (script.codeHash !== lockInfo.CodeHash || script.hashType !== lockInfo.HashType) {
    throw new AddressNotMatchException(tagName)
  }
  return true
}

export default validateAddress
