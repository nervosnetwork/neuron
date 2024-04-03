import { useCallback, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { getCkbNodeDataPath, invokeShowOpenDialog, startProcessMonitor, stopProcessMonitor } from 'services/remote'
import { isSuccessResponse } from 'utils'

const type = 'ckb'

export const useDataPath = (network?: State.Network) => {
  const [t] = useTranslation()
  const [prevPath, setPrevPath] = useState('')
  const [currentPath, setCurrentPath] = useState('')
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  useEffect(() => {
    getCkbNodeDataPath().then(res => {
      if (isSuccessResponse(res)) {
        setPrevPath(res.result!)
      }
    })
  }, [network?.id])
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
    (dataPath: string) => {
      setPrevPath(dataPath)
      setIsDialogOpen(false)
    },
    [setIsDialogOpen, setPrevPath]
  )
  return {
    prevPath,
    currentPath,
    onSetting,
    onCancel,
    onConfirm,
    isDialogOpen,
  }
}

export default useDataPath
