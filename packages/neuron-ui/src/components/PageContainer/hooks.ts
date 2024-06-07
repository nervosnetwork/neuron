import { useCallback, useEffect, useState } from 'react'
import { importedWalletDialogShown } from 'services/localCache'
import { isDark, setTheme as setThemeAPI, updateWalletStartBlockNumber } from 'services/remote'
import { Migrate } from 'services/subjects'
import { isSuccessResponse } from 'utils'

export const useSetBlockNumber = ({
  walletID,
  isLightClient,
  isHomePage,
  initStartBlockNumber,
}: {
  walletID: string
  isLightClient: boolean
  isHomePage?: boolean
  initStartBlockNumber?: number
}) => {
  const [isSetStartBlockShown, setIsSetStartBlockShown] = useState(false)
  const onConfirm = useCallback(
    (startBlockNumber: number) => {
      return updateWalletStartBlockNumber({
        id: walletID,
        startBlockNumber: `0x${BigInt(startBlockNumber).toString(16)}`,
      }).then(res => {
        if (isSuccessResponse(res)) {
          setIsSetStartBlockShown(false)
        } else {
          throw new Error(typeof res.message === 'string' ? res.message : res.message.content!)
        }
      })
    },
    [walletID]
  )
  const openDialog = useCallback(() => {
    setIsSetStartBlockShown(true)
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
    onConfirm,
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
