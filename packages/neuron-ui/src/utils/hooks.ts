import { useState, useMemo, useCallback, useEffect } from 'react'
import { TFunction } from 'i18next'
import { openContextMenu } from 'services/remote'
import { updateTransactionDescription, updateAddressDescription } from 'states/stateProvider/actionCreators'
import { StateDispatch, AppActions } from 'states/stateProvider/reducer'
import { epochParser } from 'utils/parsers'
import calculateClaimEpochValue from 'utils/calculateClaimEpochValue'
import { verifyTokenId, verifySUDTAccountName, verifySymbol, verifyTokenName, verifyDecimal } from 'utils/validators'

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
            walletID,
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
    (e: React.SyntheticEvent<any>) => {
      const {
        dataset: { descriptionKey: key },
        value,
      } = e.target as HTMLInputElement
      if (key) {
        setLocalDescription({
          key,
          description: value || '',
        })
      }
    },
    [setLocalDescription]
  )
  const onDescriptionSelected = useCallback(
    (e: React.SyntheticEvent<any>) => {
      const {
        dataset: { descriptionKey: key, descriptionValue: originDesc = '' },
      } = e.target as HTMLElement
      if (key) {
        dispatch({
          type: AppActions.ToggleIsAllowedToFetchList,
          payload: false,
        })
        setLocalDescription({ key, description: originDesc })
        try {
          const input = document.querySelector<HTMLInputElement>(`input[data-description-key="${key}"]`)
          if (input) {
            input.focus()
          }
        } catch (err) {
          console.warn(err)
        }
      }
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
    const targetEpochValue = calculateClaimEpochValue(depositEpochInfo, currentEpochInfo)
    return {
      depositEpochInfo,
      currentEpochInfo,
      targetEpochValue,
    }
  }, [depositEpoch, currentEpoch])

export const useDialog = ({
  show,
  dialogRef,
  onClose,
}: {
  show: any
  dialogRef: React.MutableRefObject<HTMLDialogElement | null>
  onClose: () => void
}) => {
  useEffect(() => {
    const ref = dialogRef.current
    if (ref) {
      if (show) {
        if (!ref.open) {
          ref.showModal()
        }
      } else {
        ref.close()
      }
      ref.addEventListener('close', onClose)
    }
    return () => {
      if (ref) {
        ref.removeEventListener('close', onClose)
      }
    }
  }, [show, dialogRef, onClose])
}

export const useOnDefaultContextMenu = (t: TFunction) =>
  useCallback(() => {
    const contextMenuTemplate = [
      { label: t('contextmenu.cut'), role: 'cut' },
      {
        label: t('contextmenu.copy'),
        role: 'copy',
      },
      {
        label: t('contextmenu.paste'),
        role: 'paste',
      },
      {
        type: 'separator',
      },
      {
        label: t('contextmenu.selectall'),
        role: 'selectAll',
      },
    ]
    openContextMenu(contextMenuTemplate)
  }, [t])

export const useExitOnWalletChange = () => {
  const listener = (e: StorageEvent) => {
    if (e.key === 'currentWallet') {
      window.close()
    }
  }
  return useEffect(() => {
    window.addEventListener('storage', listener)
    return () => {
      window.removeEventListener('storage', listener)
    }
  }, [])
}

export const useSUDTAccountInfoErrors = ({
  info: { accountName, tokenName, tokenId, symbol, decimal },
  existingAccountNames,
  isCKB,
  t,
}: {
  info: {
    accountName: string
    tokenName: string
    tokenId: string
    symbol: string
    decimal: string
  }
  existingAccountNames: string[]
  isCKB: boolean
  t: TFunction
}) =>
  useMemo(() => {
    const tokenErrors = {
      accountName: '',
      tokenId: '',
      tokenName: '',
      symbol: '',
      decimal: '',
    }

    const dataToValidate = {
      accountName: {
        params: { name: accountName, exists: existingAccountNames },
        validator: verifySUDTAccountName,
      },
      symbol: { params: { symbol, isCKB }, validator: verifySymbol },
      tokenId: { params: { tokenId, isCKB }, validator: verifyTokenId },
      tokenName: { params: { tokenName, isCKB }, validator: verifyTokenName },
      decimal: { params: { decimal }, validator: verifyDecimal },
    }

    Object.entries(dataToValidate).forEach(([name, { params, validator }]: [string, any]) => {
      try {
        validator(params)
      } catch (err) {
        tokenErrors[name as keyof typeof tokenErrors] = t(err.message, err.i18n)
      }
    })

    return tokenErrors
  }, [accountName, tokenName, tokenId, symbol, decimal, isCKB, existingAccountNames, t])

export default {
  useGoBack,
  useLocalDescription,
  useCalculateEpochs,
  useDialog,
  useOnDefaultContextMenu,
  useExitOnWalletChange,
}
