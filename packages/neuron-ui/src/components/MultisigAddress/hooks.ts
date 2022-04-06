import React, { useCallback, useState, useEffect } from 'react'
import { useDialogWrapper, isSuccessResponse } from 'utils'
import { MultisigOutputUpdate } from 'services/subjects'
import {
  MultisigConfig,
  saveMultisigConfig,
  getMultisigConfig,
  importMultisigConfig,
  updateMultisigConfig,
  exportMultisigConfig,
  deleteMultisigConfig,
  getMultisigBalances,
  loadMultisigTxJson,
  OfflineSignJSON,
} from 'services/remote'

export const useSearch = (clearSelected: () => void) => {
  const [keywords, setKeywords] = useState('')
  const [searchKeywords, setSearchKeywords] = useState('')

  const onKeywordsChange = (_e?: React.FormEvent<HTMLInputElement | HTMLTextAreaElement>, newValue?: string) => {
    if (undefined !== newValue) {
      setKeywords(newValue)
    }
  }

  const onSearch = useCallback(
    value => {
      setSearchKeywords(value)
      clearSelected()
    },
    [setSearchKeywords, clearSelected]
  )

  const onClear = useCallback(() => {
    onSearch('')
  }, [onSearch])
  return { keywords, onKeywordsChange, setKeywords, onSearch, searchKeywords, onClear }
}

export const useConfigManage = ({ walletId, isMainnet }: { walletId: string; isMainnet: boolean }) => {
  const [configs, setConfigs] = useState<MultisigConfig[]>([])
  const saveConfig = useCallback(
    ({ m, n, r, addresses, fullPayload }) => {
      return saveMultisigConfig({
        m,
        n,
        r,
        addresses,
        fullPayload,
        walletId,
      }).then(res => {
        if (isSuccessResponse(res)) {
          if (res.result) {
            setConfigs(v => [res.result!, ...v])
          }
        } else {
          throw new Error(typeof res.message === 'string' ? res.message : res.message.content)
        }
      })
    },
    [walletId, setConfigs]
  )
  useEffect(() => {
    getMultisigConfig({
      walletId,
    }).then(res => {
      if (isSuccessResponse(res)) {
        setConfigs(res.result)
      }
    })
  }, [setConfigs, walletId])
  const updateConfig = useCallback(
    (id: number) => (alias: string | undefined) => {
      updateMultisigConfig({ id, alias: alias || '' }).then(res => {
        if (isSuccessResponse(res)) {
          setConfigs(v => v.map(config => (config.id === res.result?.id ? res.result : config)))
        }
      })
    },
    [setConfigs]
  )
  const filterConfig = useCallback((key: string) => {
    setConfigs(v =>
      v.filter(config => {
        return config.alias?.includes(key) || config.fullPayload === key
      })
    )
  }, [])
  const deleteConfigById = useCallback(
    (id: number) => {
      setConfigs(v => v.filter(config => config.id !== id))
    },
    [setConfigs]
  )
  const onImportConfig = useCallback(() => {
    importMultisigConfig({ isMainnet, walletId }).then(res => {
      if (isSuccessResponse(res) && res.result) {
        const { result } = res
        if (result) {
          setConfigs(v => [...result, ...v])
        }
      }
    })
  }, [walletId, isMainnet])
  return {
    saveConfig,
    allConfigs: configs,
    updateConfig,
    deleteConfigById,
    filterConfig,
    onImportConfig,
  }
}

export const useExportConfig = (configs: MultisigConfig[]) => {
  const [selectIds, setSelectIds] = useState<number[]>([])
  const onChangeCheckedAll = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.checked) {
        setSelectIds(configs.map(v => v.id))
      } else {
        setSelectIds([])
      }
    },
    [setSelectIds, configs]
  )
  const onChangeChecked = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const { configId } = e.target.dataset
      if (configId) {
        if (e.target.checked) {
          setSelectIds([...selectIds, Number(configId)])
        } else {
          setSelectIds(selectIds.filter(v => v.toString() !== configId))
        }
      }
    },
    [selectIds, setSelectIds]
  )
  const exportConfig = useCallback(() => {
    exportMultisigConfig(selectIds.length ? configs.filter(v => selectIds.includes(v.id)) : configs)
  }, [configs, selectIds])
  const clearSelected = useCallback(() => setSelectIds([]), [setSelectIds])
  return {
    onChangeCheckedAll,
    onChangeChecked,
    selectIds,
    isAllSelected: !!configs.length && selectIds.length === configs.length,
    exportConfig,
    clearSelected,
  }
}

