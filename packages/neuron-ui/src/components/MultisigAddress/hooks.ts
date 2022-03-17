import React, { useCallback, useState, useEffect, useRef, useMemo } from 'react'
import { useDialog, isSuccessResponse } from 'utils'
import {
  MultisigConfig,
  ImportMultisigConfig,
  saveMultisigConfig,
  getMultisigConfig,
  importMultisigConfig,
  updateMultisigConfig,
  exportMultisigConfig,
  deleteMultisigConfig,
} from 'services/remote'

export const useSearch = () => {
  const [keywords, setKeywords] = useState('')
  const [searchKeywords, setSearchKeywords] = useState('')

  const onKeywordsChange = (_e?: React.FormEvent<HTMLInputElement | HTMLTextAreaElement>, newValue?: string) => {
    if (undefined !== newValue) {
      setKeywords(newValue)
    }
  }

  const onSearch = useCallback(() => {
    setSearchKeywords(keywords)
  }, [keywords, setSearchKeywords])

  return { keywords, onKeywordsChange, setKeywords, onSearch, searchKeywords }
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

export const useConfigManage = ({ walletId, searchKeywords }: { walletId: string; searchKeywords: string }) => {
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
  return {
    saveConfig,
    configs: useMemo(
      () =>
        searchKeywords
          ? configs.filter(v => {
              return v.alias?.includes(searchKeywords) || v.fullPayload === searchKeywords
            })
          : configs,
      [configs, searchKeywords]
    ),
    updateConfig,
    deleteConfigById,
    filterConfig,
  }
}

export const useImportConfig = ({
  saveConfig,
  isMainnet,
}: {
  isMainnet: boolean
  saveConfig: (config: Omit<MultisigConfig, 'walletId' | 'id'>) => Promise<void>
}) => {
  const [importErr, setImportErr] = useState<string | undefined>()
  const [importConfig, setImportConfig] = useState<ImportMultisigConfig | undefined>()
  const { openDialog, closeDialog, dialogRef } = useDialogWrapper()
  const onImportConfig = useCallback(() => {
    importMultisigConfig(isMainnet).then(res => {
      if (isSuccessResponse(res) && res.result) {
        setImportConfig(res.result)
        openDialog()
      } else {
        setImportConfig(undefined)
      }
    })
  }, [openDialog, setImportConfig, isMainnet])
  const closeDialogAndReset = useCallback(() => {
    closeDialog()
    setImportConfig(undefined)
    setImportErr(undefined)
  }, [closeDialog, setImportConfig, setImportErr])
  const confirm = useCallback(() => {
    if (importConfig) {
      saveConfig(importConfig)
        .then(() => {
          closeDialogAndReset()
          setImportConfig(undefined)
        })
        .catch(err => {
          setImportErr(err.message.toString())
        })
    }
  }, [closeDialogAndReset, saveConfig, importConfig])
  return {
    onImportConfig,
    importConfig,
    closeDialog: closeDialogAndReset,
    dialogRef,
    confirm,
    importErr,
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
  return {
    onChangeCheckedAll,
    onChangeChecked,
    selectIds,
    isAllSelected: !!configs.length && selectIds.length === configs.length,
    exportConfig,
  }
}

export const useActions = ({ deleteConfigById }: { deleteConfigById: (id: number) => void }) => {
  const {
    openDialog: openDeleteErrorDialog,
    closeDialog: closeDeleteErrorDialog,
    dialogRef: deleteErrorDialogRef,
  } = useDialogWrapper()
  const [deleteErrorMessage, setDeleteErrorMessage] = useState<string | undefined>()
  const deleteConfig = useCallback(
    (option: MultisigConfig) => {
      deleteMultisigConfig({ id: option.id }).then(res => {
        if (isSuccessResponse(res)) {
          deleteConfigById(option.id)
        } else {
          openDeleteErrorDialog()
          setDeleteErrorMessage(typeof res.message === 'string' ? res.message : res.message.content)
        }
      })
    },
    [deleteConfigById, setDeleteErrorMessage, openDeleteErrorDialog]
  )
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
    deleteAction: {
      action: deleteConfig,
      closeDialog: closeDeleteErrorDialog,
      dialogRef: deleteErrorDialogRef,
      deleteErrorMessage,
    },
    infoAction: {
      action: viewMultisigConfig,
      closeDialog,
      dialogRef,
      multisigConfig,
    },
  }
}
