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
  // use hourCycle h23 instead of hour12 false for chrome 80 and electron 8
  // hour12: false,
  hourCycle: 'h23',
} as Intl.DateTimeFormatOptions)

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

export const CKBToShannonFormatter = (amount: string = '0', unit: CapacityUnit = CapacityUnit.CKB) => {
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

export const shannonToCKBFormatter = (shannon: string = '0', showPositiveSign?: boolean, delimiter: string = ',') => {
  if (Number.isNaN(+shannon)) {
    console.warn(`Shannon is not a valid number`)
    return shannon
  }
  if (shannon === null) {
    return '0'
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
      .join(delimiter)
      .split('')
      .reverse()
      .join('')}${decimal}`
  }
  return +unsignedCKB === 0 ? '0' : `${sign}${unsignedCKB}`
}

export const localNumberFormatter = (num: string | number | bigint = 0) => {
  if (num === '' || num === undefined || num === null) {
    return ''
  }
  if (typeof num === 'bigint') {
    return numberFormatter.format(num as any)
  }
  if (Number.isNaN(+num)) {
    console.warn(`Number is not a valid number`)
    return num.toString()
  }
  const parts = num.toString().split('.')
  const n: any = BigInt(parts[0])
  parts[0] = numberFormatter.format(n)
  return parts.join('.')
}

export const uniformTimeFormatter = (time: string | number | Date) => {
  return timeFormatter.format(+time).replace(/\//g, '-')
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

export const outputsToTotalAmount = (outputs: Readonly<State.Output[]>) => {
  const totalCapacity = outputs.reduce((total, cur) => {
    if (Number.isNaN(+(cur.amount || ''))) {
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

// TODO: deprecated after merging the dev branch which has removed difficulty.
export const difficultyFormatter = (value: bigint) => {
  const units = new Map([
    ['YH', 1e24],
    ['ZH', 1e21],
    ['EH', 1e18],
    ['PH', 1e15],
    ['TH', 1e12],
    ['GH', 1e9],
    ['MH', 1e6],
    ['KH', 1e3],
  ])

  /* eslint-disable no-restricted-syntax */
  for (const [unit, range] of units) {
    if (value >= range * 1e3) {
      const integer = value / BigInt(range)
      const decimal = (Number(value) / range).toFixed(2).split('.')[1]
      return `${localNumberFormatter(integer)}.${decimal} ${unit}`
    }
  }
  /* eslint-enable no-restricted-syntax */

  return `${localNumberFormatter(value)} H`
}

export const sudtAmountToValue = (amount: string = '0', decimal: string = '0') => {
  try {
    if (Number.isNaN(+amount)) {
      console.warn(`Amount is not a valid number`)
      return `0`
    }
    const [integer = '0', decimalFraction = ''] = amount.split('.')
    const decimalLength = 10 ** decimalFraction.length
    const num = integer + decimalFraction
    return (BigInt(num) * BigInt(10 ** +decimal / decimalLength)).toString()
  } catch {
    return undefined
  }
}

export const sudtValueToAmount = (value: string = '0', decimal: string = '0', showPositiveSign = false) => {
  const dec = +decimal
  if (Number.isNaN(+value)) {
    console.warn(`sUDT value is not a valid number`)
    return '0'
  }
  if (value === null) {
    return '0'
  }
  let sign = ''
  if (value.startsWith('-')) {
    sign = '-'
  } else if (showPositiveSign) {
    sign = '+'
  }
  const unsignedValue = value.replace(/^-?0*/, '')
  if (dec === 0) {
    return +unsignedValue ? `${sign}${unsignedValue}` : '0'
  }
  let unsignedCKB = ''
  if (unsignedValue.length <= dec) {
    unsignedCKB = `0.${unsignedValue.padStart(dec, '0')}`.replace(/\.?0+$/, '')
  } else {
    const decimalFraction = `.${unsignedValue.slice(-dec)}`.replace(/\.?0+$/, '')
    const int = unsignedValue.slice(0, -dec).replace(/\^0+/, '')
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
      .join('')}${decimalFraction}`
  }
  return +unsignedCKB === 0 ? '0' : `${sign}${unsignedCKB}`
}

export const sUDTAmountFormatter = (amount: string) => {
  const fmtted = amount.substr(0, (amount.split('.')[0]?.length ?? 0) + 9)
  return `${fmtted}${fmtted.length < amount.length ? '...' : ''}`
}

export default {
  queryFormatter,
  currencyFormatter,
  CKBToShannonFormatter,
  shannonToCKBFormatter,
  localNumberFormatter,
  uniformTimeFormatter,
  difficultyFormatter,
  addressesToBalance,
  outputsToTotalAmount,
  failureResToNotification,
  sudtAmountToValue,
  sudtValueToAmount,
  sUDTAmountFormatter,
}
