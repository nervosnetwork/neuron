export const generateWalletName = (wallets: Readonly<State.WalletIdentity[]>, baseNum: number, t: any): string => {
  const walletName = t('wizard.wallet-suffix', { suffix: baseNum })
  if (wallets.some(wallet => wallet.name === walletName)) {
    return generateWalletName(wallets, baseNum + 1, t)
  }
  return walletName
}
export default generateWalletName
