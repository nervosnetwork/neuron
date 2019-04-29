import { useEffect, useMemo, useCallback } from 'react'
import { History } from 'history'
import { actionCreators, MainActions } from 'containers/MainContent/reducer'
import { ProviderActions } from 'containers/Providers/reducer'
import { queryParsers } from 'utils/parser'
import { Routes } from 'utils/const'
import { MenuItemParams } from '.'

export const useSearch = (search: string, dispatch: React.Dispatch<any>, providerDispatch: React.Dispatch<any>) => {
  useEffect(() => {
    const params = queryParsers.history(search)
    providerDispatch({
      type: ProviderActions.CleanTransactions,
    })
    dispatch(actionCreators.getTransactions(params))
    return () => {
      dispatch({
        type: MainActions.ErrorMessage,
        payload: {
          transactions: '',
        },
      })
    }
  }, [search, dispatch, providerDispatch])
}

export const useMenuItems = (t: Function, history: History, EXPLORER: string) => {
  return useMemo(() => {
    return [
      {
        label: t('history.detail'),
        click: (params: MenuItemParams) => {
          history.push(`${Routes.Transaction}/${params.hash}`)
        },
      },
      {
        label: t('history.explorer'),
        click: () => {
          window.open(EXPLORER)
        },
      },
    ]
  }, [t, history, EXPLORER])
}

export const useOnChangePage = (search: string, pathname: string, history: History, queryFormatter: Function) => {
  return useCallback(
    (page: number) => {
      const params = queryParsers.history(search)
      params.pageNo = page
      const newQuery = queryFormatter(params)
      history.push(`${pathname}?${newQuery.toString()}`)
    },
    [search, pathname, history, queryFormatter],
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
    [search, pathname, history, queryFormatter],
  )
}

export default {
  useSearch,
  useMenuItems,
  useOnChangePage,
  useOnAddressRemove,
}
