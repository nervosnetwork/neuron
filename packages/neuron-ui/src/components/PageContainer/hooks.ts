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
  const [showSetStartBlock, setShowSetStartBlock] = useState(false)
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
  }, [firstAddress])
  const onViewBlock = useCallback(() => {
    const explorerUrl = getExplorerUrl(isMainnet)
    openExternal(`${explorerUrl}/block/${startBlockNumber}`)
  }, [startBlockNumber, isMainnet])
  const onConfirm = useCallback(() => {
    updateWallet({ id: walletID, startBlockNumberInLight: `0x${BigInt(startBlockNumber).toString(16)}` }).then(res => {
      if (isSuccessResponse(res)) {
        setShowSetStartBlock(false)
      } else {
        setBlockNumberErr(typeof res.message === 'string' ? res.message : res.message.content!)
      }
    })
  }, [startBlockNumber, walletID])
  const openDialog = useCallback(() => {
    setShowSetStartBlock(true)
    setStartBlockNumber('')
  }, [])
  useEffect(() => {
    if (isHomePage) {
      const needShow = importedWalletDialogShown.needShow(walletID)
      if (needShow && isLightClient) {
        openDialog()
      }
      importedWalletDialogShown.setShown(walletID)
    }
  }, [walletID, isLightClient, isHomePage, openDialog])
  return {
    openDialog,
    closeDialog: useCallback(() => setShowSetStartBlock(false), []),
    showSetStartBlock,
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
