import { remote } from 'electron'
import { ReplaySubject } from 'rxjs'
import { bufferTime } from 'rxjs/operators'
import AddressesUsedSubject, { AddressesWithURL } from 'models/subjects/addresses-used-subject'
import AddressService from 'services/addresses'
import { Address } from 'database/address/address-dao'
import WalletService from 'services/wallets'
import { AccountExtendedPublicKey } from 'models/keys/key'

const isRenderer = process && process.type === 'renderer'
const addressesUsedSubject = isRenderer
  ? remote.require('./models/subjects/addresses-used-subject').default.getSubject()
  : AddressesUsedSubject.getSubject()

// pipe not working directly
const bridge = new ReplaySubject<AddressesWithURL>(1000)
addressesUsedSubject.subscribe((params: AddressesWithURL) => {
  bridge.next(params)
})

// update txCount when addresses used
export const register = () => {
  bridge.pipe(bufferTime(1000)).subscribe(async (addressesList: AddressesWithURL[]) => {
    if (addressesList.length === 0) {
      return
    }
    const addresses = addressesList.map(list => list.addresses).reduce((acc, val) => acc.concat(val), [])
    const url: string = addressesList[addressesList.length - 1].url
    const uniqueAddresses = [...new Set(addresses)]
    const addrs = await AddressService.updateTxCountAndBalances(uniqueAddresses, url)
    const walletIds: string[] = addrs.map(addr => (addr as Address).walletId).filter((value, idx, a) => a.indexOf(value) === idx)
    for (const id of walletIds) {
      const wallet = WalletService.getInstance().get(id)
      const accountExtendedPublicKey: AccountExtendedPublicKey = wallet.accountExtendedPublicKey()
      // set isImporting to undefined means unknown
      AddressService.checkAndGenerateSave(id, accountExtendedPublicKey, undefined, 20, 10)
    }
  })
}

export default register
