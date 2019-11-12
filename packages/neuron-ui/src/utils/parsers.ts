import { PAGE_SIZE } from './const'

export const history = (search: string) => {
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

export const prompt = (search: string) => {
  const query = new URLSearchParams(search)
  const params: { [index: string]: string | null } = {}
  const keys = [...query.keys()]
  keys.forEach((key: string) => {
    params[key] = query.get(key)
  })
  return params
}
export const queryParsers = { history, prompt }

export const epochParser = (epoch: string) => {
  const e = BigInt(epoch)
  return {
    length: (e >> BigInt(40)) & BigInt(0xffff),
    index: (e >> BigInt(24)) & BigInt(0xffff),
    number: e & BigInt(0xffffff),
  }
}

export default { queryParsers, epochParser }
