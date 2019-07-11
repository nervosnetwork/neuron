import { ReplaySubject } from 'rxjs'
import { delay } from 'rxjs/operators'
import { ResponseCode, Channel } from '../../utils/const'
import { Transaction } from '../../types/cell-types'
import windowManager from '../window-manager'
import TransactionsService from '../../services/transactions'
import AddressService from '../../services/addresses'
import LockUtils from '../lock-utils'

export interface TransactionChangedMessage {
  event: string
  tx: Transaction
}

// subscribe this Subject to monitor any transaction table changes
export class TxDbChangedSubject {
  static subject = new ReplaySubject<TransactionChangedMessage>(100)

  static getSubject() {
    return TxDbChangedSubject.subject
  }

  static setSubject(subject: ReplaySubject<TransactionChangedMessage>) {
    TxDbChangedSubject.unsubscribe()
    TxDbChangedSubject.subject = subject
    TxDbChangedSubject.subscribe()
  }

  static subscribe = () => {
    // TODO: since typeorm not provide afterCommit hooks, delay for wait transaction committed
    TxDbChangedSubject.subject.pipe(delay(100)).subscribe(async ({ tx }) => {
      const transaction = await TransactionsService.get(tx.hash)
      if (!transaction) {
        return
      }
      const blake160s = TransactionsService.blake160sOfTx(transaction)
      const addresses = blake160s.map(blake160 => LockUtils.blake160ToAddress(blake160))
      const addrs = await AddressService.findByAddresses(addresses)
      const walletIDs = addrs.map(addr => addr.walletId)
      const uniqueWalletIDs = [...new Set(walletIDs)]
      const result = {
        tx: transaction,
        walletIDs: JSON.stringify(uniqueWalletIDs),
      }
      windowManager.broadcast(Channel.Transactions, 'transactionUpdated', {
        status: ResponseCode.Success,
        result,
      })
    })
  }

  static unsubscribe = () => {
    if (TxDbChangedSubject.subject) {
      TxDbChangedSubject.subject.unsubscribe()
    }
  }
}

TxDbChangedSubject.subscribe()

export default TxDbChangedSubject
