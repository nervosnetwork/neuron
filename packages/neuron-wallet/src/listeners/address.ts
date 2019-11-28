import { remote } from 'electron'
import AddressesUsedSubject, { AddressesWithURL } from 'models/subjects/addresses-used-subject'
import AddressService from 'services/addresses'
import { Address } from 'database/address/address-dao'
import WalletService from 'services/wallets'
import { AccountExtendedPublicKey } from 'models/keys/key'

const isRenderer = process && process.type === 'renderer'
const addressesUsedSubject = isRenderer
  ? remote.require('./models/subjects/addresses-used-subject').default.getSubject()
  : AddressesUsedSubject.getSubject()

// update txCount when addresses used
export const register = () => {
  addressesUsedSubject.subscribe(async (address: AddressesWithURL) => {
    const addrs = await AddressService.updateTxCountAndBalances(address.addresses, address.url)
    const walletIds: string[] = addrs
      .map(addr => (addr as Address).walletId)
      .filter((value, idx, a) => a.indexOf(value) === idx)
    for (const id of walletIds) {
      const wallet = WalletService.getInstance().get(id)
      const accountExtendedPublicKey: AccountExtendedPublicKey = wallet.accountExtendedPublicKey()
      // set isImporting to undefined means unknown
      AddressService.checkAndGenerateSave(id, accountExtendedPublicKey, undefined, 20, 10)
    }
  })
}

export default register
