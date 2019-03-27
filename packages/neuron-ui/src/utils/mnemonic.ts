export const generateMnemonic = (length: number = 12): string => {
  // TODO: generate mnemonic
  return 'word,'.repeat(length)
}
export const verifyMnemonic = (generated: string, imported: string) => {
  return generated === imported
}

export default {
  generateMnemonic,
  verifyMnemonic,
}
