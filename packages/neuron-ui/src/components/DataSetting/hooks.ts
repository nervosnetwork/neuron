import React, { useCallback, useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  getCkbNodeDataPath,
  invokeShowOpenDialog,
  startProcessMonitor,
  stopProcessMonitor,
  setCkbNodeDataPath,
} from 'services/remote'
import { isSuccessResponse, useDidMount } from 'utils'

const type = 'ckb'

export const useDataPath = () => {
  const [t] = useTranslation()
  const [isSaving, setIsSaveing] = useState(false)
  const [savingType, setSavingType] = useState<string | null>()
  const [prevPath, setPrevPath] = useState<string>()
  const [currentPath, setCurrentPath] = useState<string | undefined>()
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  useDidMount(() => {
    getCkbNodeDataPath().then(res => {
      if (isSuccessResponse(res)) {
        setPrevPath(res.result!)
      }
    })
  })
  const onSetting = useCallback(() => {
    invokeShowOpenDialog({
      buttonLabel: t('settings.data.set', { lng: navigator.language }),
      properties: ['openDirectory', 'createDirectory', 'promptToCreate', 'treatPackageAsDirectory'],
    }).then(res => {
      if (isSuccessResponse(res) && !res.result?.canceled && res.result?.filePaths?.length) {
        setCurrentPath(res.result?.filePaths?.[0])
        stopProcessMonitor(type).then(stopRes => {
          if (isSuccessResponse(stopRes)) {
            setIsDialogOpen(true)
          }
        })
      }
    })
  }, [t, type])
  const onCancel = useCallback(() => {
    startProcessMonitor(type).then(res => {
      if (isSuccessResponse(res)) {
        setIsDialogOpen(false)
      }
    })
  }, [setIsDialogOpen, type])
  const onConfirm = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      const { dataset } = e.currentTarget
      setIsSaveing(true)
      setSavingType(dataset.syncType)
      setCkbNodeDataPath({
        dataPath: currentPath!,
        clearCache: type === 'ckb' && dataset?.resync === 'true',
      })
        .then(res => {
          if (isSuccessResponse(res)) {
            setPrevPath(currentPath)
            setIsDialogOpen(false)
          }
        })
        .finally(() => {
          setIsSaveing(false)
          setSavingType(null)
        })
    },
    [currentPath, setIsDialogOpen, setPrevPath]
  )
  return {
    prevPath,
    currentPath,
    onSetting,
    onCancel,
    onConfirm,
    isSaving,
    savingType,
    isDialogOpen,
  }
}

export default useDataPath
