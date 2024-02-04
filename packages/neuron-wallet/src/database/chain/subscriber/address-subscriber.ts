import { EventSubscriber } from 'typeorm'
import UserSettingSubscriber from './user-setting-subscriber'
import AddressDescription from '../entities/address-description'

@EventSubscriber()
export default class AddressSubscribe extends UserSettingSubscriber<AddressDescription> {
  listenTo() {
    return AddressDescription
  }
}
