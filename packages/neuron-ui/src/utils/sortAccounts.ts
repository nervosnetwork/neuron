export interface Account {
  accountName: string
  tokenName: string
}

export const sortAccounts = (prev: Account, next: Account) => {
  if (!prev.tokenName || !next.tokenName) {
    return +!prev.tokenName - 0.5
  }
  const tokenNameRes = prev.tokenName.localeCompare(next.tokenName)
  if (tokenNameRes === 0) {
    if (!prev.accountName || !next.accountName) {
      return +!prev.accountName - 0.5
    }
    return prev.accountName.localeCompare(next.accountName)
  }
  return tokenNameRes
}

export default sortAccounts
