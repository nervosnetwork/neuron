import React, { useCallback, useEffect } from 'react'
import { getSUDTAccountList } from 'services/remote'
import { NeuronWalletActions, useDispatch } from 'states'
import { isSuccessResponse, useDialogWrapper, useDidMount } from 'utils'

export const useMigrate = () => {
  const { openDialog, dialogRef, closeDialog } = useDialogWrapper()
  const onDocumentClick = useCallback(
    (e: any) => {
      if (!dialogRef?.current?.children?.[0]?.contains(e.target) && dialogRef?.current?.open) {
        closeDialog()
      }
    },
    [closeDialog, dialogRef]
  )
  useDidMount(() => {
    document.addEventListener('click', onDocumentClick, false)
    return () => document.removeEventListener('click', onDocumentClick, false)
  })
  return {
    openDialog,
    dialogRef,
    closeDialog,
  }
}

export const useMigrateToNewAccount = () => {
  const { openDialog, dialogRef, closeDialog } = useDialogWrapper()
  return {
    openDialog,
    dialogRef,
    closeDialog,
  }
}

export const useMigrateToExistAccount = () => {
  const { openDialog, dialogRef, closeDialog } = useDialogWrapper()
  return {
    openDialog,
    dialogRef,
    closeDialog,
  }
}

export const useClickMigrate = ({
  closeMigrateDialog,
  openMigrateToNewAccountDialog,
  openMigrateToExistAccountDialog,
}: {
  closeMigrateDialog: () => void
  openMigrateToNewAccountDialog: () => void
  openMigrateToExistAccountDialog: () => void
}) => {
  return useCallback(
    (e: React.BaseSyntheticEvent) => {
      const {
        dataset: { type },
      } = e.currentTarget
      closeMigrateDialog()
      switch (type) {
        case 'new-account':
          openMigrateToNewAccountDialog()
          break
        case 'exist-account':
          openMigrateToExistAccountDialog()
          break
        default:
          break
      }
    },
    [closeMigrateDialog, openMigrateToNewAccountDialog, openMigrateToExistAccountDialog]
  )
}

export const useGetAssetAccounts = (walletID: string) => {
  const dispatch = useDispatch()
  useEffect(() => {
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
  }, [walletID, dispatch])
}
