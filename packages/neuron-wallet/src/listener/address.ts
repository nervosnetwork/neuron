import AddressesUsedSubject from '../models/subjects/addresses-used-subject'
import AddressService from '../services/addresses'
import WalletService from '../services/wallets'
import { AccountExtendedPublicKey } from '../models/keys/key'

// update txCount when addresses used
export const register = () => {
  AddressesUsedSubject.getSubject().subscribe(async (addresses: string[]) => {
    const addrs = await AddressService.updateTxCountAndBalances(addresses)
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
