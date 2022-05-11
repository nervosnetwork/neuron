export const getExplorerUrl = (isMainnet: boolean = true) => {
  return isMainnet ? 'https://explorer.nervos.org' : 'https://pudge.explorer.nervos.org'
}

export default getExplorerUrl
