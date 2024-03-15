import { TFunction } from 'i18next'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { importedWalletDialogShown } from 'services/localCache'
import { isDark, openExternal, setTheme as setThemeAPI, updateWalletStartBlockNumber } from 'services/remote'
import { Migrate } from 'services/subjects'
import { getExplorerUrl, isSuccessResponse } from 'utils'

const waitConfirmTime = 5

const useCountDown = (second: number) => {
  const [countdown, setCountdown] = useState(0)
  const countDecreaseIntervalRef = useRef<ReturnType<typeof setInterval>>()
  const resetCountDown = useCallback(() => {
    clearInterval(countDecreaseIntervalRef.current)
    setCountdown(second)
    const decrement = () => {
      countDecreaseIntervalRef.current = setInterval(() => {
        setCountdown(v => {
          if (v > 0) {
            return v - 1
          }
          clearInterval(countDecreaseIntervalRef.current)
          return v
        })
      }, 1_000)
    }
    decrement()
  }, [setCountdown, countDecreaseIntervalRef])
  return {
    countdown,
    resetCountDown,
  }
}

export const useSetBlockNumber = ({
  firstAddress,
  walletID,
  isMainnet,
  isLightClient,
  isHomePage,
  initStartBlockNumber,
  headerTipNumber,
  t,
}: {
  firstAddress: string
  walletID: string
  isMainnet: boolean
  isLightClient: boolean
  isHomePage?: boolean
  initStartBlockNumber?: number
  headerTipNumber: number
  t: TFunction
}) => {
  const [isSetStartBlockShown, setIsSetStartBlockShown] = useState(false)
  const [startBlockNumber, setStartBlockNumber] = useState('')
  const [blockNumberErr, setBlockNumberErr] = useState('')
  const isSetLessThanBefore = useMemo(
    () => !!(startBlockNumber && initStartBlockNumber && +startBlockNumber < initStartBlockNumber),
    [initStartBlockNumber, startBlockNumber]
  )
  const { countdown, resetCountDown } = useCountDown(waitConfirmTime)
  const onChangeStartBlockNumber = useCallback(
    (e: React.SyntheticEvent<HTMLInputElement>) => {
      const { value } = e.currentTarget
      const blockNumber = value.replaceAll(',', '')
      if (Number.isNaN(+blockNumber)) {
        return
      }
      setStartBlockNumber(+blockNumber > headerTipNumber ? headerTipNumber.toString() : blockNumber)
      setBlockNumberErr(+blockNumber > headerTipNumber ? t('set-start-block-number.reset-to-header-tip-number') : '')
      resetCountDown()
    },
    [resetCountDown, initStartBlockNumber, headerTipNumber, t]
  )
  const onOpenAddressInExplorer = useCallback(() => {
    const explorerUrl = getExplorerUrl(isMainnet)
    openExternal(`${explorerUrl}/address/${firstAddress}`)
  }, [firstAddress, isMainnet])
  const onViewBlock = useCallback(() => {
    const explorerUrl = getExplorerUrl(isMainnet)
    openExternal(`${explorerUrl}/block/${startBlockNumber}`)
  }, [startBlockNumber, isMainnet])
  const onConfirm = useCallback(() => {
    updateWalletStartBlockNumber({
      id: walletID,
      startBlockNumber: `0x${BigInt(startBlockNumber).toString(16)}`,
    }).then(res => {
      if (isSuccessResponse(res)) {
        setIsSetStartBlockShown(false)
      } else {
        setBlockNumberErr(typeof res.message === 'string' ? res.message : res.message.content!)
      }
    })
  }, [startBlockNumber, walletID])
  const openDialog = useCallback(() => {
    setIsSetStartBlockShown(true)
    setStartBlockNumber(initStartBlockNumber?.toString() ?? '')
    setBlockNumberErr('')
  }, [initStartBlockNumber])
  useEffect(() => {
    if (isHomePage) {
      const needShow = importedWalletDialogShown.getStatus(walletID)
      if (needShow && isLightClient) {
        openDialog()
      }
      importedWalletDialogShown.setStatus(walletID, false)
    }
  }, [walletID, isLightClient, isHomePage, openDialog])
  return {
    openDialog,
    closeDialog: useCallback(() => setIsSetStartBlockShown(false), []),
    isSetStartBlockShown,
    startBlockNumber,
    onChangeStartBlockNumber,
    onOpenAddressInExplorer,
    onViewBlock,
    onConfirm,
    blockNumberErr,
    countdown,
    isSetLessThanBefore,
  }
}

export const useTheme = () => {
  const [theme, setTheme] = useState<'dark' | 'light'>()
  useEffect(() => {
    isDark().then(res => {
      if (isSuccessResponse(res)) {
        setTheme(res.result ? 'dark' : 'light')
      }
    })
  }, [])
  const onSetTheme = useCallback(() => {
    const newTheme = theme === 'dark' ? 'light' : 'dark'
    setThemeAPI(newTheme).then(res => {
      if (isSuccessResponse(res)) {
        setTheme(newTheme)
      }
    })
  }, [theme])
  return {
    theme,
    onSetTheme,
  }
}

export const useMigrate = () => {
  const [isMigrate, setIsMigrate] = useState(false)
  useEffect(() => {
    const migrateSubscription = Migrate.subscribe(migrateStatus => {
      setIsMigrate(migrateStatus === 'migrating')
    })
    return () => {
      migrateSubscription.unsubscribe()
    }
  }, [])
  return isMigrate
}
