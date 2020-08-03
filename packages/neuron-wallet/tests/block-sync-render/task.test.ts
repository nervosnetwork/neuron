import {when} from 'jest-when'
import EventEmitter from 'events'
import { LumosCellQuery } from "../../src/block-sync-renderer/sync/indexer-connector"

const stubbedSend = jest.fn()
const stubbedGetIndexerConnector = jest.fn()
const stubbedGetLiveCellsByScript = jest.fn()
const stubbedStartQueue = jest.fn()

const stubbedIndexerConnector = {
  getLiveCellsByScript: stubbedGetLiveCellsByScript
}

const stubbedQueueConstructor = jest.fn().mockImplementation(
  () => ({
    getIndexerConnector: stubbedGetIndexerConnector,
    start: stubbedStartQueue
  })
)

const resetMocks = () => {
  stubbedSend.mockReset()
  stubbedGetIndexerConnector.mockReset()
  stubbedGetLiveCellsByScript.mockReset()
  stubbedStartQueue.mockReset()
}

describe('block sync render', () => {
  let eventEmitter: any
  const query: LumosCellQuery = {lock: null, type: null, data: null}
  const liveCells = [{}]
  let SyncTask: any
  beforeEach(async () => {
    resetMocks()

    eventEmitter = new EventEmitter()
    //@ts-ignore
    eventEmitter.send = stubbedSend

    when(stubbedGetLiveCellsByScript)
      .calledWith(query).mockResolvedValue(liveCells)

    stubbedGetIndexerConnector.mockReturnValue(stubbedIndexerConnector)

    jest.doMock('electron', () => {
      return {
        ipcRenderer: eventEmitter
      }
    });
    jest.doMock('../../src/block-sync-renderer/sync/queue', () => {
      return stubbedQueueConstructor
    });
    jest.doMock('../../src/database/chain/ormconfig', () => {
      return jest.fn()
    });

    SyncTask = jest.requireActual('../../src/block-sync-renderer/task').default
  });
  describe('inits sync queue', () => {
    let syncTask: any
    beforeEach(() => {
      syncTask = new SyncTask()
      syncTask.start()
    });
    describe('on#block-sync:query-indexer', () => {

      it('call queryIndexer with results', async () => {
        const cells = await syncTask.queryIndexer(query)
        expect(cells).toEqual(liveCells)
      })
    });
  });
});
