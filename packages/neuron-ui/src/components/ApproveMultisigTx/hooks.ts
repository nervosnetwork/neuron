import { TFunction } from 'i18next'
import { useCallback, useState } from 'react'
import {
  broadcastTransaction,
  exportTransactionAsJSON,
  invokeShowErrorMessage,
  MultisigConfig,
  OfflineSignJSON,
} from 'services/remote'
import { useDispatch } from 'states'
import { AppActions } from 'states/stateProvider/reducer'
import { isSuccessResponse } from 'utils'

export const useBroadcast = ({
  offlineSignJson,
  walletID,
  closeDialog,
  t,
}: {
  offlineSignJson: OfflineSignJSON
  walletID: string
  closeDialog: () => void
  t: TFunction
}) => {
  const broadcast = useCallback(async () => {
    const res = await broadcastTransaction({
      ...offlineSignJson,
      walletID,
    })
    if (isSuccessResponse(res)) {
      closeDialog()
    } else {
      invokeShowErrorMessage({
        title: t('messages.error'),
        content: typeof res.message === 'string' ? res.message : res.message.content!,
      })
    }
  }, [offlineSignJson, walletID, t, closeDialog])
  return broadcast
}

export const useSignAndExport = ({
  offlineSignJson,
  walletID,
  multisigConfig,
  closeDialog,
}: {
  offlineSignJson: OfflineSignJSON
  walletID: string
  multisigConfig: MultisigConfig
  closeDialog: () => void
}) => {
  const dispatch = useDispatch()
  const signAndExport = useCallback(() => {
    dispatch({
      type: AppActions.UpdateGeneratedTx,
      payload: offlineSignJson.transaction,
    })
    dispatch({
      type: AppActions.RequestPassword,
      payload: {
        walletID,
        actionType: 'send-from-multisig',
        multisigConfig,
      },
    })
    closeDialog()
  }, [dispatch, walletID, multisigConfig, offlineSignJson.transaction, closeDialog])
  return signAndExport
}

export const useSignAndBroadcast = ({
  offlineSignJson,
  multisigConfig,
  walletID,
  canBroadcastAfterSign,
  closeDialog,
}: {
  offlineSignJson: OfflineSignJSON
  multisigConfig: MultisigConfig
  walletID: string
  canBroadcastAfterSign: boolean
  closeDialog: () => void
}) => {
  const dispatch = useDispatch()
  const signAndExport = useCallback(() => {
    dispatch({
      type: AppActions.UpdateGeneratedTx,
      payload: offlineSignJson.transaction,
    })
    dispatch({
      type: AppActions.RequestPassword,
      payload: {
        walletID,
        actionType: canBroadcastAfterSign ? 'send-from-multisig-need-one' : 'send-from-multisig',
        multisigConfig,
      },
    })
    closeDialog()
  }, [dispatch, walletID, multisigConfig, offlineSignJson.transaction, canBroadcastAfterSign, closeDialog])
  return signAndExport
}

export const useExport = ({
  offlineSignJson,
  closeDialog,
}: {
  offlineSignJson: OfflineSignJSON
  closeDialog: () => void
}) => {
  return useCallback(async () => {
    const res = await exportTransactionAsJSON(offlineSignJson)
    if (isSuccessResponse(res)) {
      closeDialog()
    }
  }, [closeDialog, offlineSignJson])
}

export const useTabView = () => {
  const [tabIdx, setTabIdx] = useState('0')
  const onTabClick = (e: React.SyntheticEvent<HTMLDivElement, MouseEvent>) => {
    const {
      dataset: { idx },
    } = e.target as HTMLDivElement
    if (idx) {
      setTabIdx(idx)
    }
  }
  return {
    tabIdx,
    onTabClick,
  }
}
