import { useState, useEffect } from 'react'
import { updateTransactionList } from 'states/stateProvider/actionCreators/transactions'
import { NeuronWalletActions } from 'states/stateProvider/reducer'
import { listParams, backToTop, isSuccessResponse } from 'utils'
import { getSUDTAccountList } from 'services/remote'

export const useSearch = (search: string, walletID: string, dispatch: React.Dispatch<any>) => {
  const [keywords, setKeywords] = useState('')

  const onKeywordsChange = (_e?: React.FormEvent<HTMLInputElement | HTMLTextAreaElement>, newValue?: string) => {
    if (undefined !== newValue) {
      setKeywords(newValue)
    }
  }

  useEffect(() => {
    backToTop()
    const params = listParams(search)
    setKeywords(params.keywords)
    updateTransactionList({ ...params, keywords: params.keywords, walletID })(dispatch)

    getSUDTAccountList({ walletID })
      .then(res => {
        if (isSuccessResponse(res)) {
          return res.result
        }
        throw new Error(res.message.toString())
      })
      .then((list: Controller.GetSUDTAccountList.Response) => {
        dispatch({
          type: NeuronWalletActions.GetSUDTAccountList,
          payload: list,
        })
      })
      .catch((err: Error) => console.error(err))
  }, [search, walletID, dispatch])
  return { keywords, onKeywordsChange, setKeywords }
}

export default {
  useSearch,
}
