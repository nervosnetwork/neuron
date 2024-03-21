import { getConnection } from '../database/chain/connection'
import AmendTransactionEntity from '../database/chain/entities/amend-transaction'

export default class AmendTransactionService {
  static async save(hash: string, amendHash: string) {
    const exist = await getConnection().getRepository(AmendTransactionEntity).findOne({
      hash,
      amendHash,
    })
    if (exist) {
      return
    }

    const amendTransactionEntity = AmendTransactionEntity.fromObject({
      hash,
      amendHash,
    })

    return await getConnection().manager.save(amendTransactionEntity)
  }
}
