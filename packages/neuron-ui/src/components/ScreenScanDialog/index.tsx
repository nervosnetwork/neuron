import React, { useEffect, useRef, useMemo, useState } from 'react'
import { captureScreen } from 'services/remote'
import Button from 'widgets/Button'
import { isSuccessResponse } from 'utils'
import { useTranslation } from 'react-i18next'
import Dialog from 'widgets/Dialog'
import jsQR from 'jsqr'

import styles from './screenScanDialog.module.scss'

interface Point {
  x: number
  y: number
}

const ScreenScanDialog = ({ close, onConfirm }: { close: () => void; onConfirm: (result: string) => void }) => {
  const [t] = useTranslation()
  const imgRef = useRef<HTMLImageElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const canvas2dRef = useRef<CanvasRenderingContext2D>()
  const [sources, setSources] = useState<Controller.CaptureScreenSource[]>([])
  const [selectId, setSelectId] = useState('')
  const [uri, setUri] = useState('')

  const drawLine = (begin: Point, end: Point) => {
    if (!canvas2dRef.current) return
    canvas2dRef.current.beginPath()
    canvas2dRef.current.moveTo(begin.x, begin.y)
    canvas2dRef.current.lineTo(end.x, end.y)
    canvas2dRef.current.lineWidth = 4
    canvas2dRef.current.strokeStyle = '#00c891'
    canvas2dRef.current.stroke()
  }

  const source = useMemo(() => sources.find(item => item.id === selectId), [selectId, sources])

  useEffect(() => {
    if (!source) return

    if (imgRef.current) {
      const { width, height } = imgRef.current
      canvasRef.current?.setAttribute('height', `${height}px`)
      canvasRef.current?.setAttribute('width', `${width}px`)
      const canvas2d = canvasRef.current?.getContext('2d')
      if (canvas2d) {
        canvas2d.drawImage(imgRef.current, 0, 0, width, height)

        canvas2dRef.current = canvas2d
        const imageData = canvas2d.getImageData(0, 0, width, height)
        const code = jsQR(imageData.data, imageData.width, imageData.height, {
          inversionAttempts: 'dontInvert',
        })

        if (code?.data) {
          drawLine(code.location.topLeftCorner, code.location.topRightCorner)
          drawLine(code.location.topRightCorner, code.location.bottomRightCorner)
          drawLine(code.location.bottomRightCorner, code.location.bottomLeftCorner)
          drawLine(code.location.bottomLeftCorner, code.location.topLeftCorner)
          setUri(code.data)
        }
      }
    }
  }, [source])

  useEffect(() => {
    captureScreen().then(res => {
      if (isSuccessResponse(res)) {
        const result = res.result as Controller.CaptureScreenSource[]
        setSources(result)
        if (result.length) {
          setSelectId(result[0].id)
        }
      }
    })
  }, [])

  const handleSelect = (e: React.SyntheticEvent<HTMLButtonElement>) => {
    const { idx = '' } = e.currentTarget.dataset
    if (idx !== selectId) {
      setSelectId(idx)
      setUri('')
    }
  }

  const handleConfirm = () => {
    onConfirm(uri)
  }

  return (
    <Dialog
      show
      title={t('wallet-connect.scan-with-camera')}
      onCancel={close}
      disabled={!uri}
      onConfirm={handleConfirm}
      className={styles.scanDialog}
    >
      <div className={styles.container}>
        <div className={styles.chooseBox}>
          {sources.map(({ dataUrl, id }) => (
            <Button
              key={id}
              className={styles.chooseItem}
              data-idx={id}
              data-active={selectId === id}
              onClick={handleSelect}
            >
              <img src={dataUrl} alt="" />
            </Button>
          ))}
        </div>
        <div className={styles.scanBox}>
          <canvas ref={canvasRef} />
          {source ? <img ref={imgRef} src={source?.dataUrl} alt="" /> : null}
        </div>
      </div>
    </Dialog>
  )
}

ScreenScanDialog.displayName = 'ScreenScanDialog'
export default ScreenScanDialog

// {loading ? (
//             <div>{t('wallet-connect.waiting-camera')}</div>
//           )
