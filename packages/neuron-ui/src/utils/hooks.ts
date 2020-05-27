import { useState, useMemo, useCallback, useEffect } from 'react'
import { useHistory } from 'react-router-dom'
import { TFunction, i18n as i18nType } from 'i18next'
import { openContextMenu, requestPassword, setCurrentNetowrk, deleteNetwork } from 'services/remote'
import { SetLocale as SetLocaleSubject } from 'services/subjects'
import {
  StateDispatch,
  AppActions,
  updateTransactionDescription,
  updateAddressDescription,
  setCurrentWallet,
} from 'states'
import { epochParser, RoutePath } from 'utils'
import calculateClaimEpochValue from 'utils/calculateClaimEpochValue'

export const useGoBack = (history: ReturnType<typeof useHistory>) => {
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
  useCallback(
    (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
      if ((e.target as HTMLElement).tagName === 'INPUT') {
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
      }
    },
    [t]
  )

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

export const useOnLocalStorageChange = (handler: (e: StorageEvent) => void) => {
  return useEffect(() => {
    window.addEventListener('storage', handler)
    return () => {
      window.removeEventListener('storage', handler)
    }
  }, [handler])
}

export const useOnLocaleChange = (i18n: i18nType) => {
  return useEffect(() => {
    const subcription = SetLocaleSubject.subscribe(lng => {
      i18n.changeLanguage(lng)
    })
    return () => {
      subcription.unsubscribe()
    }
  }, [i18n])
}

export const useOnHandleWallet = ({
  history,
  dispatch,
}: {
  history: ReturnType<typeof useHistory>
  dispatch: StateDispatch
}) =>
  useCallback(
    (e: React.SyntheticEvent) => {
      const {
        target: {
          dataset: { action },
        },
        currentTarget: {
          dataset: { id },
        },
      } = e as any
      switch (action) {
        case 'edit': {
          history.push(`${RoutePath.WalletEditor}/${id}`)
          break
        }
        case 'delete': {
          requestPassword({ walletID: id, action: 'delete-wallet' })
          break
        }
        case 'backup': {
          requestPassword({
            walletID: id,
            action: 'backup-wallet',
          })
          break
        }
        case 'select': {
          setCurrentWallet(id)(dispatch)
          break
        }
        default: {
          // ignore
        }
      }
    },
    [dispatch, history]
  )

export const useOnWindowResize = (handler: () => void) => {
  useEffect(() => {
    let rAFTimer: number | null = null
    const listener = () => {
      if (rAFTimer) {
        window.cancelAnimationFrame(rAFTimer)
      }
      rAFTimer = window.requestAnimationFrame(handler)
    }

    window.addEventListener('resize', listener)
    return () => {
      window.removeEventListener('resize', listener)
    }
  }, [handler])
}

export const useToggleChoiceGroupBorder = (containerSelector: string, borderClassName: string) =>
  useCallback(() => {
    const walletListContainer = document.querySelector(containerSelector)
    if (!walletListContainer) {
      return
    }
    const walletList = walletListContainer.querySelector('[role=radiogroup]')
    if (!walletList) {
      return
    }
    const containerHeight = +window.getComputedStyle(walletListContainer).height.slice(0, -2)
    const listHeight = +window.getComputedStyle(walletList).height.slice(0, -2)
    if (containerHeight > listHeight + 5) {
      walletListContainer.classList.remove(borderClassName)
    } else {
      walletListContainer.classList.add(borderClassName)
    }
  }, [containerSelector, borderClassName])

export const useOnHandleNetwork = ({ history }: { history: ReturnType<typeof useHistory> }) =>
  useCallback(
    (e: React.SyntheticEvent) => {
      const {
        target: {
          dataset: { action },
        },
        currentTarget: {
          dataset: { id },
        },
      } = e as any
      switch (action) {
        case 'edit': {
          history.push(`${RoutePath.NetworkEditor}/${id}`)
          break
        }
        case 'delete': {
          deleteNetwork(id)
          break
        }
        case 'select': {
          setCurrentNetowrk(id)
          break
        }
        default: {
          // ignore
        }
      }
    },
    [history]
  )
