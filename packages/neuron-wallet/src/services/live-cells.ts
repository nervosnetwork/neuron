import { getConnection, In } from 'typeorm'
import { hexToBytes } from '@nervosnetwork/ckb-sdk-utils'
import LiveCellEntity from 'database/chain/entities/live-cell'

export default class LiveCellsService {
  // exclude hasData = true and typeScript != null
  public static async getBalance(lockHashes: Set<string>): Promise<{
    liveBalance: Map<string, string>
    sentBalance: Map<string, string>
    pendingBalance: Map<string, string>
  }> {
    const hashData: Buffer[] = []
    lockHashes.forEach((lockHash: string) => hashData.push(Buffer.from(hexToBytes(lockHash))))

    const cells: { usedBlockNumber: string, lockHash: Buffer, sumOfCapacity: string }[] = await getConnection()
      .getRepository(LiveCellEntity)
      .createQueryBuilder('cell')
      .select('cell.lockHash', 'lockHash')
      .addSelect('cell.usedBlockNumber', 'usedBlockNumber')
      .addSelect('CAST(SUM(CAST(cell.capacity AS UNSIGNED BIG INT)) AS VARCHAR)', 'sumOfCapacity')
      .where({
        lockHash: In([...hashData]),
        data: Buffer.from('0x', 'hex'),
        typeHash: null,
      })
      .groupBy('cell.lockHash')
      .addGroupBy('cell.usedBlockNumber')
      .getRawMany()

    const liveBalance = new Map<string, string>()
    const sentBalance = new Map<string, string>()
    const pendingBalance = new Map<string, string>()

    cells.forEach(c => {
      const lockHash: string = `0x${c.lockHash.toString('hex')}`
      const sumOfCapacity: string = c.sumOfCapacity
      if (c.usedBlockNumber === null) {
        liveBalance.set(lockHash, sumOfCapacity)
      } else {
        sentBalance.set(lockHash, sumOfCapacity)
      }
    })

    return {
      liveBalance,
      sentBalance,
      pendingBalance,
    }
  }
}
