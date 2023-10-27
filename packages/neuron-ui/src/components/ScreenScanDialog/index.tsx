import React, { useEffect, useState, useCallback } from 'react'
import { captureScreen } from 'services/remote'
import { isSuccessResponse } from 'utils'
import { useTranslation } from 'react-i18next'
import AlertDialog from 'widgets/AlertDialog'
import LoadingDialog from 'widgets/LoadingDialog'
import jsQR from 'jsqr'

const ScreenScanDialog = ({ close, onConfirm }: { close: () => void; onConfirm: (result: string[]) => void }) => {
  const [t] = useTranslation()
  const [dialogType, setDialogType] = useState<'' | 'scanning' | 'access-fail'>('')

  const handleScanResult = useCallback(async (sources: Controller.CaptureScreenSource[]) => {
    const uriList = [] as string[]

    const callArr = sources.map(async item => {
      const image = new Image()
      image.src = item.dataUrl
      await new Promise(resolve => {
        image.addEventListener('load', resolve)
      })

      const canvas = document.createElement('canvas')
      canvas.width = image.width
      canvas.height = image.height
      const context = canvas.getContext('2d')
      if (context) {
        context.imageSmoothingEnabled = false
        context.drawImage(image, 0, 0)
        const imageData = context.getImageData(0, 0, image.width, image.height)
        const code = jsQR(imageData.data, image.width, image.height, {
          inversionAttempts: 'dontInvert',
        })
        if (code?.data) {
          uriList.push(code.data)
        }
      }
    })

    await Promise.all(callArr)

    onConfirm(uriList)
  }, [])

  useEffect(() => {
    captureScreen().then(res => {
      if (isSuccessResponse(res)) {
        setDialogType('scanning')
        const result = res.result as Controller.CaptureScreenSource[]
        handleScanResult(result)
      } else {
        setDialogType('access-fail')
      }
    })
  }, [])

  return (
    <>
      <LoadingDialog show={dialogType === 'scanning'} message={t('wallet-connect.scanning')} />

      <AlertDialog
        show={dialogType === 'access-fail'}
        title={t('wallet-connect.screen-fail')}
        message={t('wallet-connect.screen-msg')}
        type="failed"
        onCancel={() => {
          close()
        }}
      />
    </>
  )
}

ScreenScanDialog.displayName = 'ScreenScanDialog'
export default ScreenScanDialog
