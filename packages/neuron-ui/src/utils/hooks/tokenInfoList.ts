import { useState, useEffect } from 'react'
import { getTokenInfoList } from 'services/remote'
import { isSuccessResponse } from '../is'

export const useFetchTokenInfoList = () => {
  const [tokenInfoList, setTokenInfoList] = useState<Controller.GetTokenInfoList.TokenInfo[]>([])
  useEffect(() => {
    getTokenInfoList()
      .then(res => {
        if (isSuccessResponse(res)) {
          setTokenInfoList(res.result)
        }
      })
      .catch(() => {
        console.warn('Fail to fetch the token info list')
      })
  }, [setTokenInfoList])
  return tokenInfoList
}

export default { useFetchTokenInfoList }
