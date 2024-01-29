import { EventSubscriber } from 'typeorm'
import UserSettingSubscriber from './user-setting-subscriber'
import TxDescription from '../entities/tx-description'

@EventSubscriber()
export default class TxDescriptionSubscribe extends UserSettingSubscriber<TxDescription> {
  listenTo() {
    return TxDescription
  }
}
