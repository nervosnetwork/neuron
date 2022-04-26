import { ckbCore } from 'services/chain'
import { FieldRequiredException, FieldInvalidException, AddressDeprecatedException } from 'exceptions'
import { DEPRECATED_CODE_HASH } from 'utils/const'
import { isSecp256k1Address } from 'utils/is'
import { validateAddress } from './address'

/**
 * accept secp256k1 address for cheque txn and anyone-can-pay address(with locktime) for sudt/ckb asset txn
 */
export const validateAssetAccountAddress = ({
  address,
  isMainnet,
  required = false,
}: {
  address: string
  isMainnet: boolean
  required?: boolean
}) => {
  const FIELD_NAME = 'address'
  if (address) {
    validateAddress(address, isMainnet)

    if (isSecp256k1Address(address)) {
      return true
    }

    const lockScript = ckbCore.utils.addressToScript(address)

    if ([DEPRECATED_CODE_HASH.AcpOnAggron, DEPRECATED_CODE_HASH.AcpOnLina].includes(lockScript.codeHash)) {
      throw new AddressDeprecatedException()
    }

    const ARGS_LENGTH = 42

    if (lockScript.args.length < ARGS_LENGTH) {
      throw new FieldInvalidException(FIELD_NAME)
    }

    const minimums = lockScript.args.slice(ARGS_LENGTH)

    if (minimums && ((minimums.length !== 2 && minimums.length !== 4) || Number.isNaN(+`0x${minimums}`))) {
      throw new FieldInvalidException(FIELD_NAME)
    }
  } else if (required) {
    throw new FieldRequiredException(FIELD_NAME)
  }
  return true
}

export default validateAssetAccountAddress
