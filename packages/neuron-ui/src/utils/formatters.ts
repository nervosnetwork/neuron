/* global BigInt */

import { CapacityUnit } from './const'

const base = 10e9
const numberParser = (value: string, exchange: string) => {
  const res = (BigInt(value) * BigInt(+exchange * base)).toString()
  const integer = res.slice(0, res.length - 10)
  const decimal = res.slice(res.length - 10).replace(/0+$/, '')
  return [integer, decimal]
}

const numberFormatter = new Intl.NumberFormat('en-US')

export const queryFormatter = (params: { [index: string]: any }) => {
  const newQuery = new URLSearchParams()
  Object.entries(params).forEach(([key, value]) => {
    newQuery.set(key, `${value}`)
  })
  return newQuery
}

export type currencyCode = 'CKB' | 'CNY' | 'USD'
/**
 *
 *
 * @function currencyFormatter
 * @param {string} value
 * @param {('CKB' | 'CNY' | 'USD')} [type='CKB']
 * @param {string} [exchange='0.000000001']
 * @description display balance in the format of xxx,xxx.xxxxxxxx CKB (yyy,yyy.yy CNY)
 * @returns
 */
export const currencyFormatter = (
  shannons: string,
  unit: currencyCode = 'CKB',
  exchange: string = '0.000000001'
): string => {
  const [integer, decimal] = numberParser(shannons, exchange)
  const dot = '.'
  const delimiter = ','
  switch (unit) {
    case 'CKB':
    case 'CNY': {
      break
    }
    default: {
      break
    }
  }
  return `${integer.replace(/\B(?=(\d{3})+(?!\d))/g, delimiter)}${dot}${decimal} ${unit}`
}

export const CKBToShannonFormatter = (amount: string, uint: CapacityUnit) => {
  const [integer = '0', decimal = ''] = amount.split('.')
  const decimalLength = 10 ** decimal.length
  const num = integer + decimal

  switch (uint) {
    case CapacityUnit.CKB: {
      return (BigInt(num) * BigInt(1e8 / decimalLength)).toString()
    }
    case CapacityUnit.CKKB: {
      return (BigInt(num) * BigInt(1e11 / decimalLength)).toString()
    }
    case CapacityUnit.CKGB: {
      return (BigInt(num) * BigInt(1e17 / decimalLength)).toString()
    }
    default: {
      return amount
    }
  }
}

export const shannonToCKBFormatter = (shannon: string) => {
  let ckbStr = [...shannon.padStart(8, '0')]
    .map((char, idx) => {
      if (idx === Math.max(shannon.length - 8, 0)) {
        return `.${char}`
      }
      return char
    })
    .join('')
  if (ckbStr.startsWith('.')) {
    ckbStr = `0${ckbStr}`
  }
  return ckbStr.replace(/\.?0+$/, '')
}

export const localNumberFormatter = (num: string | number = 0) => {
  return numberFormatter.format(+num)
}

export default {
  queryFormatter,
  currencyFormatter,
  CKBToShannonFormatter,
  shannonToCKBFormatter,
  localNumberFormatter,
}
