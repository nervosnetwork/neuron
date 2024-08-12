import { table, blockchain } from '@ckb-lumos/lumos/codec'
import { formatUnit } from '@ckb-lumos/lumos/utils'
import { TFunction } from 'i18next'
import { FailureFromController } from 'services/remote/remoteApiWrapper'
import { CapacityUnit } from './enums'

const CKB_DECIMALS = 8

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

export const shannonToCKBFormatter = (shannon: string, showPositiveSign?: boolean, showCommaSeparator = true) => {
  if (Number.isNaN(+shannon)) {
    console.warn(`Invalid shannon value: ${shannon}`)
    return shannon
  }
  return new Intl.NumberFormat('en-US', {
    useGrouping: showCommaSeparator,
    signDisplay: showPositiveSign && +shannon > 0 ? 'always' : 'auto',
    maximumFractionDigits: CKB_DECIMALS,
  }).format(formatUnit(BigInt(shannon ?? '0'), 'ckb') as any)
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

export const sudtValueToAmount = (
  value: string | null = '0',
  decimal: string = '0',
  showPositiveSign = false,
  showCommaSeparator = true
) => {
  if (Number.isNaN(Number(value))) {
    console.warn(`Invalid sudt value: ${value}`)
  }
  const val = value === null || Number.isNaN(+value) ? '0' : value
  const [int, dec = ''] = formatUnit(val, +decimal).split('.')
  const fmt = new Intl.NumberFormat('en-US', {
    useGrouping: showCommaSeparator,
    signDisplay: showPositiveSign ? 'always' : 'auto',
  })
  // use any type to avoid TS errors since string is not listed in the args IntlFormatter.prototype.format definition but it works
  return `${fmt.format(int as any)}${dec ? `.${dec}` : ''}`
}

export const sUDTAmountFormatter = (amount: string) => {
  const fmtted = amount.substr(0, (amount.split('.')[0]?.length ?? 0) + 9)
  return `${fmtted}${fmtted.length < amount.length ? '...' : ''}`
}

export const nftFormatter = (hex?: string, idOnly = false) => {
  if (hex == null || hex.length !== 58) {
    return 'mNFT'
  }
  const data = hex.slice(2, 58)
  const issuerId = data.slice(36, 40)
  const classId = BigInt(`0x${data.slice(40, 48)}`).toString()
  const tokenId = BigInt(`0x${data.slice(48, 56)}`).toString()
  const id = `${issuerId}-${classId}-${tokenId}`
  if (idOnly) {
    return id
  }
  return `#${id} mNFT`
}

export function truncateMiddle(str: string, start = 8, end = start): string {
  if (str.length <= start + end) {
    return str
  }
  return `${str.slice(0, start)}...${str.slice(-end)}`
}

type FormatterOptions = { args: string; data?: string; clusterName?: string; truncate?: number }
export const sporeFormatter = ({ args, data, clusterName, truncate }: FormatterOptions) => {
  let format = 'Spore'

  const SporeData = table(
    {
      contentType: blockchain.Bytes,
      content: blockchain.Bytes,
      clusterId: blockchain.BytesOpt,
    },
    ['contentType', 'content', 'clusterId']
  )

  if (data) {
    try {
      const { clusterId } = SporeData.unpack(data)

      // the name may be empty when it works with the light client.
      // a spore cell may appear before the cluster cell is found in the light client.
      // So we need a placeholder for the name.
      if (clusterId && !clusterName) {
        format = `[${truncateMiddle(clusterId, truncate)}] ${format}`
      }
      if (clusterId && clusterName) {
        format = `[${truncateMiddle(clusterName, truncate)}] ${format}`
      }
    } catch {
      // the Spore contract seems not guarantee the data always valid
      // empty catch here to avoid crash
    }
  }

  if (args) {
    format = `[${truncateMiddle(args, truncate)}] ${format}`
  }

  return format
}

export const errorFormatter = (error: string | FailureFromController['message'], t: TFunction) => {
  // empty string should return unknown error too
  const unknownError = t('messages.unknown-error')
  if (typeof error === 'string') {
    return error || unknownError
  }

  return error.content || unknownError
}

export const bytesFormatter = (bytes: number, decimals = 1) => {
  let i = 0
  let value = bytes

  while (value > 1023) {
    value /= 1024
    ++i
  }

  return `${i ? value.toFixed(decimals) : value} ${['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB'][i]}`
}

export const padFractionDigitsIfDecimal = (num: string | number, minimumFractionDigits: number): string => {
  const numText = num.toString()
  const isDecimal = numText.includes('.')
  return isDecimal ? numText.padEnd(numText.indexOf('.') + 1 + minimumFractionDigits, '0') : numText
}

/**
 * Convert complex numbers for millennial counting to pure numbers.
 * ex:
 * -100.00002362 CKB ---> -100.00002362
 * +10,000 CKB ---> 10000
 *  */
export const complexNumberToPureNumber = (value: string) => {
  const num = Number(value.replace(/[^-0-9.]/g, ''))
  return num
}
