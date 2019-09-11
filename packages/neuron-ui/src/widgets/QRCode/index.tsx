/* eslint-disable no-bitwise */
import React, { useEffect, useRef, useCallback } from 'react'
import canvg from 'canvg'
import { Stack, DefaultButton } from 'office-ui-fabric-react'
import { useTranslation } from 'react-i18next'
import { addPopup } from 'states/stateProvider/actionCreators'
import { StateDispatch } from 'states/stateProvider/reducer'

const QRCodeImpl = require('qr.js/lib/QRCode')

enum ErrorCorrectLevel {
  M = 0,
  L = 1,
  H = 2,
  Q = 3,
}

const convertStr = (str: string): string => {
  let out = ''
  for (let i = 0; i < str.length; i++) {
    let charcode = str.charCodeAt(i)
    if (charcode < 0x0080) {
      out += String.fromCharCode(charcode)
    } else if (charcode < 0x0800) {
      out += String.fromCharCode(0x0c | (charcode >> 6))
      out += String.fromCharCode(0x80 | (charcode & 0x3f))
    } else if (charcode < 0xd800 || charcode >= 0xe000) {
      out += String.fromCharCode(0xe0 | (charcode >> 12))
      out += String.fromCharCode(0x80 | ((charcode >> 6) & 0x3f))
      out += String.fromCharCode(0x80 | (charcode & 0x3f))
    } else {
      i++
      charcode = 0x10000 + (((charcode & 0x3ff) << 10) | (str.charCodeAt(i) & 0x3ff))
      out += String.fromCharCode(0xf0 | (charcode >> 18))
      out += String.fromCharCode(0x80 | ((charcode >> 12) & 0x3f))
      out += String.fromCharCode(0x80 | ((charcode >> 6) & 0x3f))
      out += String.fromCharCode(0x80 | (charcode & 0x3f))
    }
  }
  return out
}

const generatePath = (cells: boolean[][], margin: number = 0): string => {
  const ops: string[] = []
  cells.forEach((row, y) => {
    let start: number | null = null
    row.forEach((cell, x) => {
      if (!cell && start !== null) {
        ops.push(`M${start + margin} ${y + margin}h${x - start}v1H${start + margin}z`)
        start = null
        return
      }

      if (x === row.length - 1) {
        if (!cell) {
          return
        }
        if (start === null) {
          ops.push(`M${x + margin},${y + margin} h1v1H${x + margin}z`)
        } else {
          ops.push(`M${start + margin},${y + margin} h${x + 1 - start}v1H${start + margin}z`)
        }
        return
      }

      if (cell && start === null) {
        start = x
      }
    })
  })

  return ops.join('')
}

const QRCode = ({
  value,
  size = 128,
  scale = 4,
  level = ErrorCorrectLevel.Q,
  bgColor = '#FFF',
  fgColor = '#000',
  onQRCodeClick,
  includeMargin = false,
  exportable = false,
  dispatch,
}: {
  value: string
  size: number
  scale?: number
  level?: ErrorCorrectLevel
  bgColor?: string
  fgColor?: string
  onQRCodeClick?: React.MouseEventHandler
  includeMargin?: boolean
  exportable?: boolean
  dispatch: StateDispatch
}) => {
  const [t] = useTranslation()
  const qrcode = new QRCodeImpl(-1, level)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  qrcode.addData(convertStr(value))
  qrcode.make()

  const cells = qrcode.modules || []
  const margin = includeMargin ? 1 : 0
  const fgPath = generatePath(cells, margin)
  const numCells = cells.length + margin * 2

  const svgStr = `<svg shapeRendering="crispEdges"
    width="${scale * size}"
    height="${scale * size}"
    viewBox="0 0 ${numCells} ${numCells}"
  >
    <path fill="${bgColor}" d="M0, 0 h${numCells} v${numCells} H0z" />
    <path fill="${fgColor}" d="${fgPath}" />
  </svg>`

  const onDownload = useCallback(() => {
    if (canvasRef.current === null) {
      return
    }
    const dataURL = canvasRef.current.toDataURL('image/png')
    const downloadLink = document.createElement('a')
    downloadLink.download = 'Receive'
    downloadLink.href = dataURL
    window.document.body.appendChild(downloadLink)
    downloadLink.click()
    window.document.body.removeChild(downloadLink)
  }, [])

  const onCopy = useCallback(() => {
    if (canvasRef.current === null) {
      return
    }
    const dataURL = canvasRef.current.toDataURL('image/png')
    const img = window.nativeImage.createFromDataURL(dataURL)
    window.clipboard.writeImage(img)
    addPopup('qrcode-copied')(dispatch)
  }, [dispatch])

  useEffect(() => {
    if (canvasRef.current !== null) {
      canvg(canvasRef.current, svgStr, {
        enableRedraw: false,
        ignoreMouse: true,
        renderCallback: () => {
          if (canvasRef.current) {
            canvasRef.current.setAttribute(`style`, `width:${size}p;height:${size}px`)
          }
        },
      })
    }
  }, [svgStr, size])

  return (
    <Stack tokens={{ childrenGap: 15 }} horizontalAlign="center" verticalAlign="center">
      <Stack.Item>
        <canvas ref={canvasRef} width={size} height={size} onClick={onQRCodeClick} />
      </Stack.Item>
      {exportable ? (
        <Stack horizontal horizontalAlign="space-between">
          <DefaultButton onClick={onCopy}>{t('qrcode.copy')}</DefaultButton>
          <DefaultButton onClick={onDownload}>{t('qrcode.save')}</DefaultButton>
        </Stack>
      ) : null}
    </Stack>
  )
}

QRCode.display = 'QRCode'

export default QRCode
