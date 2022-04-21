import { TFunction } from 'i18next'
import { useMemo, useCallback, useState } from 'react'
import { ckbCore } from 'services/chain'
import {
  broadcastTransaction,
  exportTransactionAsJSON,
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

export const useSignedStatus = ({
  multisigConfig,
  signatures,
  addresses,
}: {
  multisigConfig: MultisigConfig
  signatures?: Signatures
  addresses: State.Address[]
}) => {
  const multisigLockHash = useMemo(() => scriptToHash(addressToScript(multisigConfig.fullPayload)), [
    multisigConfig.fullPayload,
  ])
  const multisigBlake160s = useMemo(() => multisigConfig.addresses.map(v => addressToScript(v).args), [
    multisigConfig.addresses,
  ])
  const addressBlake160s = useMemo(() => addresses.map(v => addressToScript(v.address).args), [addresses])
  return useMemo(() => {
    const notSpecifiedCount = multisigConfig.m - multisigConfig.r
    const specifiedUnsignedAddresses: string[] = []
    const unspecifiedSignedAddresses: string[] = []
    const unspecifiedUnsignedAddresses: string[] = []
    for (let i = 0; i < multisigBlake160s.length; i++) {
      const hasSigned = signatures?.[multisigLockHash]?.includes(multisigBlake160s[i])
      if (i < multisigConfig.r) {
        if (!hasSigned) {
          specifiedUnsignedAddresses.push(multisigBlake160s[i])
        }
      } else {
        ;(hasSigned ? unspecifiedSignedAddresses : unspecifiedUnsignedAddresses).push(multisigBlake160s[i])
      }
    }
    const lackOfUnspecifiedCount =
      unspecifiedSignedAddresses.length < notSpecifiedCount ? notSpecifiedCount - unspecifiedSignedAddresses.length : 0
    let canBroadcastAfterSign = false
    let canSign = specifiedUnsignedAddresses.some(v => addressBlake160s.includes(v))
    if (lackOfUnspecifiedCount + specifiedUnsignedAddresses.length === 1) {
      if (specifiedUnsignedAddresses.length === 1) {
        canBroadcastAfterSign = addressBlake160s.includes(specifiedUnsignedAddresses[0])
      } else {
        canBroadcastAfterSign = unspecifiedUnsignedAddresses.some(v => addressBlake160s.includes(v))
      }
      canSign = canBroadcastAfterSign
    } else {
      canSign =
        specifiedUnsignedAddresses.some(v => addressBlake160s.includes(v)) ||
        (!!lackOfUnspecifiedCount && unspecifiedUnsignedAddresses.some(v => addressBlake160s.includes(v)))
    }
    return {
      lackOfRCount: specifiedUnsignedAddresses.length,
      lackOfMCount: lackOfUnspecifiedCount + specifiedUnsignedAddresses.length,
      canBroadcastAfterSign,
      canSign,
    }
  }, [signatures, multisigLockHash, multisigConfig, multisigBlake160s, addressBlake160s])
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
