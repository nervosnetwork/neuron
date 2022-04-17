import { toUint64Le, parseEpoch } from 'services/chain'
import { PAGE_SIZE } from './const'

export const listParams = (search: string) => {
  const query = new URLSearchParams(search)
  const keywords = query.get('keywords') || ''
  // use Object.fromEntries in ES10
  const params = {
    pageNo: +(query.get('pageNo') || 1),
    pageSize: +(query.get('pageSize') || PAGE_SIZE),
    keywords,
  }
  return params
}

export const queryParsers = { listParams }

export const epochParser = (epoch: string) => {
  const e = epoch.startsWith('0x') ? epoch : `0x${BigInt(epoch).toString(16)}`
  const parsed = parseEpoch(e)

  const res = {
    length: BigInt(parsed.length),
    index: BigInt(parsed.index),
    number: BigInt(parsed.number),
  }

  return {
    ...res,
    value: res.length > 0 ? Number(res.number) + Number(res.index) / Number(res.length) : Number(res.number),
  }
}

export const toUint128Le = (hexString: string) => {
  if (!hexString.startsWith('0x')) {
    throw new Error('Invalid hex string')
  }

  let s = hexString

  if (s.length < 34) {
    s = s.padEnd(34, '0')
  } else if (s.length > 34) {
    s = s.slice(0, 34)
  }

  return `${toUint64Le(`0x${s.substr(18, 16)}`)}${toUint64Le(s.substr(0, 18)).slice(2)}`
}
