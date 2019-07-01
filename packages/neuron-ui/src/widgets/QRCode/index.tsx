/* eslint-disable no-bitwise */
import React from 'react'

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
  level = ErrorCorrectLevel.Q,
  bgColor = '#FFF',
  fgColor = '#000',
  includeMargin = false,
  ...otherProps
}: {
  value: string
  size: number
  level?: ErrorCorrectLevel
  bgColor?: string
  fgColor?: string
  includeMargin?: boolean
}) => {
  const qrcode = new QRCodeImpl(-1, level)
  qrcode.addData(convertStr(value))
  qrcode.make()

  const cells = qrcode.modules
  if (cells === null) {
    return null
  }
  const margin = includeMargin ? 4 : 0
  const fgPath = generatePath(cells, margin)
  const numCells = cells.length + margin * 2
  return (
    <svg shapeRendering="crispEdges" height={size} width={size} viewBox={`0 0 ${numCells} ${numCells}`} {...otherProps}>
      <path fill={bgColor} d={`M0,0 h${numCells}v${numCells}H0z`} />
      <path fill={fgColor} d={fgPath} />
    </svg>
  )
}

export default QRCode
