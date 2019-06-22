/* global BigInt */

import { CapacityUnit } from './const'

const base = 10e9
const numberParser = (value: string, exchange: string) => {
  const res = (BigInt(value) * BigInt(+exchange * base)).toString()
  const integer = res.slice(0, res.length - 10)
  const decimal = res.slice(res.length - 10).replace(/0+$/, '')
  return [integer, decimal]
}

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
  switch (uint) {
    case CapacityUnit.CKB: {
      return (BigInt(amount) * BigInt(1e8)).toString()
    }
    case CapacityUnit.CKKB: {
      return (BigInt(amount) * BigInt(1e11)).toString()
    }
    case CapacityUnit.CKGB: {
      return (BigInt(amount) * BigInt(1e17)).toString()
    }
    default: {
      return amount
    }
  }
}

export default {
  queryFormatter,
  currencyFormatter,
  CKBToShannonFormatter,
}
