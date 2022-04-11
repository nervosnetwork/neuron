import { TFunction } from 'i18next'
import { useCallback, useEffect, useState } from 'react'
import { useSUDTAccountInfoErrors } from 'utils'

export type TokenInfoType = Omit<Controller.GetTokenInfoList.TokenInfo, 'tokenID'> & {
  tokenId: string
  accountName: string
}

export const useTokenInfo = ({
  tokenInfo: findTokenInfo,
  t,
  sUDTAccounts,
  tokenId,
}: {
  tokenId?: string
  tokenInfo?: Controller.GetTokenInfoList.TokenInfo
  t: TFunction
  sUDTAccounts: State.SUDTAccount[]
}) => {
  const [tokenInfo, setTokenInfo] = useState<TokenInfoType>({
    accountName: '',
    tokenId: tokenId || '',
    symbol: '',
    tokenName: '',
    decimal: '',
  })
  useEffect(() => {
    if (findTokenInfo) {
      setTokenInfo({
        accountName: '',
        tokenId: findTokenInfo.tokenID,
        symbol: findTokenInfo.symbol,
        tokenName: findTokenInfo.tokenName,
        decimal: findTokenInfo.decimal,
      })
    }
  }, [findTokenInfo])
  const onChangeTokenInfo = useCallback(
    e => {
      const {
        dataset: { field },
        value,
      } = e.currentTarget as {
        dataset: { field: keyof TokenInfoType }
        value: string
      }
      let newValue = value
      switch (field) {
        case 'tokenId': {
          newValue = value.trim().toLocaleLowerCase()
          break
        }
        case 'symbol': {
          newValue = value.trim()
          break
        }
        case 'decimal': {
          if (Number.isNaN(+value)) {
            return
          }
          newValue = value.trim()
          break
        }
        default:
      }
      setTokenInfo(v => ({
        ...v,
        [field]: newValue,
      }))
    },
    [setTokenInfo]
  )
  const tokenInfoErrors = useSUDTAccountInfoErrors({
    info: tokenInfo,
    existingAccountNames: sUDTAccounts.filter(v => !!v.accountName).map(v => v.accountName!),
    isCKB: false,
    t,
  })
  return {
    tokenInfo,
    onChangeTokenInfo,
    tokenInfoErrors,
  }
}

export default {
  useTokenInfo,
}
