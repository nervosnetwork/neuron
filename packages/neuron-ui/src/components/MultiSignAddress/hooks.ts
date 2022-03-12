import React, { useCallback, useState, useEffect, useRef, useMemo } from 'react'
import { useDialog, isSuccessResponse } from 'utils'
import {
  MultiSignConfig,
  ImportMultiSignConfig,
  saveMultiSignConfig,
  getMultiSignConfig,
  importMultiSignConfig,
  updateMultiSignConfig,
  exportMultiSignConfig,
  deleteMultiSignConfig,
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
  const [config, changeConfig] = useState<MultiSignConfig[]>([])
  const saveConfig = useCallback(
    ({ m, n, r, blake160s, fullPayload }) => {
      return saveMultiSignConfig({
        m,
        n,
        r,
        blake160s,
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
    getMultiSignConfig({
      walletId,
    }).then(res => {
      if (isSuccessResponse(res)) {
        changeConfig(res.result)
      }
    })
  }, [changeConfig, walletId])
  const updateConfig = useCallback(
    (id: number) => (alias: string | undefined) => {
      updateMultiSignConfig({ id, alias: alias || '' }).then(res => {
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
  saveConfig: (config: Omit<MultiSignConfig, 'walletId' | 'id'>) => Promise<void>
}) => {
  const [importErr, setImportErr] = useState<string>()
  const [importConfig, changeImportConfig] = useState<ImportMultiSignConfig | undefined>()
  const { openDialog, closeDialog, dialogRef } = useDialogWrapper()
  const onImportConfig = useCallback(() => {
    importMultiSignConfig({ isMainnet }).then(res => {
      if (isSuccessResponse(res) && res.result) {
        changeImportConfig(res.result)
        openDialog()
      } else {
        changeImportConfig(undefined)
      }
    })
  }, [openDialog, changeImportConfig, isMainnet])
  const confirm = useCallback(() => {
    if (importConfig) {
      saveConfig(importConfig)
        .then(() => {
          closeDialog()
        })
        .catch(err => {
          setImportErr(err.message.toString())
        })
    }
  }, [closeDialog, saveConfig, importConfig])
  return {
    onImportConfig,
    importConfig,
    closeDialog,
    dialogRef,
    confirm,
    importErr,
  }
}

export const useExportConfig = (config: MultiSignConfig[]) => {
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
    exportMultiSignConfig(selectIds.length ? config.filter(v => selectIds.includes(v.id)) : config)
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
    (option: MultiSignConfig) => {
      deleteMultiSignConfig({ id: option.id }).then(res => {
        if (isSuccessResponse(res)) {
          deleteConfigById(option.id)
        }
      })
    },
    [deleteConfigById]
  )
  const { openDialog: openInfoDialog, closeDialog, dialogRef } = useDialogWrapper()
  const [multiSignConfig, changeMultiSignConfig] = useState<MultiSignConfig | undefined>()
  const viewMultisignConfig = useCallback(
    (option: MultiSignConfig) => {
      openInfoDialog()
      changeMultiSignConfig(option)
    },
    [openInfoDialog, changeMultiSignConfig]
  )
  return {
    deleteAction: {
      action: deleteConfig,
    },
    infoAction: {
      action: viewMultisignConfig,
      closeDialog,
      dialogRef,
      multiSignConfig,
    },
  }
}
