export const verifyAddress = (address: string): boolean => {
  return address.replace(/^0x/, '').length === 40
}

export default undefined
