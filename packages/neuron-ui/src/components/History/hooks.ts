import { useState, useEffect } from 'react'
import { updateTransactionList } from 'states/stateProvider/actionCreators/transactions'
import { queryParsers } from 'utils/parser'

const backToTop = () => {
  const container = document.querySelector('main') as HTMLElement
  if (container) {
    container.scrollIntoView({
      behavior: 'smooth',
      block: 'start',
      inline: 'nearest',
    })
  }
}

export const useSearch = (search: string = '', walletID: string = '', dispatch: React.Dispatch<any>) => {
  const [keywords, setKeywords] = useState('')

  const onKeywordsChange = (_e?: React.FormEvent<HTMLInputElement | HTMLTextAreaElement>, newValue?: string) => {
    if (undefined !== newValue) {
      setKeywords(newValue)
    }
  }

  useEffect(() => {
    backToTop()
    const params = queryParsers.history(search)
    setKeywords(params.keywords)
    updateTransactionList({ ...params, keywords: params.keywords, walletID })(dispatch)
  }, [search, walletID, dispatch])
  return { keywords, onKeywordsChange, setKeywords }
}

export default {
  useSearch,
}
