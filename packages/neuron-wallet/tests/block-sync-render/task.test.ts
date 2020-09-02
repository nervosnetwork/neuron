import {when} from 'jest-when'
import EventEmitter from 'events'
import { LumosCellQuery } from "../../src/block-sync-renderer/sync/indexer-connector"

const stubbedSend = jest.fn()
const stubbedGetIndexerConnector = jest.fn()
const stubbedGetLiveCellsByScript = jest.fn()
const stubbedStartQueue = jest.fn()
const stubbedStopQueue = jest.fn()
const stubbedStopAndWaitQueue = jest.fn()
const stubbedInitConnection = jest.fn()

const stubbedIndexerConnector = {
  getLiveCellsByScript: stubbedGetLiveCellsByScript
}

const stubbedQueueConstructor = jest.fn().mockImplementation(
  () => ({
    getIndexerConnector: stubbedGetIndexerConnector,
    start: stubbedStartQueue,
    stop:stubbedStopQueue,
    stopAndWait: stubbedStopAndWaitQueue,
  })
)

const resetMocks = () => {
  stubbedSend.mockReset()
  stubbedGetIndexerConnector.mockReset()
  stubbedGetLiveCellsByScript.mockReset()
  stubbedStartQueue.mockReset()
  stubbedStopQueue.mockReset()
  stubbedStopAndWaitQueue.mockReset()
  stubbedInitConnection.mockReset()
}

describe('block sync render', () => {
  let eventEmitter: any
  const query: LumosCellQuery = {lock: null, type: null, data: null}
  const liveCells = [{}]
  beforeEach(async () => {
    resetMocks()

    eventEmitter = new EventEmitter()
    //@ts-ignore
    eventEmitter.send = stubbedSend

    when(stubbedGetLiveCellsByScript)
      .calledWith(query).mockResolvedValue(liveCells)

    stubbedGetIndexerConnector.mockReturnValue(stubbedIndexerConnector)

    jest.doMock('../../src/block-sync-renderer/sync/queue', () => {
      return stubbedQueueConstructor
    });
    jest.doMock('../../src/database/chain/ormconfig', () => {
      return stubbedInitConnection
    });
  });
  describe('inits sync queue', () => {
    let syncTask: any

    beforeEach(async () => {
      syncTask = jest.requireActual('../../src/block-sync-renderer/task-wrapper').default
    });

    it('call queryIndexer with results', async () => {
      await syncTask.start()
      const cells = await syncTask.queryIndexer(query)
      expect(cells).toEqual(liveCells)
    })
    it('start the syncTask should initConnection and start a sync queue', async () => {
      await syncTask.start()
      expect(stubbedInitConnection).toHaveBeenCalled()
      expect(stubbedStartQueue).toHaveBeenCalledTimes(1)
    })

    it('unmount sync task should stop the sync queue', async () => {
      await syncTask.start()
      syncTask.unmount()
      expect(stubbedStopQueue).toHaveBeenCalled()
    })

    it('sync task can be start over', async () => {
      await syncTask.start()
      syncTask.unmount()
      expect(stubbedStopQueue).toHaveBeenCalled()
      await syncTask.start()
      expect(stubbedInitConnection).toHaveBeenCalled()
      expect(stubbedStartQueue).toHaveBeenCalledTimes(2)
    })

    it('sync task start mutiple times should stop and wait for the quene to drained', async () => {
      await syncTask.start()
      await syncTask.start()
      expect(stubbedStopAndWaitQueue).toHaveBeenCalled()
      expect(stubbedStartQueue).toHaveBeenCalledTimes(2)
    })
  });
});
