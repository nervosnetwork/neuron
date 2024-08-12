import { DEFAULT_SUDT_FIELDS, TOKEN_ID_LENGTH, XUDT_TOKEN_ID_LENGTH } from 'utils/const'
import { FieldRequiredException, FieldInvalidException } from 'exceptions'
import { UDTType } from 'utils/enums'

export const validateTokenId = ({
  tokenId,
  isCKB = false,
  required = false,
  udtType,
}: {
  tokenId: string
  isCKB: boolean
  required: boolean
  udtType?: UDTType
}) => {
  if (!tokenId) {
    if (required) {
      throw new FieldRequiredException('token-id')
    } else {
      return true
    }
  }

  if (isCKB && tokenId === DEFAULT_SUDT_FIELDS.CKBTokenId) {
    return true
  }

  const tokenLength = udtType === UDTType.SUDT ? [TOKEN_ID_LENGTH] : [TOKEN_ID_LENGTH, XUDT_TOKEN_ID_LENGTH]

  if (!isCKB && tokenId.startsWith('0x') && tokenLength.includes(tokenId.length) && !Number.isNaN(+tokenId)) {
    return true
  }

  throw new FieldInvalidException('token-id')
}

export default validateTokenId
