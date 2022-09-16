import React from 'react'
import styles from './index.module.scss'

const symbolReg = /^([A-Z]|[0-9])+\.([a-z]|[0-9])+(\|([a-z]|[0-9])+\.([a-z]|[0-9])+)*$/
export function isTonkenInfoStandardUAN(name: string, symbol: string) {
  const isSymbolName = symbolReg.test(symbol)
  if (!isSymbolName) {
    return false
  }
  const assetSymbol = symbol.slice(0, symbol.indexOf('.'))
  const hasRouter = symbol.lastIndexOf('|') !== -1
  const lastUANRouter = hasRouter ? symbol.slice(symbol.lastIndexOf('|') + 1) : ''
  if (lastUANRouter) {
    const [bridgeName, chainName] = lastUANRouter.split('.')
    const bridgeFullReg = bridgeName
      .split('')
      .reduce((pre, cur) => `${pre}(${cur}|${cur.toUpperCase()})([a-z]|[0-9]|[ ])*`, '')
    const reg = `^${assetSymbol} \\(via ${bridgeFullReg} from ${chainName.toUpperCase()}\\)$`
    return new RegExp(reg).test(name)
  }
  return assetSymbol === name
}

export function getDisplayName(name: string, symbol: string) {
  if (isTonkenInfoStandardUAN(name, symbol)) {
    return name.split('(')[0]
  }
  return name
}

export function getDisplaySymbol(name: string, symbol: string) {
  if (isTonkenInfoStandardUAN(name, symbol)) {
    return symbol.split(/\.|\|/)[0]
  }
  return symbol
}

export const UANTokenName = ({ name, symbol, className }: { name: string; symbol: string; className?: string }) => {
  const displayName = getDisplayName(name, symbol)
  return (
    <span className={`${className || ''} ${styles.tokenName}`} data-tooltip={name}>
      <span>{displayName}</span>
    </span>
  )
}

UANTokenName.displayName = 'UANTokenName'

export const UANTonkenSymbol = ({ name, symbol, className }: { name: string; symbol: string; className?: string }) => {
  const displaySymbol = getDisplaySymbol(name, symbol)
  return (
    <span className={`${className || ''} ${styles.tokenSymbol}`} data-tooltip={symbol}>
      <span>{displaySymbol}</span>
    </span>
  )
}

UANTonkenSymbol.displayName = 'UANTonkenSymbol'
