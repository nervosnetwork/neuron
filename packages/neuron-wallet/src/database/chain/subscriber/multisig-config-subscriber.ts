import { EventSubscriber, InsertEvent } from 'typeorm'
import UserSettingSubscriber from './user-setting-subscriber'
import MultisigConfig from '../entities/multisig-config'

@EventSubscriber()
export default class MultisigConfigSubscribe extends UserSettingSubscriber<MultisigConfig> {
  ignoreUpdateKeys = ['lastestBlockNumber']

  listenTo() {
    return MultisigConfig
  }

  async afterInsert(event: InsertEvent<MultisigConfig>): Promise<MultisigConfig | void> {
    const repo = this.getNeedSyncConnection(event.connection.name)?.getRepository(MultisigConfig)
    if (repo && event.entity) {
      await repo.upsert(event.entity.cloneIgnoreBlockNumber(), this.unionKeys)
    }
  }
}
