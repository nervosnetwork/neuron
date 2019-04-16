import { PAGE_SIZE } from './const'

export const history = (search: string) => {
  const query = new URLSearchParams(search)
  const addresses = query.get('addresses')
  // use Object.fromEntries in ES10
  const params = {
    pageNo: +(query.get('pageNo') || 0),
    pageSize: +(query.get('pageSize') || PAGE_SIZE),
    addresses: addresses ? addresses.split(',') : [],
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

export default { queryParsers }
