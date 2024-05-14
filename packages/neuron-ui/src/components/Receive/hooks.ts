import { addressToAddress } from 'utils'
import { useCallback, useMemo, useRef, useState } from 'react'
import { copyCanvas, downloadCanvas } from 'widgets/QRCode'

export const useCopyAndDownloadQrCode = () => {
  const ref = useRef<HTMLDivElement | null>(null)
  const onDownloadQrCode = useCallback(() => {
    const canvasElement = ref.current?.querySelector('canvas')
    if (canvasElement) {
      downloadCanvas(canvasElement)
    }
  }, [ref])
  const [showCopySuccess, setShowCopySuccess] = useState(false)
  const onCopyQrCode = useCallback(() => {
    setShowCopySuccess(false)
    const canvasElement = ref.current?.querySelector('canvas')
    if (canvasElement) {
      copyCanvas(canvasElement)
      setTimeout(() => {
        setShowCopySuccess(true)
      }, 1)
    }
  }, [ref])
  return {
    ref,
    onDownloadQrCode,
    onCopyQrCode,
    showCopySuccess,
  }
}

export const useSwitchAddress = (address: string) => {
  const [isInShortFormat, setIsInShortFormat] = useState(false)
  const showAddress = useMemo(
    () => (isInShortFormat ? addressToAddress(address, { deprecated: true }) : address),
    [address, isInShortFormat]
  )
  return {
    address: showAddress,
    isInShortFormat,
    setIsInShortFormat,
  }
}
