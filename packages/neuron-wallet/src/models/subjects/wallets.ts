import { Subject } from 'rxjs'
import { debounceTime } from 'rxjs/operators'
import { updateApplicationMenu } from '../../utils/application-menu'
import dataUpdateSubject from './data-update'

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
  dataUpdateSubject.next({ dataType: 'wallet', actionType: 'update' })
  updateApplicationMenu(walletList, currentWalletId)
})

CurrentWalletSubject.pipe(debounceTime(DEBOUNCE_TIME)).subscribe(async ({ currentWallet = null, walletList = [] }) => {
  updateApplicationMenu(walletList, currentWallet ? currentWallet.id : null)
  if (!currentWallet) {
    return
  }
  dataUpdateSubject.next({ dataType: 'wallet', actionType: 'update' })
})

export default {
  WalletListSubject,
  CurrentWalletSubject,
}
