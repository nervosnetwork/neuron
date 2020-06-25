import { DEFAULT_SUDT_FIELDS, TOKEN_ID_LENGTH } from 'utils/const'
import { FieldRequiredException, FieldInvalidException } from 'exceptions'

export const validateTokenId = ({
  tokenId,
  isCKB = false,
  required = false,
}: {
  tokenId: string
  isCKB: boolean
  required: boolean
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

  if (!isCKB && tokenId.startsWith('0x') && tokenId.length === TOKEN_ID_LENGTH && !Number.isNaN(+tokenId)) {
    return true
  }

  throw new FieldInvalidException('token-id')
}

export default validateTokenId
