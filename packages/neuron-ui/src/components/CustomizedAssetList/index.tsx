import React, { useReducer, useEffect, useCallback } from 'react'
import { useHistory, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { SpinnerSize, SearchBox } from 'office-ui-fabric-react'
import CustomizedAsset, { CustomizedAssetProps } from 'components/CustomizedAsset'
import Pagination from 'widgets/Pagination'
import Button from 'widgets/Button'
import Spinner from 'widgets/Spinner'
import { queryParsers, RoutePath } from 'utils'
import styles from './customizedAssetList.module.scss'

interface State {
  list: CustomizedAssetProps[]
  total: number
  pageNo: number
  loading: boolean
  keywords: string
}

type Action =
  | {
      type: 'list'
      payload: {
        list: CustomizedAssetProps[]
        total: number
      }
    }
  | {
      type: 'search'
      payload: {
        pageNo: number
        keywords: string
      }
    }
  | {
      type: 'loading'
      payload: boolean
    }
  | {
      type: 'keywords'
      payload: string
    }

const reducer: React.Reducer<State, Action> = (state, action) => {
  switch (action.type) {
    case 'list': {
      return {
        ...state,
        list: action.payload.list,
        total: action.payload.total,
      }
    }
    case 'search': {
      return {
        ...state,
        keywords: action.payload.keywords,
        pageNo: action.payload.pageNo,
      }
    }
    case 'loading': {
      return {
        ...state,
        loading: action.payload,
      }
    }
    case 'keywords': {
      return {
        ...state,
        keywords: action.payload,
      }
    }
    default: {
      return state
    }
  }
}

const I18N_PATH = `customized-asset-list`

const CustomizedAssetList = ({ initList = [] }: { initList?: CustomizedAssetProps[] }) => {
  const [t] = useTranslation()
  const [state, dispatch] = useReducer(reducer, {
    list: initList,
    total: 0,
    pageNo: 1,
    loading: true,
    keywords: '',
  })
  const history = useHistory()
  const { search } = useLocation()

  useEffect(() => {
    const { pageNo = 1, keywords = '' } = queryParsers.listParams(search)
    dispatch({ type: 'search', payload: { pageNo, keywords } })
    dispatch({ type: 'loading', payload: true })

    // TODO: fetch list with search and update list/total
  }, [search, dispatch])

  const handlePageNoClick = useCallback(
    (pageNo: string) => {
      const query = new URLSearchParams(search)
      query.set('pageNo', pageNo)
      history.push(`${RoutePath.SpecialAssets}?${query}`)
    },
    [search, history]
  )

  const handleSearch = useCallback(() => {
    if (state.loading) {
      return
    }
    const query = new URLSearchParams()
    query.set('keywords', state.keywords)
    history.push(`${RoutePath.SpecialAssets}?${query}`)
  }, [history, search, state.loading, state.keywords])

  const handleKeywordChange = useCallback(
    (_e?: React.FormEvent<HTMLElement | HTMLTextAreaElement>, newKeywords?: string) => {
      if (undefined !== newKeywords) {
        dispatch({ type: 'keywords', payload: newKeywords })
      }
    },
    [dispatch]
  )

  if (state.loading) {
    return (
      <div className={styles.container}>
        <SearchBox
          disabled
          value={state.keywords}
          className={styles.searchBox}
          placeholder={t('history.search.placeholder')}
          onChange={handleKeywordChange}
          onSearch={handleSearch}
          iconProps={{ iconName: 'Search', styles: { root: { height: '18px' } } }}
        />
        <Spinner size={SpinnerSize.large} />
      </div>
    )
  }

  return (
    <div className={styles.container}>
      <div className={styles.tools}>
        <SearchBox
          value={state.keywords}
          className={styles.searchBox}
          placeholder={t('history.search.placeholder')}
          onChange={handleKeywordChange}
          onSearch={handleSearch}
          iconProps={{ iconName: 'Search', styles: { root: { height: '18px' } } }}
        />
        <Button className={styles.searchBtn} type="default" label={t('history.search.button')} onClick={handleSearch} />
        <div role="presentation" onClick={console.info} className={styles.add} />
      </div>
      {state.list.length ? (
        state.list.map(item => <CustomizedAsset key={item.tokenId} {...item} />)
      ) : (
        <div className={styles.noItems}>{t(`${I18N_PATH}.no-customized-assets`)}</div>
      )}
      <div className={styles.pagination}>
        <Pagination count={100} pageNo={1} onChange={handlePageNoClick} pageSize={10} />
      </div>
    </div>
  )
}

CustomizedAssetList.displayName = 'CustomizedAssetList'

export default CustomizedAssetList
