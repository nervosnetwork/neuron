import { EventSubscriber, InsertEvent } from 'typeorm'
import UserSettingSubscriber from './user-setting-subscriber'
import SudtTokenInfo from '../entities/sudt-token-info'

@EventSubscriber()
export default class SudtTokenInfoSubscribe extends UserSettingSubscriber<SudtTokenInfo> {
  unionKeys: string[] = ['tokenID']

  entityKeyName: string = 'tokenID'

  ignoreUpdateKeys: string[] = ['assetAccounts']

  listenTo() {
    return SudtTokenInfo
  }

  async afterInsert(event: InsertEvent<SudtTokenInfo>): Promise<SudtTokenInfo | void> {
    const repo = this.getNeedSyncConnection(event.connection.name)?.getRepository(SudtTokenInfo)
    if (repo && event.entity) {
      let mergeEntity: SudtTokenInfo | undefined = undefined
      const existEntity = await event.connection
        .getRepository(SudtTokenInfo)
        .findOneBy({ tokenID: event.entity.tokenID })
      if (existEntity) {
        mergeEntity = new SudtTokenInfo()
        mergeEntity.tokenID = event.entity.tokenID || existEntity.tokenID
        mergeEntity.symbol = event.entity.symbol || existEntity.symbol
        mergeEntity.tokenName = event.entity.tokenName || existEntity.tokenName
        mergeEntity.decimal = event.entity.decimal || existEntity.decimal
      }
      await repo.upsert(mergeEntity ?? event.entity, this.unionKeys)
    }
  }
}
