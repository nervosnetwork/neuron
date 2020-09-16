// import NodeService from "../../src/services/node";
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

  const fakeCKBUrl = 'fakeurl'

  const resetMocks = () => {
    stubbedStartCKBNode.mockReset()
    stubbedConnectionStatusSubjectNext.mockReset()
    stubbedCKBSetNode.mockReset()
    stubbedGetTipBlockNumber.mockReset()
    // stubbedCKB.mockReset()
  }

  beforeEach(() => {
    resetMocks()
    jest.useFakeTimers()

    jest.doMock('../../src/services/ckb-runner', () => {
      return {
        startCkbNode: stubbedStartCKBNode
      }
    })
    jest.doMock('../../src/models/subjects/node', () => {
      return {
        ConnectionStatusSubject: {
          next: stubbedConnectionStatusSubjectNext
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
          url: fakeCKBUrl
        }
      }))

      const NodeService = require('../../src/services/node').default
      nodeService = new NodeService()

      jest.advanceTimersByTime(1000)
    });
    it('emits disconnected event in ConnectionStatusSubject', () => {
      expect(stubbedConnectionStatusSubjectNext).toHaveBeenCalledWith({
        url: fakeCKBUrl,
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
          url: fakeCKBUrl,
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
            url: fakeCKBUrl,
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
  describe('CurrentNetworkIDSubject#subscribe', () => {
    describe('#setNetwork', () => {

    });
  })
});
