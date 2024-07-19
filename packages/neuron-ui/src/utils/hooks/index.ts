import { useState, useMemo, useCallback, useEffect, useRef } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { TFunction, i18n as i18nType } from 'i18next'
import { openContextMenu, requestPassword, migrateData, getCkbNodeDataPath } from 'services/remote'
import { loadedWalletIDs, syncRebuildNotification, wallets } from 'services/localCache'
import { Migrate, SetLocale as SetLocaleSubject } from 'services/subjects'
import {
  StateDispatch,
  AppActions,
  updateTransactionDescription,
  updateAddressDescription,
  setCurrentWallet,
  showPageNotice,
  useDispatch,
} from 'states'
import { epochParser, isReadyByVersion, calculateClaimEpochValue, CONSTANTS, isSuccessResponse, UDTType } from 'utils'
import {
  validateTokenId,
  validateAssetAccountName,
  validateSymbol,
  validateTokenName,
  validateDecimal,
  validateAmount,
  validateAddress,
  validateAmountRange,
  validateCapacity,
} from 'utils/validators'
import { MenuItemConstructorOptions, shell } from 'electron'
import { ErrorWithI18n, isErrorWithI18n } from 'exceptions'

export * from './createSUDTAccount'
export * from './tokenInfoList'

export const useGoBack = () => {
  const navigate = useNavigate()
  return useCallback(() => {
    navigate(-1)
  }, [navigate])
}

