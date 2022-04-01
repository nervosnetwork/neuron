import { TFunction } from 'i18next'
import { useMemo, useCallback, useState } from 'react'
import { ckbCore } from 'services/chain'
import {
  broadcastTransaction,
  invokeShowErrorMessage,
  MultisigConfig,
  OfflineSignJSON,
  Signatures,
} from 'services/remote'
import { useDispatch } from 'states'
import { AppActions } from 'states/stateProvider/reducer'
import { isSuccessResponse } from 'utils'

const { scriptToHash, addressToScript } = ckbCore.utils

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
  onlyNeedOne,
}: {
  offlineSignJson: OfflineSignJSON
  walletID: string
  multisigConfig: MultisigConfig
  onlyNeedOne: boolean
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
        actionType: onlyNeedOne ? 'send-from-multisig-need-one' : 'send-from-multisig',
        multisigConfig,
      },
    })
  }, [dispatch, walletID, multisigConfig, offlineSignJson.transaction, onlyNeedOne])
  return signAndExport
}

export const useSignedStatus = ({
  multisigConfig,
  signatures,
}: {
  multisigConfig: MultisigConfig
  signatures?: Signatures
}) => {
  const multisigLockHash = useMemo(() => scriptToHash(addressToScript(multisigConfig.fullPayload)), [
    multisigConfig.fullPayload,
  ])
  const multisigBlake160s = useMemo(() => multisigConfig.addresses.map(v => addressToScript(v).args), [
    multisigConfig.addresses,
  ])
  const [requiredSignCount, needSignCount] = useMemo(() => {
    let [r, signed] = [0, 0]
    for (let i = 0; i < multisigConfig.r; i++) {
      if (!signatures?.[multisigLockHash]?.includes(multisigBlake160s[i])) {
        r = multisigConfig.r - i
      }
    }
    for (let i = 0; i < (signatures?.[multisigLockHash].length || 0); i++) {
      const blake160 = signatures![multisigLockHash][i]
      if (multisigBlake160s.includes(blake160)) {
        signed += 1
      }
    }
    return [r, multisigConfig.m >= signed ? multisigConfig.m - signed : 0]
  }, [signatures, multisigLockHash, multisigConfig, multisigBlake160s])
  return [requiredSignCount, needSignCount]
}

export const useSignAndBroadcast = ({
  offlineSignJson,
  multisigConfig,
  walletID,
  onlyNeedOne,
}: {
  offlineSignJson: OfflineSignJSON
  multisigConfig: MultisigConfig
  walletID: string
  onlyNeedOne: boolean
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
        actionType: onlyNeedOne ? 'send-from-multisig-need-one' : 'send-from-multisig',
        multisigConfig,
      },
    })
  }, [dispatch, walletID, multisigConfig, offlineSignJson.transaction, onlyNeedOne])
  return signAndExport
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
