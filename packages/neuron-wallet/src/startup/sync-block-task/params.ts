import NodeService from 'services/node'
import { AddressesUsedSubject } from 'models/subjects/addresses-used-subject'
import AddressDbChangedSubject from 'models/subjects/address-db-changed-subject'
import WalletCreatedSubject from 'models/subjects/wallet-created-subject'

export { networkSwitchSubject } from 'services/networks'

export { genesisBlockHash } from './create'
export { databaseInitSubject } from './create'

export const nodeService = NodeService.getInstance()
export const addressesUsedSubject = AddressesUsedSubject.getSubject()
export const addressDbChangedSubject = AddressDbChangedSubject.getSubject()
export const walletCreatedSubject = WalletCreatedSubject.getSubject()
