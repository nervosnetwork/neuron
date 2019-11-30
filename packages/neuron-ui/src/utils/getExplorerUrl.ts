export default (isMainnet: boolean = true) => {
  return isMainnet ? 'https://explorer.nervos.org' : 'https://explorer.nervos.org/testnet'
}
