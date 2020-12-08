import { useEffect } from 'react'
import { AccountType } from 'components/SUDTCreateDialog'
import { generateCreateSUDTAccountTransaction } from '../../services/remote'
import { ErrorCode } from '../enums'
import {
  MIN_CKB_REQUIRED_BY_CKB_SUDT,
  MIN_CKB_REQUIRED_BY_NORMAL_SUDT,
  SHANNON_CKB_RATIO,
  DEFAULT_SUDT_FIELDS,
  MEDIUM_FEE_RATE,
} from '../const'

interface IsInsufficientToCreateSudtAccountProps {
  walletId: string
  balance: bigint
  setInsufficient: React.Dispatch<Record<AccountType, boolean>>
}
export const useIsInsufficientToCreateSUDTAccount = ({
  walletId,
  balance,
  setInsufficient,
}: IsInsufficientToCreateSudtAccountProps) =>
  useEffect(() => {
    const createDummySUDTAccount = () => {
      if (balance <= BigInt(MIN_CKB_REQUIRED_BY_NORMAL_SUDT) * BigInt(SHANNON_CKB_RATIO)) {
        return true
      }
      const params: Controller.GenerateCreateSUDTAccountTransaction.Params = {
        walletID: walletId,
        tokenID: `0x${'0'.repeat(64)}`,
        tokenName: DEFAULT_SUDT_FIELDS.tokenName,
        accountName: DEFAULT_SUDT_FIELDS.accountName,
        symbol: DEFAULT_SUDT_FIELDS.symbol,
        decimal: '0',
        feeRate: `${MEDIUM_FEE_RATE}`,
      }
      return generateCreateSUDTAccountTransaction(params).catch(() => false)
    }
    const createDummyCKBAccount = () => {
      if (balance <= BigInt(MIN_CKB_REQUIRED_BY_CKB_SUDT) * BigInt(SHANNON_CKB_RATIO)) {
        return true
      }
      const params: Controller.GenerateCreateSUDTAccountTransaction.Params = {
        walletID: walletId,
        tokenID: DEFAULT_SUDT_FIELDS.CKBTokenId,
        tokenName: DEFAULT_SUDT_FIELDS.CKBTokenName,
        accountName: DEFAULT_SUDT_FIELDS.accountName,
        symbol: DEFAULT_SUDT_FIELDS.CKBSymbol,
        decimal: DEFAULT_SUDT_FIELDS.CKBDecimal,
        feeRate: `${MEDIUM_FEE_RATE}`,
      }
      return generateCreateSUDTAccountTransaction(params).catch(() => false)
    }

    Promise.all([createDummySUDTAccount(), createDummyCKBAccount()])
      .then(resList =>
        resList.map(res =>
          typeof res === 'boolean'
            ? res
            : [ErrorCode.CapacityNotEnough, ErrorCode.CapacityNotEnoughForChange].includes(res.status)
        )
      )
      .then(([insufficientToCreateSUDTAccount, insufficientToCreateCKBAccount]) => {
        setInsufficient({
          [AccountType.CKB]: insufficientToCreateCKBAccount,
          [AccountType.SUDT]: insufficientToCreateSUDTAccount,
        })
      })
  }, [walletId, balance, setInsufficient])

export default { useIsInsufficientToCreateSUDTAccount }