export const useDescription = (
  onSubmitDescription: (param: { key: string; description: string }) => void,
  onChangeEditStatus?: (isEditing: boolean) => void,
  inputType = 'input'
) => {
  const [localDescription, setLocalDescription] = useState<{ description: string; key: string }>({
    key: '',
    description: '',
  })

  const submitDescription = useCallback(
    (key: string, originDesc: string) => {
      onChangeEditStatus?.(false)
      if ((key && key !== localDescription.key) || localDescription.description === originDesc) {
        setLocalDescription({ key: '', description: '' })
      } else {
        onSubmitDescription(localDescription)
        setLocalDescription({ key: '', description: '' })
      }
    },
    [localDescription, onChangeEditStatus]
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
      e.stopPropagation()
      if (key) {
        onChangeEditStatus?.(true)
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
    [setLocalDescription]
  )
  return {
    localDescription,
    onDescriptionFieldBlur,
    onDescriptionPress,
    onDescriptionChange,
    onDescriptionSelected,
  }
}

export const useLocalDescription = (type: 'address' | 'transaction', walletID: string, dispatch: StateDispatch) => {
  const onSubmitDescription = useCallback(
    (localDescription: { key: string; description: string }) => {
      if (!localDescription.key) {
        return
      }
      switch (type) {
        case 'transaction':
          updateTransactionDescription({
            walletID,
            hash: localDescription.key,
            description: localDescription.description,
          })(dispatch)
          break
        case 'address':
          updateAddressDescription({
            walletID,
            address: localDescription.key,
            description: localDescription.description,
          })(dispatch)
          break
        default:
          break
      }
    },
    [type, walletID, dispatch]
  )
  const onChangeEditStatus = useCallback(
    (isEditing: boolean) => {
      dispatch({
        type: AppActions.ToggleIsAllowedToFetchList,
        payload: !isEditing,
      })
    },
    [dispatch]
  )
  return {
    onSubmitDescription,
    onChangeEditStatus,
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
  info: { accountName, tokenName, tokenId, symbol, decimal, balance },
  existingAccountNames,
  isCKB,
  t,
  udtType,
}: {
  info: {
    accountName: string
    tokenName: string
    tokenId: string
    symbol: string
    decimal: string
    balance?: string
  }
  existingAccountNames: string[]
  isCKB: boolean
  t: TFunction
  udtType?: UDTType
}) =>
  useMemo(() => {
    const tokenErrors = {
      accountName: '',
      tokenId: '',
      tokenName: '',
      symbol: '',
      decimal: '',
      balance: '',
    }

    const dataToValidate = {
      accountName: {
        params: { name: accountName, exists: existingAccountNames },
        validator: validateAssetAccountName,
      },
      symbol: { params: { symbol, isCKB }, validator: validateSymbol },
      tokenId: { params: { tokenId, isCKB, udtType }, validator: validateTokenId },
      tokenName: { params: { tokenName, isCKB }, validator: validateTokenName },
      decimal: { params: { decimal }, validator: validateDecimal },
      balance: { params: { balance }, validator: typeof balance === 'undefined' ? () => {} : validateDecimal },
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
    const subscription = SetLocaleSubject.subscribe(lng => {
      i18n.changeLanguage(lng)
    })
    return () => {
      subscription.unsubscribe()
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

export const useMigrate = () => {
  const [isMigrateDialogShow, setIsMigrateDialogShow] = useState(false)
  const [hasDismissMigrate, setHasDismissMigrate] = useState(false)
  const [ckbDataPath, setCkbDataPath] = useState<string>()
  const location = useLocation()
  useEffect(() => {
    getCkbNodeDataPath().then(res => {
      if (isSuccessResponse(res) && res.result) {
        setCkbDataPath(res.result)
      }
    })
  }, [location.pathname])
  const onBackUp = useCallback(() => {
    if (ckbDataPath) {
      shell.openPath(ckbDataPath)
    }
  }, [ckbDataPath])
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
        setIsMigrateDialogShow(true)
      }
    })
    return () => {
      migrateSubscription.unsubscribe()
    }
  }, [hasDismissMigrate])
  const onCancel = useCallback(() => {
    setIsMigrateDialogShow(false)
    setHasDismissMigrate(true)
  }, [])
  const onConfirm = useCallback(() => {
    migrateData()
      .then(res => {
        if (isSuccessResponse(res)) {
          setIsMigrateDialogShow(false)
        }
      })
      .finally(() => {
        syncRebuildNotification.save()
      })
  }, [])
  return {
    isMigrateDialogShow,
    onCancel,
    onBackUp,
    onConfirm,
  }
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
  outputs: Partial<Record<'address' | 'amount' | 'date' | 'unit', string>>[],
  isMainnet: boolean,
  isSendMax?: boolean
) => {
  return useMemo(
    () =>
      outputs.map(({ address, amount, date, unit }, index) => {
        let amountError: ErrorWithI18n | undefined
        if (amount !== undefined) {
          try {
            const extraSize = date ? CONSTANTS.SINCE_FIELD_SIZE : 0
            validateAmount(amount)
            validateAmountRange(amount, extraSize)
            if (!(isSendMax && index === outputs.length - 1)) {
              validateCapacity({ address, amount, unit })
            }
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

export const useFirstLoadWallet = (dispatch: StateDispatch, id: string) => {
  useEffect(() => {
    const loadedIds = loadedWalletIDs.load()

    if (!loadedIds.includes(id)) {
      showPageNotice('overview.wallet-ready')(dispatch)
    }

    const ids = wallets.load().map(item => item.id)
    loadedWalletIDs.save(ids.join(','))
  }, [dispatch, id])
}

export const useClearGeneratedTx = () => {
  const dispatch = useDispatch()
  return useCallback(() => {
    dispatch({
      type: AppActions.ClearSendState,
    })
  }, [dispatch])
}

export const useCopy = () => {
  const timer = useRef<ReturnType<typeof setTimeout>>()
  const [copied, setCopied] = useState(false)
  const [copyTimes, setCopyTimes] = useState(1)
  const onCopy = useCallback(
    (content: string) => {
      setCopyTimes(key => key + 1)
      setCopied(true)
      window.navigator.clipboard.writeText(content)
      clearTimeout(timer.current!)
      timer.current = setTimeout(() => {
        setCopied(false)
      }, 2000)
    },
    [timer]
  )
  return {
    copied,
    onCopy,
    copyTimes,
  }
}

export const usePagination = (pagination?: { pageSize?: number; onPageChange?: (pageNo: number) => void }) => {
  const [pageNo, setPageNo] = useState(1)
  const pageSize = useMemo(() => pagination?.pageSize ?? 10, [pagination])
  const onPageChange = useCallback(
    (page: number) => {
      setPageNo(page)
      pagination?.onPageChange?.(page)
    },
    [pagination]
  )
  return {
    pageNo,
    pageSize,
    onPageChange,
  }
}
