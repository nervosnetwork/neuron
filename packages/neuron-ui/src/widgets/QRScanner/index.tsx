import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react'
import { Card, Button, InputGroup, FormControl } from 'react-bootstrap'
import { Scan as ScanIcon } from 'grommet-icons'
import { useTranslation } from 'react-i18next'
import jsQR from 'jsqr'

import Dialog from '../Dialog'
import { drawPolygon } from '../../utils/canvasActions'

interface QRScannerProps {
  title: string
  label: string
  prompt?: string
  onConfirm: Function
  styles?: { [index: string]: any }
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
        Object.defineProperty(window, 'video', {
          value: video,
        })
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
  }, [])

  const stopScan = (v: any) => {
    if (v && v.srcObject) {
      const track = v.srcObject.getTracks()[0]
      if (track) {
        track.stop()
      }
    }
  }

  useEffect(() => {
    if (open) {
      scan()
    } else {
      stopScan(video)
    }
    return () => stopScan(video)
  }, [open])

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
        onKeyPress={() => setOpen(true)}
        type="button"
      >
        <ScanIcon />
      </button>
      <Dialog
        open={open}
        onClick={() => {
          setOpen(false)
        }}
      >
        <Card
          onClick={(e: React.SyntheticEvent<HTMLDivElement>) => {
            e.preventDefault()
            e.stopPropagation()
          }}
        >
          <Card.Header>
            <Card.Text>{title}</Card.Text>
          </Card.Header>
          <Card.Body>
            <canvas ref={canvasRef} />
          </Card.Body>
          <Card.Footer>
            <InputGroup>
              <InputGroup.Prepend>
                <InputGroup.Text>{label}</InputGroup.Text>
              </InputGroup.Prepend>
              <FormControl readOnly value={data} />
            </InputGroup>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
              }}
            >
              <Button
                onClick={() => {
                  onConfirm(data)
                  setOpen(false)
                }}
              >
                {t('common.confirm')}
              </Button>
              <Button variant="light" onClick={() => setOpen(false)}>
                {t('common.cancel')}
              </Button>
            </div>
          </Card.Footer>
        </Card>
      </Dialog>
    </>
  )
}

QRScanner.displayName = 'QRScanner'
export default QRScanner
