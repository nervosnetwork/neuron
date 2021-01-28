const parseSUDTTokenInfo = (hexData : string ) => {
  const decimal = (+hexData.substr(0, 4)).toString()
  const [, name = '', symbol = ''] = Buffer.from(hexData.slice(4), 'hex').toString('utf-8').split(`\n`)
  return { decimal, name, symbol }
}

export default parseSUDTTokenInfo
