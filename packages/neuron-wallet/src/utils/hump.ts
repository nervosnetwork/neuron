export function hump(param: any) {
  Object.keys(param).map(key => {
    let item = param[key]
    if (item instanceof Object || item instanceof Array) {
      hump(item)
    }
    if (humpString(key) !== key) {
      param[humpString(key)] = param[key]
      delete param[key]
    }
  })
  return param
}

export function humpString(key: string) {
  let keyArr = key.split('_')
  for (let i = 0; i < keyArr.length; i++) {
    if (i !== 0) {
      keyArr[i] = keyArr[i][0].toUpperCase() + keyArr[i].substr(1)
    }
  }
  return keyArr.join('')
}

export default { hump, humpString }
