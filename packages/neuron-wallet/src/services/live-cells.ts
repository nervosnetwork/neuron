import { getConnection, In, LessThan, MoreThanOrEqual, Not } from 'typeorm'
import LiveCellEntity from 'database/chain/entities/live-cell'
import { LiveCellPersistor } from 'services/tx/livecell-persistor'

export default class LiveCellsService {
  private static ZERO_BUFFER = Buffer.alloc(0);

  // exclude hasData = true and typeScript != null
  public static async getBalance(lockHashes: Set<string>): Promise<{
    liveBalance: Map<string, string>
    sentBalance: Map<string, string>
    pendingBalance: Map<string, string>
  }> {
    const hashData: Buffer[] = []
    lockHashes.forEach((lockHash: string) => hashData.push(Buffer.from(lockHash.slice(2), 'hex')))

    const lastConfirmBlockNumber = BigInt(await LiveCellPersistor.lastBlockNumber()) - LiveCellPersistor.CONFIRMATION_THRESHOLD

    const liveCells: { lockHash: Buffer, sumOfCapacity: string }[] = await getConnection()
      .getRepository(LiveCellEntity)
      .createQueryBuilder('cell')
      .select('cell.lockHash', 'lockHash')
      .addSelect('CAST(SUM(CAST(cell.capacity AS UNSIGNED BIG INT)) AS VARCHAR)', 'sumOfCapacity')
      .where({
        lockHash: In([...hashData]),
        data: LiveCellsService.ZERO_BUFFER,
        typeHash: null,
        usedBlockNumber: null,
        createdBlockNumber: LessThan(lastConfirmBlockNumber.toString())
      })
      .groupBy('cell.lockHash')
      .getRawMany()
    const pendingCells: { lockHash: Buffer, sumOfCapacity: string }[] = await getConnection()
      .getRepository(LiveCellEntity)
      .createQueryBuilder('cell')
      .select('cell.lockHash', 'lockHash')
      .addSelect('CAST(SUM(CAST(cell.capacity AS UNSIGNED BIG INT)) AS VARCHAR)', 'sumOfCapacity')
      .where({
        lockHash: In([...hashData]),
        data: LiveCellsService.ZERO_BUFFER,
        typeHash: null,
        usedBlockNumber: null,
        createdBlockNumber: MoreThanOrEqual(lastConfirmBlockNumber.toString())
      })
      .groupBy('cell.lockHash')
      .getRawMany()
    const sentCells: { lockHash: Buffer, sumOfCapacity: string }[] = await getConnection()
      .getRepository(LiveCellEntity)
      .createQueryBuilder('cell')
      .select('cell.lockHash', 'lockHash')
      .addSelect('CAST(SUM(CAST(cell.capacity AS UNSIGNED BIG INT)) AS VARCHAR)', 'sumOfCapacity')
      .where({
        lockHash: In([...hashData]),
        data: LiveCellsService.ZERO_BUFFER,
        typeHash: null,
        usedBlockNumber: Not(null)
      })
      .groupBy('cell.lockHash')
      .getRawMany()

    const liveBalance = new Map<string, string>()
    const sentBalance = new Map<string, string>()
    const pendingBalance = new Map<string, string>()

    liveCells.forEach(c => {
      const lockHash: string = `0x${c.lockHash.toString('hex')}`
      liveBalance.set(lockHash, c.sumOfCapacity)
    })
    pendingCells.forEach(c => {
      const lockHash: string = `0x${c.lockHash.toString('hex')}`
      pendingBalance.set(lockHash, c.sumOfCapacity)
    })
    sentCells.forEach(c => {
      const lockHash: string = `0x${c.lockHash.toString('hex')}`
      sentBalance.set(lockHash, c.sumOfCapacity)
    })

    return {
      liveBalance,
      sentBalance,
      pendingBalance,
    }
  }
}
