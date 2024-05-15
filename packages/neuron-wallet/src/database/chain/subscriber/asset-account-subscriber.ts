import { EventSubscriber, InsertEvent } from 'typeorm'
import UserSettingSubscriber from './user-setting-subscriber'
import AssetAccount from '../entities/asset-account'

@EventSubscriber()
export default class AssetAccountSubscribe extends UserSettingSubscriber<AssetAccount> {
  unionKeys: string[] = ['tokenID', 'blake160']

  ignoreUpdateKeys: string[] = ['sudtTokenInfo']

  listenTo() {
    return AssetAccount
  }

  async afterInsert(event: InsertEvent<AssetAccount>): Promise<AssetAccount | void> {
    const repo = this.getNeedSyncConnection(event.connection.name)?.getRepository(AssetAccount)
    if (repo && event.entity) {
      const exist = await repo.findOneBy({ tokenID: event.entity.tokenID, blake160: event.entity.blake160 })
      if (exist) {
        await repo.update(exist.id, AssetAccount.fromModel(event.entity.toModel()))
      } else {
        await repo.save(event.entity)
      }
    }
  }
}
