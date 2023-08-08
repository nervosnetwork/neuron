import { useCallback, useEffect, useState } from 'react'
import { importedWalletDialogShown } from 'services/localCache'
import { isDark, openExternal, updateWallet, setTheme as setThemeAPI } from 'services/remote'
import { Migrate } from 'services/subjects'
import { getExplorerUrl, isSuccessResponse } from 'utils'

export const useSetBlockNumber = ({
  firstAddress,
  walletID,
  isMainnet,
  isLightClient,
  isHomePage,
}: {
  firstAddress: string
  walletID: string
  isMainnet: boolean
  isLightClient: boolean
  isHomePage?: boolean
}) => {
  const [isSetStartBlockShown, setIsSetStartBlockShown] = useState(false)
  const [startBlockNumber, setStartBlockNumber] = useState('')
  const [blockNumberErr, setBlockNumberErr] = useState('')
  const onChangeStartBlockNumber = useCallback((e: React.SyntheticEvent<HTMLInputElement>) => {
    const { value } = e.currentTarget
    const blockNumber = value.replace(/,/g, '')
    if (Number.isNaN(+blockNumber) || /[^\d]/.test(blockNumber)) {
      return
    }
    setStartBlockNumber(blockNumber)
    setBlockNumberErr('')
  }, [])
  const onOpenAddressInExplorer = useCallback(() => {
    const explorerUrl = getExplorerUrl(isMainnet)
    openExternal(`${explorerUrl}/address/${firstAddress}`)
  }, [firstAddress, isMainnet])
  const onViewBlock = useCallback(() => {
    const explorerUrl = getExplorerUrl(isMainnet)
    openExternal(`${explorerUrl}/block/${startBlockNumber}`)
  }, [startBlockNumber, isMainnet])
  const onConfirm = useCallback(() => {
    updateWallet({ id: walletID, startBlockNumber: `0x${BigInt(startBlockNumber).toString(16)}` }).then(res => {
      if (isSuccessResponse(res)) {
        setIsSetStartBlockShown(false)
      } else {
        setBlockNumberErr(typeof res.message === 'string' ? res.message : res.message.content!)
      }
    })
  }, [startBlockNumber, walletID])
  const openDialog = useCallback(() => {
    setIsSetStartBlockShown(true)
    setStartBlockNumber('')
    setBlockNumberErr('')
  }, [])
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