const useSendAction = () => {
  const { openDialog, closeDialog, dialogRef, isDialogOpen } = useDialogWrapper()
  const [sendFromMultisig, setSendFromMultisig] = useState<MultisigConfig | undefined>()
  const onOpenSendDialog = useCallback(
    (option: MultisigConfig) => {
      openDialog()
      setSendFromMultisig(option)
    },
    [openDialog, setSendFromMultisig]
  )
  return {
    action: onOpenSendDialog,
    closeDialog,
    dialogRef,
    sendFromMultisig,
    isDialogOpen,
  }
}

const useInfoAction = () => {
  const { openDialog: openInfoDialog, closeDialog, dialogRef } = useDialogWrapper()
  const [multisigConfig, setMultisigConfig] = useState<MultisigConfig | undefined>()
  const viewMultisigConfig = useCallback(
    (option: MultisigConfig) => {
      openInfoDialog()
      setMultisigConfig(option)
    },
    [openInfoDialog, setMultisigConfig]
  )
  return {
    action: viewMultisigConfig,
    closeDialog,
    dialogRef,
    multisigConfig,
  }
}

const useDeleteAction = (deleteConfigById: (id: number) => void) => {
  const { openDialog, closeDialog, dialogRef } = useDialogWrapper()
  const [deleteErrorMessage, setDeleteErrorMessage] = useState<string | undefined>()
  const deleteConfig = useCallback(
    (option: MultisigConfig) => {
      deleteMultisigConfig(option.id).then(res => {
        if (isSuccessResponse(res)) {
          if (res.result) {
            deleteConfigById(option.id)
          }
        } else {
          openDialog()
          setDeleteErrorMessage(typeof res.message === 'string' ? res.message : res.message.content)
        }
      })
    },
    [deleteConfigById, setDeleteErrorMessage, openDialog]
  )
  return {
    action: deleteConfig,
    closeDialog,
    dialogRef,
    deleteErrorMessage,
  }
}

const useApproveAction = () => {
  const { openDialog, closeDialog, dialogRef, isDialogOpen } = useDialogWrapper()
  const [multisigConfig, setMultisigConfig] = useState<MultisigConfig | undefined>()
  const [offlineSignJson, setOfflineSignJson] = useState<OfflineSignJSON | undefined>()
  const action = useCallback(
    (option: MultisigConfig) => {
      setMultisigConfig(undefined)
      if (option.fullPayload) {
        loadMultisigTxJson(option.fullPayload).then(res => {
          if (isSuccessResponse(res) && res.result) {
            openDialog()
            setMultisigConfig(option)
            setOfflineSignJson(res.result)
          }
        })
      }
    },
    [openDialog]
  )
  return {
    action,
    closeDialog,
    dialogRef,
    multisigConfig,
    isDialogOpen,
    offlineSignJson,
  }
}

export const useActions = ({ deleteConfigById }: { deleteConfigById: (id: number) => void }) => {
  return {
    deleteAction: useDeleteAction(deleteConfigById),
    infoAction: useInfoAction(),
    sendAction: useSendAction(),
    approveAction: useApproveAction(),
  }
}

export const useSubscription = ({
  walletId,
  isMainnet,
  configs,
}: {
  walletId: string
  isMainnet: boolean
  configs: MultisigConfig[]
}) => {
  const [multisigBanlances, setMultisigBanlances] = useState<Record<string, string>>({})
  const getAndSaveMultisigBalances = useCallback(() => {
    getMultisigBalances({ isMainnet, multisigAddresses: configs.map(v => v.fullPayload) }).then(res => {
      if (isSuccessResponse(res) && res.result) {
        setMultisigBanlances(res.result)
      }
    })
  }, [setMultisigBanlances, isMainnet, configs])
  useEffect(() => {
    const dataUpdateSubscription = MultisigOutputUpdate.subscribe(() => {
      getAndSaveMultisigBalances()
    })
    getAndSaveMultisigBalances()
    return () => {
      dataUpdateSubscription.unsubscribe()
    }
  }, [walletId, getAndSaveMultisigBalances])
  return multisigBanlances
}
