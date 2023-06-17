import React, { useCallback, useState, useEffect, useMemo } from 'react'
import { isSuccessResponse, getMultisigAddress, DefaultLockInfo } from 'utils'
import { MultisigOutputUpdate } from 'services/subjects'
import {
  MultisigConfig,
  MultisigEntity,
  saveMultisigConfig,
  getMultisigConfig,
  importMultisigConfig,
  updateMultisigConfig,
  exportMultisigConfig,
  deleteMultisigConfig,
  getMultisigBalances,
  loadMultisigTxJson,
  OfflineSignJSON,
  getMultisigSyncProgress,
} from 'services/remote'
import { addressToScript, scriptToAddress, scriptToHash } from '@nervosnetwork/ckb-sdk-utils'

export const useSearch = (clearSelected: () => void, onFilterConfig: (searchKey: string) => void) => {
  const [keywords, setKeywords] = useState('')

  const onKeywordsChange = (_e?: React.FormEvent<HTMLInputElement | HTMLTextAreaElement>, newValue?: string) => {
    if (undefined !== newValue) {
      setKeywords(newValue)
    }
  }

  const onSearch = useCallback(
    (value: string) => {
      onFilterConfig(value)
      clearSelected()
    },
    [onFilterConfig, clearSelected]
  )

  const onClear = useCallback(() => {
    onSearch('')
  }, [onSearch])
  return { keywords, onKeywordsChange, setKeywords, onSearch, onClear }
}

export const useConfigManage = ({ walletId, isMainnet }: { walletId: string; isMainnet: boolean }) => {
  const [entities, setEntities] = useState<MultisigEntity[]>([])
  const saveConfig = useCallback(
    ({ m, n, r, addresses }: { m: number; n: number; r: number; addresses: string[] }) => {
      return saveMultisigConfig({
        m,
        n,
        r,
        blake160s: addresses.map(v => addressToScript(v).args),
        walletId,
      }).then(res => {
        if (isSuccessResponse(res)) {
          setEntities(v => (res.result ? [res.result, ...v] : v))
        } else {
          throw new Error(typeof res.message === 'string' ? res.message : res.message.content)
        }
      })
    },
    [walletId, setEntities]
  )
  useEffect(() => {
    getMultisigConfig(walletId).then(res => {
      if (isSuccessResponse(res) && res.result) {
        setEntities(res.result)
      }
    })
  }, [setEntities, walletId])
  const updateConfig = useCallback(
    (id: number) => (e: React.SyntheticEvent<any>) => {
      const { value } = e.target as HTMLInputElement
      updateMultisigConfig({ id, alias: value || '' }).then(res => {
        if (isSuccessResponse(res)) {
          setEntities(v => v.map(config => (res.result && config.id === res.result?.id ? res.result : config)))
        }
      })
    },
    [setEntities]
  )
  const deleteConfigById = useCallback(
    (id: number) => {
      setEntities(v => v.filter(config => config.id !== id))
    },
    [setEntities]
  )
  const onImportConfig = useCallback(() => {
    importMultisigConfig(walletId).then(res => {
      if (isSuccessResponse(res) && res.result) {
        const { result } = res
        if (result) {
          setEntities(v => [...result, ...v])
        }
      }
    })
  }, [walletId])
  const [searchKeywords, setSearchKeywords] = useState('')
  const onFilterConfig = useCallback(
    (v: string) => {
      setSearchKeywords(v)
    },
    [setSearchKeywords]
  )
  const allConfigs = useMemo<MultisigConfig[]>(
    () =>
      entities.map(entity => ({
        ...entity,
        addresses: entity.blake160s.map(args =>
          scriptToAddress(
            {
              args,
              codeHash: DefaultLockInfo.CodeHash,
              hashType: DefaultLockInfo.HashType,
            },
            isMainnet
          )
        ),
        fullPayload: getMultisigAddress(entity.blake160s, entity.r, entity.m, entity.n, isMainnet),
      })),
    [entities, isMainnet]
  )
  const configs = useMemo<MultisigConfig[]>(
    () =>
      searchKeywords
        ? allConfigs.filter(v => v.alias?.includes(searchKeywords) || v.fullPayload === searchKeywords)
        : allConfigs,
    [allConfigs, searchKeywords]
  )
  return {
    saveConfig,
    allConfigs,
    updateConfig,
    deleteConfigById,
    onImportConfig,
    configs,
    onFilterConfig,
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
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [sendFromMultisig, setSendFromMultisig] = useState<MultisigConfig | undefined>()
  const onOpenSendDialog = useCallback(
    (option: MultisigConfig) => {
      setIsDialogOpen(true)
      setSendFromMultisig(option)
    },
    [setIsDialogOpen, setSendFromMultisig]
  )
  const closeDialog = useCallback(() => {
    setIsDialogOpen(false)
  }, [setIsDialogOpen])

  return {
    action: onOpenSendDialog,
    closeDialog,
    sendFromMultisig,
    isDialogOpen,
  }
}

const useInfoAction = () => {
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [multisigConfig, setMultisigConfig] = useState<MultisigConfig | undefined>()
  const viewMultisigConfig = useCallback(
    (option: MultisigConfig) => {
      setIsDialogOpen(true)
      setMultisigConfig(option)
    },
    [setIsDialogOpen, setMultisigConfig]
  )
  const closeDialog = useCallback(() => {
    setIsDialogOpen(false)
  }, [setIsDialogOpen])
  return {
    action: viewMultisigConfig,
    closeDialog,
    multisigConfig,
    isDialogOpen,
  }
}

const useDeleteAction = (deleteConfigById: (id: number) => void) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [deleteErrorMessage, setDeleteErrorMessage] = useState<string | undefined>()
  const [config, setConfig] = useState<MultisigConfig>()
  const deleteConfig = useCallback(() => {
    if (config) {
      deleteMultisigConfig(config.id).then(res => {
        if (isSuccessResponse(res)) {
          if (res.result) {
            deleteConfigById(config.id)
          }
        } else {
          setIsDialogOpen(true)
          setDeleteErrorMessage(typeof res.message === 'string' ? res.message : res.message.content)
        }
      })
    }
  }, [deleteConfigById, setDeleteErrorMessage, setIsDialogOpen, config])
  const closeDialog = useCallback(() => {
    setIsDialogOpen(false)
  }, [setIsDialogOpen])
  return {
    action: deleteConfig,
    closeDialog,
    deleteErrorMessage,
    setConfig,
    isDialogOpen,
  }
}

