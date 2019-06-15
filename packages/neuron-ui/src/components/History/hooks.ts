import { useEffect, useCallback } from 'react'
import { History } from 'history'
import { actionCreators, MainActions } from 'containers/MainContent/reducer'
import { ProviderActions } from 'containers/Providers/reducer'
import { queryParsers } from 'utils/parser'
import { PAGE_SIZE } from '../../utils/const'

export const useSearch = (search: string, dispatch: React.Dispatch<any>, providerDispatch: React.Dispatch<any>) => {
  useEffect(() => {
    const params = queryParsers.history(search)
    providerDispatch({
      type: ProviderActions.CleanTransactions,
    })
    dispatch(actionCreators.getTransactions(params))
    return () => {
      dispatch(actionCreators.getTransactions({ pageNo: 1, pageSize: PAGE_SIZE, addresses: [] }))
      dispatch({
        type: MainActions.ErrorMessage,
        payload: {
          transactions: '',
        },
      })
    }
  }, [search, dispatch, providerDispatch])
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

export const useOnAddressRemove = (search: string, pathname: string, history: History, queryFormatter: Function) => {
  return useCallback(
    (address: string) => () => {
      const params = queryParsers.history(search)
      params.addresses = params.addresses.filter((addr: string) => addr !== address)
      const newQuery = queryFormatter(params)
      history.push(`${pathname}?${newQuery.toString()}`)
    },
    [search, pathname, history, queryFormatter]
  )
}

export default {
  useSearch,
  useOnChangePage,
  useOnAddressRemove,
}
