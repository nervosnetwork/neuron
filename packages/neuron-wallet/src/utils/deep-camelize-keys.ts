export function snakeToCamel(key: string) {
  if (!key) return ''

  let keyArr = key.split('_')
  for (let i = 0; i < keyArr.length; i++) {
    if (i !== 0) {
      keyArr[i] = keyArr[i][0].toUpperCase() + keyArr[i].substr(1)
    }
  }
  return keyArr.join('')
}

type Json = Record<string, unknown>

export function deepCamelizeKeys(param: Json): Json {
  Object.keys(param).map(key => {
    let item = param[key]
    if (item instanceof Object) {
      deepCamelizeKeys(item as Json)
    }
    if (snakeToCamel(key) !== key) {
      param[snakeToCamel(key)] = param[key]
      delete param[key]
    }
  })
  return param
}

export default { deepCamelizeKeys, snakeToCamel }
