import { useState, useMemo, useCallback, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { TFunction, i18n as i18nType } from 'i18next'
import { openContextMenu, requestPassword, deleteNetwork, migrateData } from 'services/remote'
import { firstLoadApp, syncRebuildNotification } from 'services/localCache'
import { Migrate, SetLocale as SetLocaleSubject } from 'services/subjects'
import {
  StateDispatch,
  AppActions,
  updateTransactionDescription,
  updateAddressDescription,
  setCurrentWallet,
  showPageNotice,
} from 'states'
import { epochParser, isReadyByVersion, calculateClaimEpochValue, CONSTANTS } from 'utils'
import {
  validateTokenId,
  validateAssetAccountName,
  validateSymbol,
  validateTokenName,
  validateDecimal,
  validateAmount,
  validateAddress,
  validateAmountRange,
} from 'utils/validators'
import { MenuItemConstructorOptions } from 'electron'
import { ErrorWithI18n, isErrorWithI18n } from 'exceptions'

export * from './createSUDTAccount'
export * from './tokenInfoList'

export const useGoBack = () => {
  const navigate = useNavigate()
  return useCallback(() => {
    navigate(-1)
  }, [navigate])
}

export const useLocalDescription = (
  type: 'address' | 'transaction',
  walletID: string,
  dispatch: StateDispatch,
  inputType = 'input'
) => {
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
        e.stopPropagation()
        e.preventDefault()
        submitDescription(key, originDesc)
        const input = document.querySelector<HTMLInputElement>(`${inputType}[data-description-key="${key}"]`)
        input?.blur()
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
      } = e.currentTarget
      if (key) {
        dispatch({
          type: AppActions.ToggleIsAllowedToFetchList,
          payload: false,
        })
        setLocalDescription({ key, description: originDesc })
        try {
          const input = document.querySelector<HTMLInputElement>(`${inputType}[data-description-key="${key}"]`)
          if (input) {
            input.focus()
            input.setSelectionRange(-1, -1)
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

export const useDialogWrapper = ({
  onClose,
}: {
  onClose?: () => void
} = {}) => {
  const dialogRef = useRef<HTMLDialogElement | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState<boolean>(false)
  const openDialog = useCallback(() => {
    setIsDialogOpen(true)
  }, [setIsDialogOpen])
  const closeDialog = useCallback(() => {
    setIsDialogOpen(false)
  }, [setIsDialogOpen])
  useDialog({
    show: isDialogOpen,
    dialogRef,
    onClose: onClose || closeDialog,
  })
  return {
    isDialogOpen,
    openDialog,
    closeDialog,
    dialogRef,
  }
}

export const useOnDefaultContextMenu = (t: TFunction) =>
  useCallback(
    (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
      if ((e.target as HTMLElement).tagName === 'INPUT') {
        const contextMenuTemplate: Array<MenuItemConstructorOptions> = [
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
        validator: validateAssetAccountName,
      },
      symbol: { params: { symbol, isCKB }, validator: validateSymbol },
      tokenId: { params: { tokenId, isCKB }, validator: validateTokenId },
      tokenName: { params: { tokenName, isCKB }, validator: validateTokenName },
      decimal: { params: { decimal }, validator: validateDecimal },
    }

    Object.entries(dataToValidate).forEach(([name, { params, validator }]: [string, any]) => {
      try {
        validator(params)
      } catch (err) {
        if (isErrorWithI18n(err)) {
          tokenErrors[name as keyof typeof tokenErrors] = t(err.message, err.i18n)
        }
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

export const useOnHandleWallet = ({ dispatch }: { dispatch: StateDispatch }) =>
  useCallback(
    (e: React.BaseSyntheticEvent) => {
      const {
        dataset: { action, id },
      } = e.target
      switch (action) {
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
    [dispatch]
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

export const useOnHandleNetwork = (handleNet: (id: string) => void) =>
  useCallback(
    (e: React.BaseSyntheticEvent) => {
      const {
        dataset: { action, id },
      } = e.target
      switch (action) {
        case 'edit': {
          handleNet(id)
          break
        }
        case 'delete': {
          deleteNetwork(id)
          break
        }
        default: {
          // ignore
        }
      }
    },
    [handleNet]
  )

export const useGlobalNotifications = (
  dispatch: React.Dispatch<{ type: AppActions.SetGlobalDialog; payload: State.GlobalDialogType }>,
  hasDismissMigrate: boolean
) => {
  useEffect(() => {
    const lastVersion = syncRebuildNotification.load()
    const isVersionUpdate = isReadyByVersion(CONSTANTS.SYNC_REBUILD_SINCE_VERSION, lastVersion)
    const migrateSubscription = Migrate.subscribe(migrateStatus => {
      if (migrateStatus !== 'need-migrate') return
      if (lastVersion && !isVersionUpdate) {
        // means has click migrate for current version, so migrate silent
        migrateData()
        migrateSubscription.unsubscribe()
      } else if (!hasDismissMigrate) {
        // means need click ok to migrate
        dispatch({
          type: AppActions.SetGlobalDialog,
          payload: 'rebuild-sync',
        })
      }
    })
    return () => {
      migrateSubscription.unsubscribe()
    }
  }, [dispatch, hasDismissMigrate])
}

export const useDidMount = (cb: () => void) => {
  useEffect(cb, [])
}

export const useForceUpdate = <T extends (...args: any[]) => void>(cb: T) => {
  const [, update] = useState<unknown>(Object.create(null))

  const memoizedDispatch = useCallback(
    (...args: any) => {
      cb(...args)
      update(Object.create(null))
    },
    [update, cb]
  )
  return memoizedDispatch
}

export const useOutputErrors = (
  outputs: Partial<Record<'address' | 'amount' | 'date', string>>[],
  isMainnet: boolean
) => {
  return useMemo(
    () =>
      outputs.map(({ address, amount, date }) => {
        let amountError: ErrorWithI18n | undefined
        if (amount !== undefined) {
          try {
            const extraSize = date ? CONSTANTS.SINCE_FIELD_SIZE : 0
            validateAmount(amount)
            validateAmountRange(amount, extraSize)
          } catch (err) {
            if (isErrorWithI18n(err)) {
              amountError = err
            }
          }
        }

        let addrError: ErrorWithI18n | undefined
        if (address !== undefined) {
          try {
            validateAddress(address, isMainnet)
          } catch (err) {
            if (isErrorWithI18n(err)) {
              addrError = err
            }
          }
        }

        return { addrError, amountError }
      }),
    [outputs, isMainnet]
  )
}

export const useFirstLoadApp = (dispatch: StateDispatch) => {
  useEffect(() => {
    const isFirstLoad = firstLoadApp.load()
    if (isFirstLoad) {
      showPageNotice('overview.wallet-ready')(dispatch)
      firstLoadApp.save()
    }
  }, [dispatch])
}
