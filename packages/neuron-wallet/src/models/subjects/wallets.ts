import { Subject } from 'rxjs'

export const WalletListSubject = new Subject<{
  currentWallet?: Controller.Wallet | null
  previousWalletList: Controller.Wallet[]
  currentWalletList: Controller.Wallet[]
}>()

export const CurrentWalletSubject = new Subject<{
  currentWallet: Controller.Wallet | null
  walletList: Controller.Wallet[]
}>()

export default {
  WalletListSubject,
  CurrentWalletSubject,
}
