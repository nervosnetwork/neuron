import { useState, useMemo, useEffect } from 'react'
import { AppActions } from 'states/stateProvider/reducer'
import { queryParsers } from 'utils/parser'
import actionCreators from 'states/stateProvider/actionCreators'

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

export const useSearch = (
  search: string,
  incomingKeywords: string,
  addresses: { address: string }[],
  dispatch: React.Dispatch<any>
) => {
  const [keywords, setKeywords] = useState('')
  const defaultKeywords = useMemo(() => addresses.map(addr => addr.address).join(','), [addresses])

  const onKeywordsChange = (_e?: React.FormEvent<HTMLInputElement | HTMLTextAreaElement>, newValue?: string) => {
    if (undefined !== newValue) {
      setKeywords(newValue)
    }
  }

  useEffect(() => {
    setKeywords(incomingKeywords)
  }, [incomingKeywords, setKeywords])

  useEffect(() => {
    backToTop()
    const params = queryParsers.history(search)
    setKeywords(params.keywords)
    dispatch({
      type: AppActions.CleanTransactions,
      payload: null,
    })

    dispatch(actionCreators.getTransactions({ ...params, keywords: params.keywords || defaultKeywords }))
  }, [search, dispatch, defaultKeywords])
  return { keywords, addresses, onKeywordsChange }
}

export default {
  useSearch,
}
