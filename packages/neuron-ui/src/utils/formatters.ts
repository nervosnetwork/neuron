/* global BigInt */
export const queryFormatter = (params: { [index: string]: any }) => {
  const newQuery = new URLSearchParams()
  Object.entries(params).forEach(([key, value]) => {
    newQuery.set(key, `${value}`)
  })
  return newQuery
}

export const currencyFormatter = (value: string, type: 'CKB' | 'CNY' | 'USD' = 'CKB', exchange: string = '1') => {
  // TODO: format to locale string
  return `${(BigInt(value) * BigInt(exchange)).toString()} ${type}`
}

export default {
  queryFormatter,
  currencyFormatter,
}
