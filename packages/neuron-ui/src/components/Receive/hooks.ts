import { AddressPrefix, addressToScript, bech32Address } from '@nervosnetwork/ckb-sdk-utils'
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

const toShortAddr = (addr: string) => {
  try {
    const script = addressToScript(addr)
    const isMainnet = addr.startsWith('ckb')
    return bech32Address(script.args, { prefix: isMainnet ? AddressPrefix.Mainnet : AddressPrefix.Testnet })
  } catch {
    return ''
  }
}

export const useSwitchAddress = (address: string) => {
  const [isInShortFormat, setIsInShortFormat] = useState(false)
  const showAddress = useMemo(() => (isInShortFormat ? toShortAddr(address) : address), [address, isInShortFormat])
  return {
    address: showAddress,
    isInShortFormat,
    setIsInShortFormat,
  }
}