const useApproveAction = () => {
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [multisigConfig, setMultisigConfig] = useState<MultisigConfig | undefined>()
  const [offlineSignJson, setOfflineSignJson] = useState<OfflineSignJSON | undefined>()
  const action = useCallback(
    (option: MultisigConfig) => {
      setMultisigConfig(undefined)
      if (option.fullPayload) {
        loadMultisigTxJson(option.fullPayload).then(res => {
          if (isSuccessResponse(res) && res.result) {
            setIsDialogOpen(true)
            setMultisigConfig(option)
            setOfflineSignJson(res.result)
          }
        })
      }
    },
    [setIsDialogOpen]
  )
  const closeDialog = useCallback(() => {
    setIsDialogOpen(false)
  }, [setIsDialogOpen])
  return {
    action,
    closeDialog,
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
  isLightClient,
}: {
  walletId: string
  isMainnet: boolean
  configs: MultisigConfig[]
  isLightClient: boolean
}) => {
  const [multisigBanlances, setMultisigBanlances] = useState<Record<string, string>>({})
  const [multisigSyncProgress, setMultisigSyncProgress] = useState<Record<string, number>>({})
  const getAndSaveMultisigBalances = useCallback(() => {
    getMultisigBalances({ isMainnet, multisigAddresses: configs.map(v => v.fullPayload) }).then(res => {
      if (isSuccessResponse(res) && res.result) {
        setMultisigBanlances(res.result)
      }
    })
  }, [setMultisigBanlances, isMainnet, configs])
  const hashToPayload = useMemo(
    () =>
      configs.reduce<Record<string, string>>(
        (pre, cur) => ({ ...pre, [scriptToHash(addressToScript(cur.fullPayload))]: cur.fullPayload }),
        {}
      ),
    [configs]
  )
  const getAndSaveMultisigSyncProgress = useCallback(() => {
    getMultisigSyncProgress(Object.keys(hashToPayload)).then(res => {
      if (isSuccessResponse(res) && res.result) {
        const tmp: Record<string, number> = {}
        res.result.forEach(v => {
          if (hashToPayload[v.hash]) {
            tmp[hashToPayload[v.hash]] = v.blockStartNumber
          }
        })
        setMultisigSyncProgress(tmp)
      }
    })
  }, [hashToPayload])
  useEffect(() => {
    const dataUpdateSubscription = MultisigOutputUpdate.subscribe(() => {
      getAndSaveMultisigBalances()
    })
    getAndSaveMultisigBalances()
    return () => {
      dataUpdateSubscription.unsubscribe()
    }
  }, [walletId, getAndSaveMultisigBalances])
  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | undefined
    if (isLightClient) {
      interval = setInterval(() => {
        getAndSaveMultisigSyncProgress()
      }, 10000)
      getAndSaveMultisigSyncProgress()
    }
    return () => {
      clearInterval(interval)
    }
  }, [isLightClient, getAndSaveMultisigSyncProgress])
  return { multisigBanlances, multisigSyncProgress }
}
