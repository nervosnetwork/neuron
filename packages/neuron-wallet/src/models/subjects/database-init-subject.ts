import { ReplaySubject } from 'rxjs'
import { NetworkWithID } from 'types/network'
import ProcessUtils from 'utils/process'
import { remote } from 'electron'

export interface DatabaseInitParams {
  network: NetworkWithID
  genesisBlockHash: string
  chain: string
}

export class DatabaseInitSubject {
  private static subject = new ReplaySubject<DatabaseInitParams>(1)

  public static getSubject() {
    if (ProcessUtils.isRenderer()) {
      return remote.require('./models/subjects/database-init-subject').default.getSubject()
    } else {
      return this.subject
    }
  }
}

export default DatabaseInitSubject
