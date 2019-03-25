export const history = (search: string) => {
  const qurery = new URLSearchParams(search)
  const addresses = qurery.get('addresses')
  // use Object.fromEntries in ES10
  const params = {
    pageNo: +(qurery.get('pageNo') || 0),
    pageSize: +(qurery.get('pageSize') || 15),
    addresses: addresses ? addresses.split(',') : [],
  }
  return params
}
export const queryParsers = {
  history,
}

export default {
  queryParsers,
}
