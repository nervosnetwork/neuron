import { getConnection } from 'typeorm'
import initConnection from 'database/chain/ormconfig'
import IndexerProgress from 'services/indexer/progress'
import SyncInfoEntity from 'database/chain/entities/sync-info'

describe('IndexerProgress', () => {
  beforeAll(async () => {
    await initConnection('0x1234')
  })

  afterAll(async () => {
    await getConnection().close()
  })

  beforeEach(async done => {
    const connection = getConnection()
    await connection.synchronize(true)
    done()
  })

  it('setCurrent', async () => {
    const indexerProgress = new IndexerProgress()
    const value = '0.5'

    await indexerProgress.updateCurrent(value)

    const entity: SyncInfoEntity | undefined = await getConnection()
      .getRepository(SyncInfoEntity)
      .findOne({
        name: IndexerProgress.CURRENT_INDEXER_PROGRESS,
      })

    expect(entity && entity.value).toEqual(value)
  })

  it('getCurrent if not set', async () => {
    const indexerProgress = new IndexerProgress()

    const value = await indexerProgress.getCurrent()

    expect(value).toEqual('0')
  })

  it('getCurrent with set', async () => {
    const indexerProgress = new IndexerProgress()
    const value = '0.75'

    await indexerProgress.updateCurrent(value)
    const result = await indexerProgress.getCurrent()
    expect(result).toEqual(value)
  })
})
