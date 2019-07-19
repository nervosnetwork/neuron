import { useState, useEffect } from 'react'
import { AppActions } from 'states/stateProvider/reducer'
import actionCreators from 'states/stateProvider/actionCreators'
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
    dispatch({
      type: AppActions.CleanTransactions,
      payload: null,
    })

    dispatch(actionCreators.getTransactions({ ...params, keywords: params.keywords, walletID }))
  }, [search, walletID, dispatch])
  return { keywords, onKeywordsChange, setKeywords }
}

export default {
  useSearch,
}
