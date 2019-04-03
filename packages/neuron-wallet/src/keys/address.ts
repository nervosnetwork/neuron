const Address = {
  isUsedAddress: (address: string) => {
    // TODO: check whether the address has history transactions
    return address.includes('ckb')
  },

  addressFromPrivateKey: (privateKey: string) => {
    // TODO: generate address from private key
    return `ckb${privateKey}`
  },
}

export default Address
