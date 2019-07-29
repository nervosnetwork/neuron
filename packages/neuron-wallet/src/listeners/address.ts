import { remote } from 'electron'
import { ReplaySubject } from 'rxjs'
import { bufferTime } from 'rxjs/operators'
import AddressesUsedSubject from '../models/subjects/addresses-used-subject'
import AddressService from '../services/addresses'
import WalletService from '../services/wallets'
import { AccountExtendedPublicKey } from '../models/keys/key'

const isRenderer = process && process.type === 'renderer'
const addressesUsedSubject = isRenderer
  ? remote.require('./models/subjects/addresses-used-subject').default.getSubject()
  : AddressesUsedSubject.getSubject()

// pipe not working directly
const bridge = new ReplaySubject<string[]>(1000)
addressesUsedSubject.subscribe((addresses: string[]) => {
  bridge.next(addresses)
})

// update txCount when addresses used
export const register = () => {
  bridge.pipe(bufferTime(1000)).subscribe(async (addressesList: string[][]) => {
    const addresses = addressesList.reduce((acc, val) => acc.concat(val), [])
    const uniqueAddresses = [...new Set(addresses)]
    const addrs = await AddressService.updateTxCountAndBalances(uniqueAddresses)
    const walletIds: string[] = addrs.map(addr => addr.walletId).filter((value, idx, a) => a.indexOf(value) === idx)
    await Promise.all(
      walletIds.map(async id => {
        const wallet = WalletService.getInstance().get(id)
        const accountExtendedPublicKey: AccountExtendedPublicKey = wallet.accountExtendedPublicKey()
        await AddressService.checkAndGenerateSave(id, accountExtendedPublicKey, 20, 10)
      })
    )
  })
}

export default register
