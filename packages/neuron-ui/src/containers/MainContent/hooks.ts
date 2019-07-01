import React, { useCallback } from 'react'
import { MainActions } from './reducer'

export const useOnDialogCancel = (dispatch: React.Dispatch<any>) =>
  useCallback(() => {
    dispatch({
      type: MainActions.SetDialog,
      payload: {
        open: false,
      },
    })
  }, [dispatch])
export default {
  useOnDialogCancel,
}
