import Monitor from '../../src/services/monitor/base'
import CkbMonitor from '../../src/services/monitor/ckb-monitor'
import CkbIndexerMonitor from '../../src/services/monitor/ckb-indexer-monitor'

const isDefaultCKBNeedRestartMock = jest.fn().mockResolvedValue(true)
const startNodeMock = jest.fn()

jest.mock('../../src/services/node', () => ({
  getInstance() {
    return {
      isDefaultCKBNeedRestart: isDefaultCKBNeedRestartMock,
      startNode: startNodeMock
    }
  }
}))

describe('ckb monitor', () => {
  const monitor = new CkbMonitor()
  it('is living', async () => {
    const isLiving = await monitor.isLiving()
    expect(isLiving).toBeFalsy()
  })
  it('restart', async () => {
    await monitor.restart()
    expect(startNodeMock).toHaveBeenCalled()
  })
})

const rpcRequestMock = jest.fn()
jest.mock('../../src/utils/rpc-request', () => ({
  rpcRequest: () => rpcRequestMock()
}))

const resetSyncTaskMock = jest.fn()
jest.mock('../../src/block-sync-renderer/index', () => ({
  resetSyncTask: () => resetSyncTaskMock()
}))

describe('ckb indexer monitor', () => {
  const monitor = new CkbIndexerMonitor()
  describe('is living', () => {
    it('rpc success', async () => {
      const isLiving = await monitor.isLiving()
      expect(isLiving).toBeTruthy()
    })
    it('rpc failed with ECONNREFUSED', async () => {
      rpcRequestMock.mockRejectedValueOnce({ code: 'ECONNREFUSED' })
      const isLiving = await monitor.isLiving()
      expect(isLiving).toBeFalsy()
    })
    it('rpc failed not ECONNREFUSED', async () => {
      rpcRequestMock.mockRejectedValueOnce({})
      const isLiving = await monitor.isLiving()
      expect(isLiving).toBeTruthy()
    })
  })
  it('restart', async () => {
    await monitor.restart()
    expect(resetSyncTaskMock).toHaveBeenCalled()
  })
})

const isLivingMock = jest.fn()
const restartMock = jest.fn()
class MonitorTest extends Monitor {
  isLiving(): Promise<boolean> {
    return isLivingMock()
  }

  restart(): Promise<void> {
    return restartMock()
  }
}

function wait(times: number) {
  return new Promise((resolve) => {
    setTimeout(() => { resolve(times) }, times)
  })
}
describe('base monitor', () => {
  const monitor = new MonitorTest()

  beforeEach(() => {
    isLivingMock.mockReset()
    restartMock.mockReset()
  })

  describe('start monitor', () => {
    it('is living', async () => {
      isLivingMock.mockResolvedValue(true)
      monitor.startMonitor(100)
      await wait(200)
      expect(isLivingMock).toHaveBeenCalled()
      expect(restartMock).toHaveBeenCalledTimes(0)
      monitor.clearMonitor()
    })
    it('not living', async () => {
      isLivingMock.mockResolvedValue(true).mockResolvedValueOnce(false)
      monitor.startMonitor(100)
      await wait(200)
      expect(isLivingMock).toHaveBeenCalled()
      expect(restartMock).toHaveBeenCalled()
      monitor.clearMonitor()
    })
    it('isLiving timeout', async () => {
      isLivingMock.mockImplementation(() => wait(200))
      monitor.startMonitor(100)
      await wait(200)
      expect(isLivingMock).toHaveBeenCalled()
      expect(restartMock).toHaveBeenCalledTimes(0)
      monitor.clearMonitor()
    })
    it('not living wait restart', async () => {
      isLivingMock.mockResolvedValueOnce(false)
      restartMock.mockImplementation(() => wait(400))
      monitor.startMonitor(100)
      await wait(400)
      expect(isLivingMock).toHaveBeenCalled()
      expect(restartMock).toHaveBeenCalledTimes(1)
      monitor.clearMonitor()
    })
  })
})