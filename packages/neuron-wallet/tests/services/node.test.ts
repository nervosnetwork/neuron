import { distinctUntilChanged, sampleTime, flatMap, delay, retry } from 'rxjs/operators'
import { BUNDLED_CKB_URL, START_WITHOUT_INDEXER } from '../../src/utils/const'

describe('NodeService', () => {
  let nodeService: any
  const stubbedStartCKBNode = jest.fn()
  const stubbedConnectionStatusSubjectNext = jest.fn()
  const stubbedCKBSetNode = jest.fn()
  const stubbedGetTipBlockNumber = jest.fn()
  const stubbedRxjsDebounceTime = jest.fn()
  const stubbedCKB = jest.fn()
  const stubbedCurrentNetworkIDSubjectSubscribe = jest.fn()
  const stubbedNetworsServiceGet = jest.fn()
  const stubbedLoggerInfo = jest.fn()
  const stubbedLoggerError = jest.fn()
  const existsSyncMock = jest.fn()
  const readFileSyncMock = jest.fn()
  const isPackagedMock = jest.fn()
  const getAppPathMock = jest.fn()
  const showMessageBoxMock = jest.fn()
  const shellMock = jest.fn()
  const startMonitorMock = jest.fn()
  const rpcRequestMock = jest.fn()
  const getChainMock = jest.fn()
  const getLocalNodeInfoMock = jest.fn()

  const fakeHTTPUrl = 'http://fakeurl'
  const fakeHTTPSUrl = 'https://fakeurl'

  const resetMocks = () => {
    stubbedStartCKBNode.mockReset()
    stubbedConnectionStatusSubjectNext.mockReset()
    stubbedCKBSetNode.mockReset()
    stubbedGetTipBlockNumber.mockReset()
    stubbedCKB.mockReset()
    stubbedCurrentNetworkIDSubjectSubscribe.mockReset()
    stubbedNetworsServiceGet.mockReset()
    stubbedLoggerInfo.mockReset()
    stubbedLoggerError.mockReset()
    existsSyncMock.mockReset()
    readFileSyncMock.mockReset()
    isPackagedMock.mockReset()
    getAppPathMock.mockReset()
    showMessageBoxMock.mockReset()
    shellMock.mockReset()
    startMonitorMock.mockReset()
    rpcRequestMock.mockReset()
    getChainMock.mockReset()
    getLocalNodeInfoMock.mockReset()
  }

  beforeEach(() => {
    resetMocks()
    jest.useFakeTimers()

    jest.doMock('../../src/services/ckb-runner', () => {
      return {
        startCkbNode: stubbedStartCKBNode
      }
    })
    jest.doMock('../../src/services/networks', () => {
      return {
        getInstance: () => ({
          get: stubbedNetworsServiceGet,
          getCurrent: stubbedNetworsServiceGet
        }),
      }
    })
    jest.doMock('../../src/models/subjects/node', () => {
      return {
        ConnectionStatusSubject: {
          next: stubbedConnectionStatusSubjectNext
        }
      }
    })
    jest.doMock('../../src/models/subjects/networks', () => {
      return {
        CurrentNetworkIDSubject: {
          subscribe: stubbedCurrentNetworkIDSubjectSubscribe
        }
      }
    })
    jest.doMock('@nervosnetwork/ckb-sdk-core', () => {
      return stubbedCKB
    })
    jest.doMock('rxjs/operators', () => {
      return {
        distinctUntilChanged,
        sampleTime,
        flatMap,
        delay,
        retry,
        debounceTime: stubbedRxjsDebounceTime,
      }
    })
    jest.doMock('../../src/utils/logger', () => {
      return {
        info: stubbedLoggerInfo,
        error: stubbedLoggerError,
      }
    })

    jest.doMock('fs', () => ({
      existsSync: existsSyncMock,
      readFileSync: readFileSyncMock
    }))

    jest.doMock('electron', () => {
      return {
        app: {
          get isPackaged() { return isPackagedMock() },
          getAppPath: getAppPathMock
        },
        dialog: {
          showMessageBox: showMessageBoxMock
        },
        shell: shellMock,
      }
    })

    jest.doMock('../../src/env.ts', () => ({
      app: {
        quit: () => {}
      },
    }))

    jest.doMock('../../src/services/monitor', () => startMonitorMock)

    jest.doMock('../../src/utils/rpc-request', () => ({
      rpcRequest: rpcRequestMock
    }))

    jest.doMock('../../src/services/rpc-service', () => {
      return function() {
        return {
          getChain: getChainMock,
          getLocalNodeInfo: getLocalNodeInfoMock
        }
      }
    })

    stubbedRxjsDebounceTime.mockReturnValue((x: any) => x)
    getChainMock.mockRejectedValue('no chain')
  });

  afterEach(() => {
    jest.clearAllTimers()
  });

  describe('when targets external node', () => {
    beforeEach(async () => {
      stubbedCKB.mockImplementation(() => ({
        setNode: stubbedCKBSetNode,
        rpc: {
          getTipBlockNumber: stubbedGetTipBlockNumber,
        },
        node: {
          url: fakeHTTPUrl
        }
      }))

      const NodeService = require('../../src/services/node').default
      nodeService = new NodeService()

      jest.advanceTimersByTime(1000)
    });
    it('emits disconnected event in ConnectionStatusSubject', () => {
      expect(stubbedConnectionStatusSubjectNext).toHaveBeenCalledWith({
        url: fakeHTTPUrl,
        connected: false,
        isBundledNode: false,
        startedBundledNode: false,
      })
    })
    describe('advance to next event', () => {
      beforeEach(async () => {
        stubbedConnectionStatusSubjectNext.mockReset()
        stubbedGetTipBlockNumber.mockResolvedValueOnce('0x1')
        jest.advanceTimersByTime(1000)
      });
      it('emits connected event in ConnectionStatusSubject', () => {
        expect(stubbedConnectionStatusSubjectNext).toHaveBeenCalledWith({
          url: fakeHTTPUrl,
          connected: true,
          isBundledNode: false,
          startedBundledNode: false,
        })
      })

      describe('got exception when polling CKB RPC', () => {
        beforeEach(async () => {
          stubbedConnectionStatusSubjectNext.mockReset()
          stubbedGetTipBlockNumber.mockRejectedValueOnce(new Error())
          jest.advanceTimersByTime(1000)
        });
        it('emits disconnected event in ConnectionStatusSubject', () => {
          expect(stubbedConnectionStatusSubjectNext).toHaveBeenCalledWith({
            url: fakeHTTPUrl,
            connected: false,
            isBundledNode: false,
            startedBundledNode: false,
          })
        })
      });
    });
  });
  describe('when targets bundled node', () => {
    beforeEach(async () => {
      stubbedCKB.mockImplementation(() => ({
        setNode: stubbedCKBSetNode,
        rpc: {
          getTipBlockNumber: stubbedGetTipBlockNumber,
        },
        node: {
          url: BUNDLED_CKB_URL
        }
      }))

      const NodeService = require('../../src/services/node').default
      nodeService = new NodeService()
      nodeService.verifyNodeVersion = () => {}
      nodeService.verifyStartWithIndexer = () => {}

      stubbedNetworsServiceGet.mockReturnValueOnce({remote: BUNDLED_CKB_URL})
    });
    describe('when node starts', () => {
      beforeEach(async () => {
        stubbedStartCKBNode.mockResolvedValue(true)
        await nodeService.tryStartNodeOnDefaultURI()

        jest.advanceTimersByTime(1000)
      });
      it('emits disconnected event in ConnectionStatusSubject', () => {
        expect(stubbedConnectionStatusSubjectNext).toHaveBeenCalledWith({
          url: BUNDLED_CKB_URL,
          connected: false,
          isBundledNode: true,
          startedBundledNode: false,
        })
      })
      describe('advance to next event', () => {
        beforeEach(async () => {
          stubbedConnectionStatusSubjectNext.mockReset()
          stubbedGetTipBlockNumber.mockResolvedValueOnce('0x1')
          jest.advanceTimersByTime(1000)
        });
        it('emits connected event in ConnectionStatusSubject', () => {
          expect(stubbedConnectionStatusSubjectNext).toHaveBeenCalledWith({
            url: BUNDLED_CKB_URL,
            connected: true,
            isBundledNode: true,
            startedBundledNode: true,
          })
        })

        describe('got exception when polling CKB RPC', () => {
          beforeEach(async () => {
            stubbedConnectionStatusSubjectNext.mockReset()
            stubbedGetTipBlockNumber.mockRejectedValueOnce(new Error())
            jest.advanceTimersByTime(1000)
          });
          it('emits disconnected event in ConnectionStatusSubject', () => {
            expect(stubbedConnectionStatusSubjectNext).toHaveBeenCalledWith({
              url: BUNDLED_CKB_URL,
              connected: false,
              isBundledNode: true,
              startedBundledNode: true,
            })
          })
        });
      });
    });
    describe('when node failed to start', () => {
      beforeEach(async () => {
        stubbedStartCKBNode.mockRejectedValue(new Error())
        await nodeService.tryStartNodeOnDefaultURI()
      });
      it('logs error', () => {
        expect(stubbedLoggerInfo).toHaveBeenCalledWith('CKB:	fail to start bundled CKB with error:')
        expect(stubbedLoggerError).toHaveBeenCalledWith(new Error())
      });
      it('emits disconnected event in ConnectionStatusSubject', () => {
        expect(stubbedConnectionStatusSubjectNext).toHaveBeenCalledWith({
          url: BUNDLED_CKB_URL,
          connected: false,
          isBundledNode: true,
          startedBundledNode: false,
        })
      })
    });
  });
  describe('CurrentNetworkIDSubject#subscribe', () => {
    let eventCallback: any
    const stubbedTipNumberSubjectCallback = jest.fn()
    beforeEach(async () => {
      stubbedCKB.mockImplementation(() => ({
        setNode: stubbedCKBSetNode,
        rpc: {
          getTipBlockNumber: stubbedGetTipBlockNumber,
        },
        node: {
          url: fakeHTTPUrl
        }
      }))

      const NodeService = require('../../src/services/node').default
      nodeService = new NodeService()
      nodeService.tipNumberSubject.subscribe(stubbedTipNumberSubjectCallback)
      nodeService.verifyNodeVersion = () => {}
      nodeService.verifyStartWithIndexer = () => {}
      eventCallback = stubbedCurrentNetworkIDSubjectSubscribe.mock.calls[0][0]
    });
    it('emits disconnected event in ConnectionStatusSubject', () => {
      expect(stubbedConnectionStatusSubjectNext).toHaveBeenCalledWith({
        url: fakeHTTPUrl,
        connected: false,
        isBundledNode: false,
        startedBundledNode: false,
      })
    })
    it('resets tip block number', () => {
      expect(stubbedTipNumberSubjectCallback).toHaveBeenCalledWith('0')
    })
    describe('targets to bundled node', () => {
      const bundledNodeUrl = 'http://localhost:8114'
      beforeEach(async () => {
        stubbedCKBSetNode.mockImplementation(() => {
          nodeService.ckb.node.url = bundledNodeUrl
        })
        stubbedStartCKBNode.mockResolvedValue(true)
        stubbedNetworsServiceGet.mockReturnValue({remote: bundledNodeUrl})
        await nodeService.tryStartNodeOnDefaultURI()

        await eventCallback({currentNetworkID: 'network1'})
        jest.advanceTimersByTime(10000)
      });
      it('sets startedBundledNode to true in ConnectionStatusSubject', () => {
        expect(stubbedConnectionStatusSubjectNext).toHaveBeenCalledWith({
          url: bundledNodeUrl,
          connected: false,
          isBundledNode: true,
          startedBundledNode: true,
        })
      })
      describe('switches to other network', () => {
        beforeEach(async () => {
          stubbedConnectionStatusSubjectNext.mockReset()
          stubbedCKBSetNode.mockImplementation(() => {
            nodeService.ckb.node.url = fakeHTTPUrl
          })

          await eventCallback({currentNetworkID: 'network2'})
          jest.advanceTimersByTime(10000)
        });
        it('sets startedBundledNode to true in ConnectionStatusSubject', () => {
          expect(stubbedConnectionStatusSubjectNext).toHaveBeenCalledWith({
            url: fakeHTTPUrl,
            connected: false,
            isBundledNode: false,
            startedBundledNode: false,
          })
        })
      });
    });
    describe('with http url', () => {
      beforeEach(async () => {
        stubbedNetworsServiceGet.mockReturnValueOnce({remote: fakeHTTPUrl})
        await eventCallback({currentNetworkID: 'test'})
      });
      it('sets http agent', () => {
        expect(stubbedCKBSetNode).toHaveBeenCalledWith(
          expect.objectContaining({
            url: fakeHTTPUrl,
            httpAgent: expect.anything()
          })
        )
      });
    });
    describe('with https url', () => {
      beforeEach(async () => {
        stubbedNetworsServiceGet.mockReturnValueOnce({remote: fakeHTTPSUrl})
        await eventCallback({currentNetworkID: 'test'})
      });
      it('sets https agent', () => {
        expect(stubbedCKBSetNode).toHaveBeenCalledWith(
          expect.objectContaining({
            url: fakeHTTPSUrl,
            httpsAgent: expect.anything()
          })
        )
      });
    });
    describe('with invalid url', () => {
      beforeEach(() => {
        stubbedNetworsServiceGet.mockReturnValueOnce({remote: 'invalidurl'})
      });
      it('throws error', async () => {
        let err
        try {
          await eventCallback({currentNetworkID: 'test'})
        } catch (error) {
          err = error
        }
        expect(err).toEqual(new Error('Protocol of url should be specified'))
      });
    });
    describe('when url is not a string', () => {
      beforeEach(() => {
        stubbedNetworsServiceGet.mockReturnValueOnce({remote: {}})
      });
      it('throws error', async () => {
        let err
        try {
          await eventCallback({currentNetworkID: 'test'})
        } catch (error) {
          err = error
        }
        expect(err).toEqual(new Error('should-be-type-of'))
      });
    });
  });
  describe('test get node version', () => {
    beforeEach(() => {
      const NodeService = require('../../src/services/node').default
      nodeService = new NodeService()
    })
    it('no exist version file', () => {
      existsSyncMock.mockReturnValue(false)
      expect(nodeService.getInternalNodeVersion()).toBeUndefined()
    })
    it('exist version file but read error', () => {
      existsSyncMock.mockReturnValue(true)
      readFileSyncMock.mockReturnValue(new Error('read failed'))
      expect(nodeService.getInternalNodeVersion()).toBeUndefined()
      expect(stubbedLoggerError).toBeCalledWith('App\t: get ckb node version failed')
    })
    it('exist version file with new line', () => {
      existsSyncMock.mockReturnValue(true)
      readFileSyncMock.mockReturnValue("v0.107.0\n")
      expect(nodeService.getInternalNodeVersion()).toBe('v0.107.0')
    })
    it('exist version file without new line', () => {
      existsSyncMock.mockReturnValue(true)
      readFileSyncMock.mockReturnValue("v0.107.0")
      expect(nodeService.getInternalNodeVersion()).toBe('v0.107.0')
    })
  })
  describe('test verify node version', () => {
    beforeEach(() => {
      const NodeService = require('../../src/services/node').default
      nodeService = new NodeService()
      stubbedNetworsServiceGet.mockReturnValueOnce({remote: BUNDLED_CKB_URL})
    })
    it('get internal version failed', async () => {
      existsSyncMock.mockReturnValue(false)
      await nodeService.verifyNodeVersion()
      expect(showMessageBoxMock).toBeCalledTimes(0)
    })
    it('get internal version success and same', async () => {
      existsSyncMock.mockReturnValue(true)
      readFileSyncMock.mockReturnValue("v0.107.0")
      getLocalNodeInfoMock.mockResolvedValue({ version: '0.107.0 (30e1255 2023-01-30)' })
      await nodeService.verifyNodeVersion()
      expect(showMessageBoxMock).toBeCalledTimes(0)
    })
    it('get internal version success and not same', async () => {
      existsSyncMock.mockReturnValue(true)
      readFileSyncMock.mockReturnValue("v0.107.0")
      getLocalNodeInfoMock.mockResolvedValue({ version: '0.108.0 (30e1255 2023-01-30)' })
      await nodeService.verifyNodeVersion()
      expect(showMessageBoxMock).toBeCalledTimes(1)
    })
  })
  describe('test verify start with indexer', () => {
    beforeEach(() => {
      const NodeService = require('../../src/services/node').default
      nodeService = new NodeService()
      stubbedNetworsServiceGet.mockReturnValueOnce({remote: BUNDLED_CKB_URL})
    })
    it('start with indexer', async () => {
      rpcRequestMock.mockResolvedValue({})
      await nodeService.verifyStartWithIndexer()
      expect(showMessageBoxMock).toBeCalledTimes(0)
    })
    it('start without indexer', async () => {
      rpcRequestMock.mockResolvedValue({ error: { code: START_WITHOUT_INDEXER }})
      await nodeService.verifyStartWithIndexer()
      expect(showMessageBoxMock).toBeCalledTimes(1)
    })
    it('get indexer rpc failed', async () => {
      rpcRequestMock.mockRejectedValue('get tip header error')
      await nodeService.verifyStartWithIndexer()
      expect(showMessageBoxMock).toBeCalledTimes(1)
    })
  })
});
