import { useState, useEffect } from 'react'
import { updateTransactionList } from 'states/stateProvider/actionCreators/transactions'
import { listParams, backToTop } from 'utils'

export const useSearch = (search: string, walletID: string, dispatch: React.Dispatch<any>) => {
  const [keywords, setKeywords] = useState('')
  const [sortInfo, setSortInfo] = useState({ sort: '', direction: '' })

  const onKeywordsChange = (_e?: React.FormEvent<HTMLInputElement | HTMLTextAreaElement>, newValue?: string) => {
    if (undefined !== newValue) {
      setKeywords(newValue)
    }
  }

  useEffect(() => {
    backToTop()
    const params = listParams(search)
    setKeywords(params.keywords)
    setSortInfo({ sort: params.sort, direction: params.direction })
    updateTransactionList({ ...params, keywords: params.keywords, walletID })(dispatch)
  }, [search, walletID, dispatch])
  return { keywords, onKeywordsChange, setKeywords, sortInfo }
}

export default {
  useSearch,
}
