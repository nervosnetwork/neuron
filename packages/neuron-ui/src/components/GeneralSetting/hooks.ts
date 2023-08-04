import { Dispatch, SetStateAction, useCallback, useMemo, useState } from 'react'
import { cancelCheckUpdates, cancelDownloadUpdate, checkForUpdates } from 'services/remote'

export const useUpdateDownloadStatus = ({
  setShowCheckDialog,
  downloadProgress,
}: {
  setShowCheckDialog: Dispatch<SetStateAction<boolean>>
  downloadProgress: number
}) => {
  const [showUpdateDownloadStatus, setShowUpdateDownloadStatus] = useState(false)
  const openShowUpdateDownloadStatus = useCallback(() => {
    setShowUpdateDownloadStatus(true)
  }, [])
  const onCheckUpdate = useCallback(() => {
    setShowCheckDialog(true)
    checkForUpdates()
  }, [setShowCheckDialog])
  const hasStartDownload = useMemo(() => downloadProgress >= 0, [downloadProgress])
  return {
    showUpdateDownloadStatus,
    openShowUpdateDownloadStatus,
    onCheckUpdate,
    onCancel: useCallback(() => {
      if (hasStartDownload) {
        cancelDownloadUpdate()
      }
      setShowUpdateDownloadStatus(false)
    }, [hasStartDownload]),
  }
}

export const useCheckUpdate = () => {
  const [showCheckDialog, setShowCheckDialog] = useState(false)
  const onCancelCheckUpdates = useCallback(() => {
    if (showCheckDialog) {
      cancelCheckUpdates()
    }
    setShowCheckDialog(false)
  }, [showCheckDialog])
  return {
    showCheckDialog,
    setShowCheckDialog,
    onCancelCheckUpdates,
  }
}
