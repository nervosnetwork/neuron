/* eslint-disable no-redeclare */
/* global BigInt */

import { CapacityUnit } from './const'

const base = 10e9
const numberParser = (value: string, exchange: string) => {
  if (Number.isNaN(+value)) {
    throw new TypeError('Value is not a valid number')
  }
  if (Number.isNaN(+exchange)) {
    throw new TypeError('Exchange is not a valid number')
  }
  const res = (BigInt(value) * BigInt(+exchange * base)).toString()
  const integer = res.slice(0, res.length - 10)
  const decimal = res.slice(res.length - 10).replace(/0+$/, '')
  return [integer, decimal]
}

const numberFormatter = new Intl.NumberFormat('en-US')
const timeFormatter = new Intl.DateTimeFormat('zh-CN', {
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
  hour12: false,
})

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
  shannons: string = '0',
  unit: currencyCode = 'CKB',
  exchange: string = '0.000000001'
): string => {
  if (Number.isNaN(+shannons)) {
    throw new TypeError(`Shannons is not a valid number`)
  }

  if (Number.isNaN(+exchange)) {
    throw new TypeError(`Exchange is not a valid number`)
  }

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

export const CKBToShannonFormatter = (amount: string = '0', unit: CapacityUnit) => {
  if (Number.isNaN(+amount)) {
    console.warn(`Amount is not a valid number`)
    return `${amount} ${unit}`
  }
  const [integer = '0', decimal = ''] = amount.split('.')
  const decimalLength = 10 ** decimal.length
  const num = integer + decimal

  switch (unit) {
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

export const shannonToCKBFormatter = (shannon: string = '0', showPositiveSign?: boolean) => {
  if (Number.isNaN(+shannon)) {
    console.warn(`Shannon is not a valid number`)
    return shannon
  }
  let sign = ''
  if (shannon.startsWith('-')) {
    sign = '-'
  } else if (showPositiveSign) {
    sign = '+'
  }
  const unsignedShannon = shannon.replace(/^-?0*/, '')
  let unsignedCKB = ''
  if (unsignedShannon.length <= 8) {
    unsignedCKB = `0.${unsignedShannon.padStart(8, '0')}`.replace(/\.?0+$/, '')
  } else {
    const decimal = `.${unsignedShannon.slice(-8)}`.replace(/\.?0+$/, '')
    const int = unsignedShannon.slice(0, -8).replace(/\^0+/, '')
    unsignedCKB = `${(
      int
        .split('')
        .reverse()
        .join('')
        .match(/\d{1,3}/g) || ['0']
    )
      .join(',')
      .split('')
      .reverse()
      .join('')}${decimal}`
  }
  return +unsignedCKB === 0 ? '0' : `${sign}${unsignedCKB}`
}

export const localNumberFormatter = (num: string | number = 0) => {
  if (Number.isNaN(+num)) {
    console.warn(`Nuumber is not a valid number`)
    return num
  }
  return numberFormatter.format(+num)
}

export const uniformTimeFormatter = (time: string | number | Date) => {
  return timeFormatter.format(+time).replace(/\//g, '-')
}

export const priceToFee = (price: string, cycles: string) => {
  if (Number.isNaN(+price)) {
    console.warn(`Price is not a valid number`)
    return `0`
  }
  return (BigInt(price) * BigInt(cycles)).toString()
}

export const addressesToBalance = (addresses: State.Address[] = []) => {
  return addresses
    .reduce((total, addr) => {
      if (Number.isNaN(+addr.balance)) {
        return total
      }
      return total + BigInt(addr.balance || 0)
    }, BigInt(0))
    .toString()
}

export const outputsToTotalAmount = (outputs: { amount: string; unit: CapacityUnit }[]) => {
  const totalCapacity = outputs.reduce((total, cur) => {
    if (Number.isNaN(+cur.amount)) {
      return total
    }
    return total + BigInt(CKBToShannonFormatter(cur.amount, cur.unit))
  }, BigInt(0))
  return totalCapacity.toString()
}

export const failureResToNotification = (res: any): State.Message => {
  return {
    type: 'alert',
    timestamp: +new Date(),
    code: res.status,
    content: typeof res.message !== 'string' ? res.message.content : res.message,
    meta: typeof res.message !== 'string' ? res.message.meta : undefined,
  }
}

export default {
  queryFormatter,
  currencyFormatter,
  CKBToShannonFormatter,
  shannonToCKBFormatter,
  localNumberFormatter,
  uniformTimeFormatter,
  priceToFee,
  addressesToBalance,
  outputsToTotalAmount,
  failureResToNotification,
}
