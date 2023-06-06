/* eslint-disable no-bitwise */
import React, { forwardRef, useEffect, useMemo, useRef } from 'react'
import { clipboard, nativeImage } from 'electron'
import canvg from 'canvg'
import styles from './qrcode.module.scss'

// eslint-disable-next-line @typescript-eslint/no-var-requires
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

const QRCode = forwardRef(
  (
    {
      value,
      size = 110,
      scale = 4,
      level = ErrorCorrectLevel.Q,
      bgColor = '#FFF',
      fgColor = '#000',
      includeMargin = false,
      className = '',
    }: {
      value: string
      size: number
      scale?: number
      level?: ErrorCorrectLevel
      bgColor?: string
      fgColor?: string
      includeMargin?: boolean
      className?: string
    },
    ref?: React.LegacyRef<HTMLDivElement>
  ) => {
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const svgStr = useMemo(() => {
      const qrcode = new QRCodeImpl(-1, level)
      qrcode.addData(convertStr(value))
      qrcode.make()

      const cells = qrcode.modules || []
      const margin = includeMargin ? 1 : 0
      const fgPath = generatePath(cells, margin)
      const numCells = cells.length + margin * 2
      return `<svg shapeRendering="crispEdges"
      width="${scale * size}"
      height="${scale * size}"
      viewBox="0 0 ${numCells} ${numCells}"
    >
      <path fill="${bgColor}" d="M0, 0 h${numCells} v${numCells} H0z" />
      <path fill="${fgColor}" d="${fgPath}" />
    </svg>`
    }, [value, includeMargin, size, scale, bgColor, fgColor, level])

    useEffect(() => {
      if (canvasRef.current !== null) {
        canvg(canvasRef.current, svgStr, {
          enableRedraw: false,
          ignoreMouse: true,
          renderCallback: () => {
            if (canvasRef.current) {
              canvasRef.current.setAttribute(`style`, `width:${size}px;height:${size}px`)
            }
          },
        })
      }
    }, [svgStr, size])

    return (
      <div className={`${styles.qrcode} ${className}`} ref={ref}>
        <div className={styles.pic}>
          <canvas ref={canvasRef} width={size} height={size} />
        </div>
      </div>
    )
  }
)

QRCode.displayName = 'QRCode'

export default QRCode

export const downloadCanvas = (canvas: HTMLCanvasElement) => {
  const dataURL = canvas.toDataURL('image/png')
  const downloadLink = document.createElement('a')
  downloadLink.download = 'ckb-address'
  downloadLink.href = dataURL
  downloadLink.click()
}

export const copyCanvas = (canvas: HTMLCanvasElement) => {
  const dataURL = canvas.toDataURL('image/png')
  const img = nativeImage.createFromDataURL(dataURL)
  clipboard.writeImage(img)
}
