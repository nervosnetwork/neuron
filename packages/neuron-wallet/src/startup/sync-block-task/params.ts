import NodeService from '../../services/node'
import { AddressesUsedSubject } from '../../models/subjects/addresses-used-subject'
import AddressDbChangedSubject from '../../models/subjects/address-db-changed-subject'

export { networkSwitchSubject } from '../../services/networks'

export { genesisBlockHash } from './create'
export { databaseInitSubject } from './create'

export const nodeService = NodeService.getInstance()
export const addressesUsedSubject = AddressesUsedSubject.getSubject()
export const addressDbChangedSubject = AddressDbChangedSubject.getSubject()
