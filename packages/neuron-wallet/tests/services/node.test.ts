import { distinctUntilChanged, sampleTime, flatMap, delay, retry } from 'rxjs/operators'
import { NetworkType } from '../../src/models/network'
import { BUNDLED_CKB_URL } from '../../src/utils/const'

describe('NodeService', () => {
  let nodeService: any
  const stubbedStartCKBNode = jest.fn()
  const stubbedStopCkbNode = jest.fn()
  const stubbedStartLightNode = jest.fn()
  const stubbedStopLightNode = jest.fn()
  const stubbedConnectionStatusSubjectNext = jest.fn()
  const stubbedCKBSetNode = jest.fn()
  const stubbedGetTipBlockNumber = jest.fn()
  const stubbedRxjsDebounceTime = jest.fn()
  const stubbedCurrentNetworkIDSubjectSubscribe = jest.fn()
  const stubbedNetworsServiceGet = jest.fn()
  const stubbedLoggerInfo = jest.fn()
  const stubbedLoggerError = jest.fn()

  const fakeHTTPUrl = 'http://fakeurl'

  const resetMocks = () => {
    stubbedStartCKBNode.mockReset()
    stubbedStopCkbNode.mockReset()
    stubbedConnectionStatusSubjectNext.mockReset()
    stubbedCKBSetNode.mockReset()
    stubbedGetTipBlockNumber.mockReset()
    stubbedCurrentNetworkIDSubjectSubscribe.mockReset()
    stubbedNetworsServiceGet.mockReset()
    stubbedLoggerInfo.mockReset()
    stubbedLoggerError.mockReset()
    stubbedStartLightNode.mockReset()
    stubbedStopLightNode.mockReset()
  }

  beforeEach(() => {
    resetMocks()
    jest.useFakeTimers()

    jest.doMock('../../src/services/ckb-runner', () => {
      return {
        startCkbNode: stubbedStartCKBNode,
        stopCkbNode: stubbedStopCkbNode,
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
    jest.doMock('../../src/utils/ckb-rpc', () => {
      return {
        generateRPC() {
          return {
            getTipBlockNumber: stubbedGetTipBlockNumber,
          }
        }
      }
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

    jest.doMock('../../src/services/light-runner', () => {
      return {
        CKBLightRunner: {
          getInstance() {
            return {
              start: stubbedStartLightNode,
              stop: stubbedStopLightNode,
            }
          }
        }
      }
    })

    stubbedRxjsDebounceTime.mockReturnValue((x: any) => x)
  });

  afterEach(() => {
    jest.clearAllTimers()
  });

  describe('when targets external node', () => {
    beforeEach(async () => {
      const NodeService = require('../../src/services/node').default
      nodeService = new NodeService()

      jest.advanceTimersByTime(1000)
    });
    it('emits disconnected event in ConnectionStatusSubject', () => {
      expect(stubbedConnectionStatusSubjectNext).toHaveBeenCalledWith({
        url: nodeService.nodeUrl,
        connected: false,
        isBundledNode: false,
        startedBundledNode: false,
      })
    })
    describe('advance to next event', () => {
      beforeEach(async () => {
        nodeService.setNetwork(fakeHTTPUrl)
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
      const NodeService = require('../../src/services/node').default
      nodeService = new NodeService()
      stubbedNetworsServiceGet.mockReturnValue({remote: BUNDLED_CKB_URL})
    });
    describe('when node starts', () => {
      beforeEach(async () => {
        stubbedStartCKBNode.mockResolvedValue(true)
        await nodeService.tryStartNodeOnDefaultURI()

        jest.advanceTimersByTime(1000)
      });
      it('emits disconnected event in ConnectionStatusSubject', () => {
        expect(stubbedConnectionStatusSubjectNext).toHaveBeenLastCalledWith({
          url: nodeService.nodeUrl,
          connected: false,
          isBundledNode: false,
          startedBundledNode: false,
        })
      })
      describe('advance to next event', () => {
        beforeEach(async () => {
          nodeService.setNetwork(BUNDLED_CKB_URL)
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
          url: nodeService.nodeUrl,
          connected: false,
          isBundledNode: false,
          startedBundledNode: false,
        })
      })
    });
    describe('start light node', () => {
      it('start light node', async () => {
        stubbedNetworsServiceGet.mockReturnValueOnce({type: NetworkType.Light})
        await nodeService.startNode()
        expect(stubbedStartLightNode).toBeCalled()
        expect(stubbedStopCkbNode).toBeCalled()
      })
    })
  });
  describe('CurrentNetworkIDSubject#subscribe', () => {
    let eventCallback: any
    const stubbedTipNumberSubjectCallback = jest.fn()
    beforeEach(async () => {
      const NodeService = require('../../src/services/node').default
      nodeService = new NodeService()
      nodeService.tipNumberSubject.subscribe(stubbedTipNumberSubjectCallback)

      eventCallback = stubbedCurrentNetworkIDSubjectSubscribe.mock.calls[0][0]
    });
    it('emits disconnected event in ConnectionStatusSubject', () => {
      expect(stubbedConnectionStatusSubjectNext).toHaveBeenCalledWith({
        url: nodeService.nodeUrl,
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
          stubbedNetworsServiceGet.mockReturnValue({remote: fakeHTTPUrl})
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
});
