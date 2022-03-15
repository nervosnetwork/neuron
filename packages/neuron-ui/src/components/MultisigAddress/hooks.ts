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
  const [config, changeConfig] = useState<MultisigConfig[]>([])
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
            changeConfig([res.result, ...config])
          }
        } else {
          throw new Error(typeof res.message === 'string' ? res.message : res.message.content)
        }
      })
    },
    [walletId, config]
  )
  useEffect(() => {
    getMultisigConfig({
      walletId,
    }).then(res => {
      if (isSuccessResponse(res)) {
        changeConfig(res.result)
      }
    })
  }, [changeConfig, walletId])
  const updateConfig = useCallback(
    (id: number) => (alias: string | undefined) => {
      updateMultisigConfig({ id, alias: alias || '' }).then(res => {
        if (isSuccessResponse(res)) {
          changeConfig(config.map(v => (v.id === res.result?.id ? res.result : v)))
        }
      })
    },
    [config, changeConfig]
  )
  const filterConfig = useCallback(
    (key: string) => {
      changeConfig(
        config.filter(v => {
          return v.alias?.includes(key) || v.fullPayload === key
        })
      )
    },
    [config]
  )
  const deleteConfigById = useCallback(
    (id: number) => {
      changeConfig(config.filter(v => v.id !== id))
    },
    [config, changeConfig]
  )
  return {
    saveConfig,
    config: useMemo(
      () =>
        searchKeywords
          ? config.filter(v => {
              return v.alias?.includes(searchKeywords) || v.fullPayload === searchKeywords
            })
          : config,
      [config, searchKeywords]
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
  const [importErr, setImportErr] = useState<string>()
  const [importConfig, changeImportConfig] = useState<ImportMultisigConfig | undefined>()
  const { openDialog, closeDialog, dialogRef } = useDialogWrapper()
  const onImportConfig = useCallback(() => {
    importMultisigConfig({ isMainnet }).then(res => {
      if (isSuccessResponse(res) && res.result) {
        changeImportConfig(res.result)
        openDialog()
      } else {
        changeImportConfig(undefined)
      }
    })
  }, [openDialog, changeImportConfig, isMainnet])
  const closeDialogAndReset = useCallback(() => {
    closeDialog()
    changeImportConfig(undefined)
    setImportErr(undefined)
  }, [closeDialog, changeImportConfig, setImportErr])
  const confirm = useCallback(() => {
    if (importConfig) {
      saveConfig(importConfig)
        .then(() => {
          closeDialogAndReset()
          changeImportConfig(undefined)
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

export const useExportConfig = (config: MultisigConfig[]) => {
  const [selectIds, changeSelectIds] = useState<number[]>([])
  const onChangeCheckedAll = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.checked) {
        changeSelectIds(config.map(v => v.id))
      } else {
        changeSelectIds([])
      }
    },
    [changeSelectIds, config]
  )
  const onChangeChecked = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const { configId } = e.target.dataset
      if (configId) {
        if (e.target.checked) {
          changeSelectIds([...selectIds, Number(configId)])
        } else {
          changeSelectIds(selectIds.filter(v => v.toString() !== configId))
        }
      }
    },
    [selectIds, changeSelectIds]
  )
  const exportConfig = useCallback(() => {
    exportMultisigConfig(selectIds.length ? config.filter(v => selectIds.includes(v.id)) : config)
  }, [config, selectIds])
  return {
    onChangeCheckedAll,
    onChangeChecked,
    selectIds,
    isAllSelected: !!config.length && selectIds.length === config.length,
    exportConfig,
  }
}

export const useActions = ({ deleteConfigById }: { deleteConfigById: (id: number) => void }) => {
  const deleteConfig = useCallback(
    (option: MultisigConfig) => {
      deleteMultisigConfig({ id: option.id }).then(res => {
        if (isSuccessResponse(res)) {
          deleteConfigById(option.id)
        }
      })
    },
    [deleteConfigById]
  )
  const { openDialog: openInfoDialog, closeDialog, dialogRef } = useDialogWrapper()
  const [multisigConfig, changeMultisigConfig] = useState<MultisigConfig | undefined>()
  const viewMultisigConfig = useCallback(
    (option: MultisigConfig) => {
      openInfoDialog()
      changeMultisigConfig(option)
    },
    [openInfoDialog, changeMultisigConfig]
  )
  return {
    deleteAction: {
      action: deleteConfig,
    },
    infoAction: {
      action: viewMultisigConfig,
      closeDialog,
      dialogRef,
      multisigConfig,
    },
  }
}
