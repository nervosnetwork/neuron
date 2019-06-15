import { useState, useCallback, useMemo } from 'react'
import { MainActions, actionCreators } from 'containers/MainContent/reducer'
import { WalletIdentity } from 'contexts/NeuronWallet/wallet'

export const useToggleDialog = (dispatch: React.Dispatch<any>) =>
  useCallback(
    (open: boolean) => {
      dispatch({
        type: MainActions.SetDialog,
        payload: {
          open,
        },
      })
    },
    [dispatch]
  )

export const useDeleteWallet = () => {
  const [id, setId] = useState('')
  const [password, setPassword] = useState('')

  return {
    id: {
      value: id,
      set: (deleteId: string) => setId(deleteId),
      onChange: (e: React.FormEvent<{ value: string }>) => setId(e.currentTarget.value),
    },
    password: {
      value: password,
      onChange: (e: React.FormEvent<{ value: string }>) => setPassword(e.currentTarget.value),
    },
  }
}

export const useWalletToDelete = (deleteId: string, wallets: WalletIdentity[]) =>
  useMemo(() => wallets.find(w => w.id === deleteId), [deleteId, wallets])

export const useHandleConfirm = (
  deleteWallet: ReturnType<typeof useDeleteWallet>,
  toggleDialog: ReturnType<typeof useToggleDialog>,
  dispatch: React.Dispatch<any>
) =>
  useCallback(() => {
    toggleDialog(false)
    dispatch(
      actionCreators.deleteWallet({
        id: deleteWallet.id.value,
        password: deleteWallet.password.value,
      })
    )
  }, [deleteWallet, toggleDialog, dispatch])

export default {
  useToggleDialog,
  useDeleteWallet,
  useWalletToDelete,
  useHandleConfirm,
}
