import { remote } from 'electron'

export const { networkSwitchSubject, nodeService, addressChangeSubject, addressesUsedSubject } = remote.require(
  './startup/sync-block-task/params'
)
