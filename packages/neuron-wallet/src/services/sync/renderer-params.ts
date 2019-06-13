import { remote } from 'electron'

const { app }: { app: any } = remote
const { syncBlockTask } = app
export const { networkSwitchSubject, nodeService, addressChangeSubject, addressesUsedSubject } = syncBlockTask
