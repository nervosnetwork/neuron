import { useState, useMemo, useCallback, useEffect } from 'react'
import { updateTransactionDescription, updateAddressDescription } from 'states/stateProvider/actionCreators'
import { StateDispatch, AppActions } from 'states/stateProvider/reducer'
import { epochParser } from 'utils/parsers'
import calculateTargetEpochNumber from 'utils/calculateClaimEpochNumber'

export const useGoBack = (history: any) => {
  return useCallback(() => {
    history.goBack()
  }, [history])
}

export const useLocalDescription = (type: 'address' | 'transaction', walletID: string, dispatch: StateDispatch) => {
  const [localDescription, setLocalDescription] = useState<{ description: string; key: string }>({
    key: '',
    description: '',
  })

  const submitDescription = useCallback(
    (key: string, originDesc: string) => {
      if ((key && key !== localDescription.key) || localDescription.description === originDesc) {
        dispatch({
          type: AppActions.ToggleIsAllowedToFetchList,
          payload: true,
        })
        setLocalDescription({ key: '', description: '' })
      } else {
        dispatch({
          type: AppActions.ToggleIsAllowedToFetchList,
          payload: true,
        })
        if (localDescription.key && type === 'transaction') {
          updateTransactionDescription({
            hash: localDescription.key,
            description: localDescription.description,
          })(dispatch)
        }
        if (localDescription.key && type === 'address') {
          updateAddressDescription({
            walletID,
            address: localDescription.key,
            description: localDescription.description,
          })(dispatch)
        }
        setLocalDescription({ key: '', description: '' })
      }
    },
    [type, walletID, localDescription, dispatch]
  )

  const onDescriptionFieldBlur = useCallback(
    (e: any) => {
      const { descriptionKey: key, descriptionValue: originDesc } = e.target.dataset
      submitDescription(key, originDesc)
    },
    [submitDescription]
  )
  const onDescriptionPress = useCallback(
    (e: any) => {
      const { descriptionKey: key, descriptionValue: originDesc } = e.target.dataset
      if (e.key && e.key === 'Enter') {
        submitDescription(key, originDesc)
      }
    },
    [submitDescription]
  )
  const onDescriptionChange = useCallback(
    (e: any, value?: string) => {
      const key = e.target.dataset.descriptionKey
      setLocalDescription({
        key,
        description: value || '',
      })
    },
    [setLocalDescription]
  )
  const onDescriptionSelected = useCallback(
    (hash: string, originDesc: string) => () => {
      dispatch({
        type: AppActions.ToggleIsAllowedToFetchList,
        payload: false,
      })
      setLocalDescription({ key: hash, description: originDesc })
    },
    [setLocalDescription, dispatch]
  )
  return {
    localDescription,
    onDescriptionFieldBlur,
    onDescriptionPress,
    onDescriptionChange,
    onDescriptionSelected,
  }
}

export const useCalculateEpochs = ({ depositEpoch, currentEpoch }: { depositEpoch: string; currentEpoch: string }) =>
  useMemo(() => {
    const depositEpochInfo = epochParser(depositEpoch)
    const currentEpochInfo = epochParser(currentEpoch)
    const targetEpochNumber = calculateTargetEpochNumber(depositEpochInfo, currentEpochInfo)
    return {
      depositEpochInfo,
      currentEpochInfo,
      targetEpochNumber,
    }
  }, [depositEpoch, currentEpoch])

export const useDialog = ({
  show,
  dialogRef,
}: {
  show: any
  dialogRef: React.MutableRefObject<HTMLDialogElement | null>
}) => {
  useEffect(() => {
    if (dialogRef.current) {
      if (show) {
        if (!dialogRef.current.open) {
          dialogRef.current.showModal()
        }
      } else {
        dialogRef.current.close()
      }
    }
  }, [show, dialogRef])
}

export default { useGoBack, useLocalDescription, useCalculateEpochs, useDialog }
