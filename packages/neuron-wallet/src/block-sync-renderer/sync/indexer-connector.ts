import {ReplaySubject} from 'rxjs'
import CommonUtils from 'utils/common'
import { Indexer, Tip } from '@ckb-lumos/indexer'

export default class IndexerConnector {
  private indexer: Indexer
  private stop: boolean = true
  public blockTipSubject: ReplaySubject<Tip> = new ReplaySubject<Tip>(3)

  constructor(nodeUrl: string, indexerFolderPath: string) {
    this.indexer = new Indexer(nodeUrl, indexerFolderPath)
  }

  public async connect() {
    this.indexer.startForever()
    this.stop = false
    while (!this.stop) {
      try {
        const lastIndexerTip = this.indexer.tip()
        this.blockTipSubject.next(lastIndexerTip)

        //loop through address map
        //poll transaction hashes by lock hashes
        //compare transaction hashes with the local cache
        //push new transactions through rxjs subject if size different


      } catch (error) {
        console.error(error)
      } finally {
        await CommonUtils.sleep(1000)
      }
    }
  }

  public async addTransactionSubjectByAddress(address: string) {
    //parse address to lock script
    //create a rxjs subject
    //add (address, lockscript, subject) to a map
    //return subject
  }
}
// const depositTxs = await getConnection()
//           .getRepository(TransactionEntity)
//           .createQueryBuilder('tx')
//           .where({
//             hash: In(depositTxHashes)
//           })
//           .getMany()
