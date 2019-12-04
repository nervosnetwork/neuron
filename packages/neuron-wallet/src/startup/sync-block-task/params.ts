import NodeService from 'services/node'
import { AddressesUsedSubject } from 'models/subjects/addresses-used-subject'
import AddressDbChangedSubject from 'models/subjects/address-db-changed-subject'
import WalletCreatedSubject from 'models/subjects/wallet-created-subject'
import AddressCreatedSubject from 'models/subjects/address-created-subject'
import NetworkSwitchSubject from 'models/subjects/network-switch-subject'

export { genesisBlockHash } from '.'
export { databaseInitSubject } from '.'

export const nodeService = NodeService.getInstance()
export const addressesUsedSubject = AddressesUsedSubject.getSubject()
export const addressDbChangedSubject = AddressDbChangedSubject.getSubject()
export const walletCreatedSubject = WalletCreatedSubject.getSubject()
export const addressCreatedSubject = AddressCreatedSubject.getSubject()
export const networkSwitchSubject = NetworkSwitchSubject.getSubject()
