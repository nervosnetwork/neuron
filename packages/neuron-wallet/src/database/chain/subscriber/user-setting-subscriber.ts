import { EntitySubscriberInterface, InsertEvent, RemoveEvent, UpdateEvent } from 'typeorm'
import { ConnectionName, getConnection, getCurrentConnectionName } from '../connection'

type Constructor<T> = new (...args: unknown[]) => T

// Trigger relative updating through subscribing the changes from corresponding entities
export default abstract class UserSettingSubscriber<Entity extends object>
  implements EntitySubscriberInterface<Entity>
{
  abstract listenTo(): string | Constructor<Entity>

  unionKeys: string[] = ['id']

  entityKeyName: string = 'id'

  ignoreUpdateKeys: string[] = []

  getNeedSyncConnection(connectionName: string) {
    const currentConnectionName = getCurrentConnectionName()
    if (connectionName === currentConnectionName) {
      const otherConnectionName: ConnectionName = currentConnectionName === 'full' ? 'light' : 'full'
      return getConnection(otherConnectionName)
    }
    return
  }

  async afterInsert(event: InsertEvent<Entity>): Promise<Entity | void> {
    const repo = this.getNeedSyncConnection(event.connection.name)?.getRepository<Entity>(this.listenTo())
    if (repo && event.entity) {
      await repo.upsert(event.entity, this.unionKeys)
    }
  }

  async afterUpdate(event: UpdateEvent<Entity>): Promise<Entity | void> {
    const repo = this.getNeedSyncConnection(event.connection.name)?.getRepository<Entity>(this.listenTo())
    const updatedColumns = event.updatedColumns.filter(v => !this.ignoreUpdateKeys.includes(v.propertyName))
    if (repo && event.entity && event.databaseEntity && updatedColumns.length) {
      const updateEntity = updatedColumns.reduce(
        (pre, cur) => ({
          ...pre,
          [cur.propertyName]: event.entity![cur.propertyName],
        }),
        {}
      )
      const key = (event.databaseEntity as any)[this.entityKeyName]
      if (key !== undefined && key !== null) {
        await repo.update(key, updateEntity)
      }
    }
  }

  async afterRemove(event: RemoveEvent<Entity>): Promise<Entity | void> {
    const repo = this.getNeedSyncConnection(event.connection.name)?.getRepository<Entity>(this.listenTo())
    if (repo && event.databaseEntity) {
      await repo.remove(event.databaseEntity)
    }
  }
}
