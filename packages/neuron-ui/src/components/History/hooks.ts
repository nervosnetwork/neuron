import { useState, useEffect } from 'react'
import { updateTransactionList } from 'states/stateProvider/actionCreators/transactions'
import { queryParsers } from 'utils/parsers'
import { backToTop } from 'utils/animations'

export const useSearch = (search: string = '', walletID: string = '', dispatch: React.Dispatch<any>) => {
  const [keywords, setKeywords] = useState('')

  const onKeywordsChange = (_e?: React.FormEvent<HTMLInputElement | HTMLTextAreaElement>, newValue?: string) => {
    if (undefined !== newValue) {
      setKeywords(newValue)
    }
  }

  useEffect(() => {
    backToTop()
    const params = queryParsers.listParams(search)
    setKeywords(params.keywords)
    updateTransactionList({ ...params, keywords: params.keywords, walletID })(dispatch)
  }, [search, walletID, dispatch])
  return { keywords, onKeywordsChange, setKeywords }
}

export default {
  useSearch,
}
