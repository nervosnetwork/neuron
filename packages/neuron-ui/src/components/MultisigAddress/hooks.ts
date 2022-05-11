import React, { useCallback, useState, useEffect, useMemo } from 'react'
import { useDialogWrapper, isSuccessResponse, getMultisigAddress, DefaultLockInfo } from 'utils'
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
} from 'services/remote'
import { addressToScript, scriptToAddress } from '@nervosnetwork/ckb-sdk-utils'

export const useSearch = (clearSelected: () => void, onFilterConfig: (searchKey: string) => void) => {
  const [keywords, setKeywords] = useState('')

  const onKeywordsChange = (_e?: React.FormEvent<HTMLInputElement | HTMLTextAreaElement>, newValue?: string) => {
    if (undefined !== newValue) {
      setKeywords(newValue)
    }
  }

  const onSearch = useCallback(
    value => {
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
  }, [setEntities, walletId, isMainnet])
  const updateConfig = useCallback(
    (id: number) => (alias: string | undefined) => {
      updateMultisigConfig({ id, alias: alias || '' }).then(res => {
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
