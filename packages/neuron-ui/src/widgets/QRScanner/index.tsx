import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { TextField, PrimaryButton, DefaultButton, Dialog, DialogFooter } from 'office-ui-fabric-react'
import { Scan as ScanIcon } from 'grommet-icons'
import jsQR from 'jsqr'

import { drawPolygon } from 'utils/canvasActions'
// import Dialog from '../Dialog'

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
                setData(code.data)
              }
            }
          }
          requestAnimationFrame(tick)
        }
        requestAnimationFrame(tick)
      })
  }, [video])

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
      <button
        style={
          (styles && styles.trigger) || {
            lineHeight: '1',
            background: 'none',
            border: 'none',
            outline: 'none',
          }
        }
        onClick={() => {
          setOpen(true)
        }}
        onKeyPress={() => {}}
        type="button"
      >
        <ScanIcon />
      </button>
      <Dialog
        hidden={!open}
        onDismiss={() => {
          setOpen(false)
        }}
        maxWidth="900px"
        minWidth="500xp"
      >
        <h1>{title}</h1>
        <div>
          <canvas ref={canvasRef} />
        </div>
        <DialogFooter>
          <TextField readOnly value={data} label={label} underlined />
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
            }}
          >
            <PrimaryButton
              onClick={() => {
                onConfirm(data)
                setOpen(false)
              }}
            >
              {t('common.confirm')}
            </PrimaryButton>
            <DefaultButton onClick={() => setOpen(false)}>{t('common.cancel')}</DefaultButton>
          </div>
        </DialogFooter>
      </Dialog>
    </>
  )
}

QRScanner.displayName = 'QRScanner'

export default QRScanner
