import { useState, useMemo, useEffect, useCallback } from 'react'
import { History } from 'history'
import { actionCreators, MainActions } from 'containers/MainContent/reducer'
import { ProviderActions } from 'containers/Providers/reducer'
import { queryParsers } from 'utils/parser'
import { PAGE_SIZE } from '../../utils/const'

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
  dispatch: React.Dispatch<any>,
  providerDispatch: React.Dispatch<any>
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
    providerDispatch({
      type: ProviderActions.CleanTransactions,
    })

    dispatch(actionCreators.getTransactions({ ...params, keywords: params.keywords || defaultKeywords }))
    return () => {
      dispatch(actionCreators.getTransactions({ pageNo: 1, pageSize: PAGE_SIZE, keywords: '' }))
      dispatch({
        type: MainActions.ErrorMessage,
        payload: {
          transactions: '',
        },
      })
    }
  }, [search, dispatch, providerDispatch, defaultKeywords])
  return { keywords, addresses, onKeywordsChange }
}

export const useOnChangePage = (search: string, pathname: string, history: History, queryFormatter: Function) => {
  return useCallback(
    (page: number) => {
      const params = queryParsers.history(search)
      params.pageNo = page
      const newQuery = queryFormatter(params)
      history.push(`${pathname}?${newQuery.toString()}`)
    },
    [search, pathname, history, queryFormatter]
  )
}

export default {
  useSearch,
  useOnChangePage,
}
