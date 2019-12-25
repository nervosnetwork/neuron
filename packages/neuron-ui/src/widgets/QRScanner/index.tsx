import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { TextField, PrimaryButton, DefaultButton, Dialog, DialogFooter, Stack } from 'office-ui-fabric-react'
import { ReactComponent as Scan } from 'widgets/Icons/Scan.svg'
import jsQR from 'jsqr'

import { showErrorMessage } from 'services/remote'
import { drawPolygon } from 'utils/canvasActions'
import { verifyAddress } from 'utils/validators'
import { ErrorCode } from 'utils/const'
import localStyles from './qrScanner.module.scss'

interface QRScannerProps {
  title: string
  label: string
  prompt?: string
  onConfirm: Function
  styles?: { [index: string]: any }
}

const stopScan = (v: any) => {
  if (v && v.srcObject) {
    const track = v.srcObject.getTracks()[0]
    if (track) {
      track.stop()
    }
  }
}

const QRScanner = ({ title, label, onConfirm, styles }: QRScannerProps) => {
  const [open, setOpen] = useState(false)
  const [data, setData] = useState('')
  const [t] = useTranslation()
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const video = useMemo(() => document.createElement('video'), [])

  const onOpen = useCallback(() => {
    setData('')
    setOpen(true)
  }, [setOpen])

  const onDismiss = useCallback(() => {
    setOpen(false)
  }, [setOpen])

  const onSubmit = useCallback(() => {
    onConfirm(data)
    onDismiss()
  }, [data, onConfirm, onDismiss])

  const scan = useCallback(() => {
    navigator.mediaDevices
      .getUserMedia({
        video: {
          facingMode: 'environment',
        },
        audio: false,
      })
      .then((stream: MediaStream) => {
        video.srcObject = stream
        if (!('video' in window)) {
          Object.defineProperty(window, 'video', {
            value: video,
          })
        }
        video.play()
        function tick() {
          if (video.readyState === video.HAVE_ENOUGH_DATA && canvasRef.current) {
            canvasRef.current.width = video.videoWidth
            canvasRef.current.height = video.videoHeight
            const canvas = canvasRef.current.getContext('2d')
            if (canvas) {
              canvas.drawImage(video, 0, 0, canvasRef.current.width, canvasRef.current.height)
              const imageData = canvas.getImageData(0, 0, canvasRef.current.width, canvasRef.current.height)
              const code = jsQR(imageData.data, imageData.width, imageData.height, {
                inversionAttempts: 'dontInvert',
              })
              if (code) {
                const color = '#ff385b'
                const { topLeftCorner, topRightCorner, bottomRightCorner, bottomLeftCorner } = code.location
                drawPolygon(canvas, [topLeftCorner, topRightCorner, bottomRightCorner, bottomLeftCorner], {
                  color,
                })
                if (verifyAddress(code.data)) {
                  onDismiss()
                  onConfirm(code.data)
                } else {
                  setData(code.data)
                }
              }
            }
          }
          requestAnimationFrame(tick)
        }
        requestAnimationFrame(tick)
      })
      .catch((err: Error) => {
        showErrorMessage(t(`messages.codes.${ErrorCode.CameraUnavailable}`), err.message)
        setOpen(false)
      })
  }, [video, t, onConfirm, onDismiss])

  useEffect(() => {
    if (open) {
      scan()
    } else {
      stopScan(video)
    }
    return () => stopScan(video)
  }, [video, open, scan])

  return (
    <>
      <button style={styles && styles.trigger} onClick={onOpen} type="button" className={localStyles.scanBtn}>
        <Scan />
      </button>
      <Dialog hidden={!open} onDismiss={onDismiss} maxWidth="900px" minWidth="500xp">
        <h1>{title}</h1>
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <canvas ref={canvasRef} />
        </div>
        <DialogFooter
          styles={{
            actionsRight: {
              width: '100%',
            },
          }}
        >
          <TextField readOnly value={data} label={label} underlined />
          <Stack horizontal horizontalAlign="end" tokens={{ childrenGap: 10 }}>
            <DefaultButton onClick={onDismiss}>{t('common.cancel')}</DefaultButton>
            <PrimaryButton onClick={onSubmit}>{t('common.confirm')}</PrimaryButton>
          </Stack>
        </DialogFooter>
      </Dialog>
    </>
  )
}

QRScanner.displayName = 'QRScanner'

export default QRScanner
