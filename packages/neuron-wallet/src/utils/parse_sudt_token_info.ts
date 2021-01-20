const parseSUDTTokenInfo = (hexData : string ) => {
    let data = hexData
    if (hexData.slice(0, 6) === "0x0a0a") {
      data = data.replace("0x0a", "0xa")
    }
    const [decimal, name, symbol] = data.split("0a")
    return {
      decimal: decimal ? parseInt(decimal).toString(): '',
      name: name ? hexToString(name): '',
      symbol: symbol ? hexToString(symbol): '',
    }
}

const hexToString = (hex: string): string => {
  return Buffer.from(hex, 'hex').toString('utf-8')
}

export default parseSUDTTokenInfo
