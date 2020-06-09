import path from 'path'

const stubbedStartForeverFn = jest.fn()
const stubbedTipFn = jest.fn()

const stubbedIndexerConstructor = jest.fn().mockImplementation(
  () => ({
    startForever: stubbedStartForeverFn,
    tip: stubbedTipFn
  })
)

const resetMocks = () => {
  stubbedStartForeverFn.mockReset()
  stubbedTipFn.mockReset()
}

stubbedIndexerConstructor.prototype.reset = function() {
  stubbedStartForeverFn.mockReset()
  stubbedTipFn.mockReset()
}


describe('unit tests for IndexerConnector', () => {
  const nodeUrl = 'http://nodeurl:8114'
  const indexerFolderPath = '/indexer/data/path'
  let IndexerConnector
  beforeEach(() => {
    jest.doMock('@ckb-lumos/indexer', () => {
      return {
        Indexer : stubbedIndexerConstructor
      }
    });
    IndexerConnector = require('../../src/block-sync-renderer/sync/indexer-connector').default
    resetMocks()
    jest.useFakeTimers()

  });

  describe('#constructor', () => {
    describe('when success', () => {
      beforeEach(() => {
        new IndexerConnector(nodeUrl, indexerFolderPath)
      });
      it('init with a node url and indexer folder path', () => {
        expect(stubbedIndexerConstructor).toHaveBeenCalledWith(nodeUrl, path.join(indexerFolderPath))
      });
    });
    describe('when failed', () => {
      it('throws an error when failed to init indexer folder', () => {

      });
      it('throws an error when failed to start indexer', () => {

      })
    })
  });
  describe('#connect', () => {
    const fakeTip1 = {block_number: '1', block_hash: 'hash1'}
    const fakeTip2 = {block_number: '2', block_hash: 'hash2'}
    let indexerConnector
    beforeEach(() => {
      stubbedTipFn.mockReturnValueOnce(fakeTip1)
      stubbedTipFn.mockReturnValueOnce(fakeTip2)
      indexerConnector = new IndexerConnector('', '')
      indexerConnector.connect()
    });
    it('starts indexer', () => {
      expect(stubbedStartForeverFn).toHaveBeenCalled()
    });
    describe('polls for new data', () => {
      describe('#getTransactionSubject(address)', () => {

        describe('check if new transactions are available for an address', () => {
          //Use ckb-indexer's last cursor to facilitate
          describe('when the total count of transactions from indexer is equal to the committed ones from DB', () => {
            it('should not emit new transactions for the address', () => {

            })
          });
          describe('when the total count of transactions from indexer is greater than the committed ones from DB', () => {
            it('emits new transactions for the address', () => {

            });
          });
        });
      });
      describe('#blockTipSubject', () => {
        let blockTipSubject
        let nextBlockTipSubjectSpy
        beforeEach(() => {
          blockTipSubject = indexerConnector.blockTipSubject
          nextBlockTipSubjectSpy = jest.spyOn(indexerConnector.blockTipSubject, 'next')
        });
        describe('when the block tip is higher than previous one', () => {
          it('observed new tips', (done) => {
            blockTipSubject.subscribe(tip => {
              expect(tip).toEqual(fakeTip1)
              done()
            })
          })
        });
      });
      describe('when the block tip is less or equal to previous one', () => {
        it('should not emit new block tip', () => {

        })
      });
    })
  });
  describe('#unsubscribeAll()', () => {
    it('unsubscribe for an address', () => {

    })
  });
  describe('#stop', () => {

  });
  describe('#clearIndexerData', () => {
    it('deletes the indexer data folder based on the current mode environment', () => {

    })
  });
});
