import { Subject } from 'rxjs'
import { debounceTime } from 'rxjs/operators'
import { updateApplicationMenu } from '../../utils/application-menu'
import {
  broadcastCurrentWallet,
  broadcastWalletList,
  broadcastAddressList,
  broadcastTransactions,
} from '../../utils/broadcast'

const DEBOUNCE_TIME = 50

export const WalletListSubject = new Subject<{
  currentWallet?: Controller.Wallet | null
  prevWalletList: Controller.Wallet[]
  currentWalletList: Controller.Wallet[]
}>()

export const CurrentWalletSubject = new Subject<{
  currentWallet: Controller.Wallet | null
  walletList: Controller.Wallet[]
}>()

WalletListSubject.pipe(debounceTime(DEBOUNCE_TIME)).subscribe(({ currentWallet = null, currentWalletList = [] }) => {
  const walletList = currentWalletList.map(({ id, name }) => ({ id, name }))
  const currentWalletId = currentWallet ? currentWallet.id : null
  broadcastWalletList(walletList)
  updateApplicationMenu(walletList, currentWalletId)
})

CurrentWalletSubject.pipe(debounceTime(DEBOUNCE_TIME)).subscribe(async ({ currentWallet = null, walletList = [] }) => {
  broadcastCurrentWallet(currentWallet)
  updateApplicationMenu(walletList, currentWallet ? currentWallet.id : null)
  if (!currentWallet) {
    return
  }
  broadcastAddressList(currentWallet.id)
  broadcastTransactions(currentWallet.id)
})

export default {
  WalletListSubject,
  CurrentWalletSubject,
}
