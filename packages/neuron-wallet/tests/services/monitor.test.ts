import Monitor from '../../src/services/monitor/base'
import CkbMonitor from '../../src/services/monitor/ckb-monitor'
import CkbIndexerMonitor from '../../src/services/monitor/ckb-indexer-monitor'
import startMonitor, { stopMonitor } from '../../src/services/monitor/index'

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

const stopCkbNodeMock = jest.fn()
jest.mock('../../src/services/ckb-runner', () => ({
  stopCkbNode: () => stopCkbNodeMock()
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
  it('stop', async () => {
    await monitor.stop()
    expect(stopCkbNodeMock).toHaveBeenCalled()
  })
})

const rpcRequestMock = jest.fn()
jest.mock('../../src/utils/rpc-request', () => ({
  rpcRequest: () => rpcRequestMock()
}))

const asyncPushMock = jest.fn()
jest.mock('../../src/block-sync-renderer/index', () => ({
  resetSyncTaskQueue: {
    asyncPush: (v: boolean) => asyncPushMock(v)
  }
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
    expect(asyncPushMock).toHaveBeenCalledWith(true)
  })
  it('stop', async () => {
    await monitor.stop()
    expect(asyncPushMock).toHaveBeenCalledWith(false)
  })
})

const isLivingMock = jest.fn()
const restartMock = jest.fn()
const stopMock = jest.fn()
class MonitorTest extends Monitor {
  isLiving(): Promise<boolean> {
    return isLivingMock()
  }

  restart(): Promise<void> {
    return restartMock()
  }

  stop(): Promise<void> {
    return stopMock()
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
    afterEach(async () => {
      await monitor.stopMonitor()
    })
    it('is living', async () => {
      isLivingMock.mockResolvedValue(true)
      monitor.startMonitor(100)
      await wait(200)
      expect(isLivingMock).toHaveBeenCalled()
      expect(restartMock).toHaveBeenCalledTimes(0)
    })
    it('not living', async () => {
      isLivingMock.mockResolvedValue(true).mockResolvedValueOnce(false)
      await monitor.startMonitor(100)
      await wait(200)
      expect(isLivingMock).toHaveBeenCalled()
      expect(restartMock).toHaveBeenCalled()
    })
    it('isLiving timeout', async () => {
      isLivingMock.mockImplementation(() => wait(200))
      await monitor.startMonitor(100)
      await wait(200)
      expect(isLivingMock).toHaveBeenCalled()
      expect(restartMock).toHaveBeenCalledTimes(1)
    })
    it('not living wait restart', async () => {
      isLivingMock.mockResolvedValue(true).mockResolvedValueOnce(false)
      restartMock.mockImplementation(() => wait(400))
      await monitor.startMonitor(100)
      await wait(800)
      expect(isLivingMock).toHaveBeenCalled()
      expect(restartMock).toHaveBeenCalledTimes(1)
    })
    it('start monitor with first', async () => {
      isLivingMock.mockResolvedValue(true).mockResolvedValueOnce(false)
      await monitor.startMonitor(1000, true)
      await wait(500)
      expect(isLivingMock).toHaveBeenCalled()
      expect(restartMock).toHaveBeenCalled()
    })
    it('twice start monitor', async () => {
      isLivingMock.mockReset()
      isLivingMock.mockResolvedValue(true)
      await monitor.startMonitor(500)
      await monitor.startMonitor(500)
      await wait(800)
      expect(isLivingMock).toHaveBeenCalledTimes(1)
    })
  })
})

describe('monitor index', () => {
  beforeEach(() => {
    rpcRequestMock.mockReset()
    stopCkbNodeMock.mockReset()
    asyncPushMock.mockReset()
  })
  it('start ckb monitor', () => {
    startMonitor('ckb', true)
    expect(isDefaultCKBNeedRestartMock).toHaveBeenCalled()
    stopMonitor('ckb')
  })
  it('start indexer monitor', () => {
    startMonitor('ckb-indexer', true)
    expect(rpcRequestMock).toHaveBeenCalled()
    stopMonitor('ckb-indexer')
  })
  it('start and stop all', () => {
    startMonitor(undefined, true)
    expect(isDefaultCKBNeedRestartMock).toHaveBeenCalled()
    expect(rpcRequestMock).toHaveBeenCalled()
    stopMonitor()
    expect(stopCkbNodeMock).toHaveBeenCalled()
    expect(asyncPushMock).toHaveBeenCalledWith(false)
  })
  it('stop-ckb-monitor', () => {
    stopMonitor('ckb')
    expect(stopCkbNodeMock).toHaveBeenCalled()
  })
  it('stop-ckb-indexer-monitor', () => {
    stopMonitor('ckb-indexer')
    expect(asyncPushMock).toHaveBeenCalledWith(false)
  })
})
