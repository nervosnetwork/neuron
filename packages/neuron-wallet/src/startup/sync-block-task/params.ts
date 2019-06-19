import NodeService from '../../services/node'
import { AddressesUsedSubject } from '../../subjects/addresses-used-subject'

export { networkSwitchSubject } from '../../services/networks'
export { addressChangeSubject, genesisBlockHash } from './create'

export const nodeService = NodeService.getInstance()
export const addressesUsedSubject = AddressesUsedSubject.getSubject()
