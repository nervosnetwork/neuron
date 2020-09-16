import { distinctUntilChanged, sampleTime, flatMap, delay, retry } from 'rxjs/operators'
import { BUNDLED_CKB_URL } from '../../src/utils/const'

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

    stubbedRxjsDebounceTime.mockReturnValue((x: any) => x)
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
    beforeEach(() => {
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
});
