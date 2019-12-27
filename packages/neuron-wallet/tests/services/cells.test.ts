import { getConnection } from 'typeorm'
import { initConnection } from '../../src/database/chain/ormconfig'
import OutputEntity from '../../src/database/chain/entities/output'
import { OutputStatus } from '../../src/services/tx/params'
import CellsService from '../../src/services/cells'
import { CapacityNotEnough, CapacityNotEnoughForChange, LiveCapacityNotEnough } from '../../src/exceptions/wallet'
import TransactionEntity from '../../src/database/chain/entities/transaction'
import TransactionSize from '../../src/models/transaction-size'
import TransactionFee from '../../src/models/transaction-fee'
import { ScriptHashType, ScriptInterface } from '../../src/models/chain/script'

const randomHex = (length: number = 64): string => {
  const str: string = Array.from({ length })
    .map(() => Math.floor(Math.random() * 16).toString(16))
    .join('')

  return `0x${str}`
}

describe('CellsService', () => {
  beforeAll(async () => {
    await initConnection('0x1234')
  })

  afterAll(async () => {
    await getConnection().close()
  })

  beforeEach(async () => {
    const connection = getConnection()
    await connection.synchronize(true)
  })

  const bob = {
    lockScript: {
      codeHash: '0x1892ea40d82b53c678ff88312450bbb17e164d7a3e0a90941aa58839f56f8df2',
      args: '0x36c329ed630d6ce750712a477543672adab57f4c',
      hashType: ScriptHashType.Type,
    },
    lockHash: '0xecaeea8c8581d08a3b52980272001dbf203bc6fa2afcabe7cc90cc2afff488ba',
    address: 'ckt1qyqrdsefa43s6m882pcj53m4gdnj4k440axqswmu83',
    blake160: '0x36c329ed630d6ce750712a477543672adab57f4c',
  }

  const alice = {
    lockScript: {
      codeHash: '0x1892ea40d82b53c678ff88312450bbb17e164d7a3e0a90941aa58839f56f8df2',
      args: '0xe2193df51d78411601796b35b17b4f8f2cd85bd0',
      hashType: ScriptHashType.Type,
    },
    lockHash: '0x489306d801d54bee2d8562ae20fdc53635b568f8107bddff15bb357f520cc02c',
    address: 'ckt1qyqwyxfa75whssgkq9ukkdd30d8c7txct0gqfvmy2v',
    blake160: '0xe2193df51d78411601796b35b17b4f8f2cd85bd0',
  }

  const generateCell = (
    capacity: string,
    status: OutputStatus,
    hasData: boolean,
    typeScript: ScriptInterface | null,
    who: any = bob,
    daoData: string | null = null,
    transaction: TransactionEntity | null = null
  ) => {
    const output = new OutputEntity()
    output.outPointTxHash = randomHex()
    output.outPointIndex = '0'
    output.capacity = capacity
    output.lock = who.lockScript
    output.lockHash = who.lockHash
    output.status = status
    output.hasData = hasData
    output.typeScript = typeScript
    output.daoData = daoData
    if (transaction) {
      output.transaction = transaction
    }

    return output
  }

  const createCell = async (
    capacity: string,
    status: OutputStatus,
    hasData: boolean,
    typeScript: ScriptInterface | null,
    who: any = bob
  ) => {
    const cell = generateCell(capacity, status, hasData, typeScript, who)
    await getConnection().manager.save(cell)
    return cell
  }

  const typeScript = new Script({
    codeHash: randomHex(),
    args: '',
    hashType: ScriptHashType.Data,
  })

  it('getLiveCell', async () => {
    const capacity = '1000'
    const entity = await createCell(capacity, OutputStatus.Live, false, null)
    const outPoint = entity.outPoint()
    const cell = await CellsService.getLiveCell(outPoint)
    expect(cell!.capacity).toEqual(capacity)
  })

  it('getLiveCell in Sent', async () => {
    const capacity = '1000'
    const entity = await createCell(capacity, OutputStatus.Sent, false, null)
    const outPoint = entity.outPoint()
    const cell = await CellsService.getLiveCell(outPoint)
    expect(cell).toBeUndefined()
  })

  it('allBlake160s', async () => {
    await createCell('1000', OutputStatus.Sent, false, null)
    await createCell('1000', OutputStatus.Sent, false, null)
    const blake160s = await CellsService.allBlake160s()
    expect(blake160s).toEqual([bob.blake160])
  })

  const lockHashes = [bob.lockHash]

  describe('getBalance', () => {
    const createCells = async () => {
      const cells: OutputEntity[] = [
        generateCell('100', OutputStatus.Live, false, null),
        generateCell('200', OutputStatus.Sent, false, null),
        generateCell('300', OutputStatus.Pending, false, null),
        generateCell('400', OutputStatus.Dead, false, null),
        generateCell('1000', OutputStatus.Live, true, null),
        generateCell('2000', OutputStatus.Sent, true, null),
        generateCell('3000', OutputStatus.Pending, true, null),
        generateCell('4000', OutputStatus.Dead, true, null),
        generateCell('10000', OutputStatus.Live, false, typeScript),
        generateCell('20000', OutputStatus.Sent, false, typeScript),
        generateCell('30000', OutputStatus.Pending, false, typeScript),
        generateCell('40000', OutputStatus.Dead, false, typeScript),
      ]
      await getConnection().manager.save(cells)
    }

    it('getBalance, Live, skip', async () => {
      await createCells()

      const balance: string = await CellsService.getBalance(lockHashes, OutputStatus.Live)
      expect(balance).toEqual('100')
    })

    it('getBalance, Sent, skip', async () => {
      await createCells()

      const balance: string = await CellsService.getBalance(lockHashes, OutputStatus.Sent)
      expect(balance).toEqual('200')
    })

    it('getBalance with alice', async () => {
      await createCells()
      await createCell('2222', OutputStatus.Live, false, null, alice)

      const balance: string = await CellsService.getBalance([alice.lockHash, bob.lockHash], OutputStatus.Live)
      expect(balance).toEqual((100 + 2222).toString())
    })

    it(`get alice's balance`, async () => {
      await createCells()
      await createCell('2222', OutputStatus.Live, false, null, alice)

      const balance: string = await CellsService.getBalance([alice.lockHash], OutputStatus.Live)
      expect(balance).toEqual('2222')
    })
  })

  describe('gatherInputs', () => {
    const toShannon = (ckb: string) => `${ckb}00000000`
    const createCells = async () => {
      const cells: OutputEntity[] = [
        generateCell(toShannon('1000'), OutputStatus.Live, false, null),
        generateCell(toShannon('200'), OutputStatus.Sent, false, null),
        generateCell(toShannon('2000'), OutputStatus.Live, true, null),
        generateCell(toShannon('3000'), OutputStatus.Live, false, typeScript),
      ]
      await getConnection().manager.save(cells)
    }

    it('1000, skip', async () => {
      await createCells()

      const result = await CellsService.gatherInputs(
        toShannon('1000'),
        lockHashes
      )

      expect(result.capacities).toEqual('100000000000')
    })

    it('1001, LiveCapacityNotEnough', async () => {
      await createCells()

      let error
      try {
        await CellsService.gatherInputs(
          toShannon('1001'),
          lockHashes
        )
      } catch (e) {
        error = e
      }
      expect(error).toBeInstanceOf(LiveCapacityNotEnough)
    })

    it('1140, LiveCapacityNotEnough', async () => {
      await createCells()

      let error
      try {
        await CellsService.gatherInputs(
          toShannon('1140'),
          lockHashes
        )
      } catch (e) {
        error = e
      }
      expect(error).toBeInstanceOf(LiveCapacityNotEnough)
    })

    it('1200, LiveCapacityNotEnough', async () => {
      await createCells()

      let error
      try {
        await CellsService.gatherInputs(
          toShannon('1200'),
          lockHashes
        )
      } catch (e) {
        error = e
      }
      expect(error).toBeInstanceOf(LiveCapacityNotEnough)
    })

    it('1201, skip', async () => {
      await createCells()

      let error
      try {
        await CellsService.gatherInputs(
          toShannon('1201'),
          lockHashes
        )
      } catch (e) {
        error = e
      }
      expect(error).toBeInstanceOf(CapacityNotEnough)
    })

    it(`bob's and alice's cells`, async () => {
      await createCells()
      await createCell(toShannon('5000'), OutputStatus.Live, false, null, alice)

      const result = await CellsService.gatherInputs(
        toShannon('6000'),
        [alice.lockHash, bob.lockHash]
      )

      expect(result.capacities).toEqual('600000000000')
    })

    it(`only bob's cells`, async () => {
      await createCells()
      await createCell(toShannon('5000'), OutputStatus.Live, false, null, alice)

      let error
      try {
        await CellsService.gatherInputs(
          toShannon('1001'),
          [bob.lockHash]
        )
      } catch (e) {
        error = e
      }

      expect(error).toBeInstanceOf(LiveCapacityNotEnough)
    })

    it('capacity not enough for change', async () => {
      await createCell(toShannon('100'), OutputStatus.Live, false, null)
      let error
      try {
        await CellsService.gatherInputs(
          toShannon('77'),
          [bob.lockHash]
        )
      } catch (e) {
        error = e
      }

      expect(error).toBeInstanceOf(CapacityNotEnoughForChange)
    })

    it('capacity 0, feeRate 1000, no cells', async () => {
      let error
      try {
        await CellsService.gatherInputs(
          '0',
          [alice.lockHash, bob.lockHash],
          '0',
          '1000'
        )
      } catch (e) {
        error = e
      }

      expect(error).toBeInstanceOf(CapacityNotEnough)
    })

    it('capacity 0, fee 1000, no cells', async () => {
      let error
      try {
        await CellsService.gatherInputs(
          '0',
          [alice.lockHash, bob.lockHash],
          '1000'
        )
      } catch (e) {
        error = e
      }

      expect(error).toBeInstanceOf(CapacityNotEnough)
    })

    describe('skip, by feeRate 1000', () => {
      beforeEach(async done => {
        const cells: OutputEntity[] = [
          generateCell(toShannon('1000'), OutputStatus.Live, false, null),
          generateCell(toShannon('2000'), OutputStatus.Live, false, null),
        ]
        await getConnection().manager.save(cells)
        done()
      })

      it('capacity 500', async () => {
        const feeRate = '1000'
        const result = await CellsService.gatherInputs(
          toShannon('500'),
          [bob.lockHash],
          '0',
          feeRate
        )
        expect(result.capacities).toEqual(toShannon('1000'))
        const expectedSize = TransactionSize.input() + TransactionSize.secpLockWitness()
        expect(BigInt(result.finalFee)).toEqual(TransactionFee.fee(expectedSize, BigInt(feeRate)))
      })

      it('capacity 1000', async () => {
        const feeRate = '1000'
        const result = await CellsService.gatherInputs(
          toShannon('1000'),
          [bob.lockHash],
          '0',
          feeRate
        )
        const expectedSize = 2 * TransactionSize.input() + TransactionSize.secpLockWitness()+ TransactionSize.emptyWitness()
        expect(result.capacities).toEqual(toShannon('3000'))
        expect(BigInt(result.finalFee)).toEqual(TransactionFee.fee(expectedSize, BigInt(feeRate)))
      })

      it('capacity 1000 - inputFee', async () => {
        const feeRate = '1000'
        const inputSize = TransactionSize.input() + TransactionSize.secpLockWitness()
        const expectedFee = TransactionFee.fee(inputSize, BigInt(feeRate))

        const capacity = BigInt(1000 * 10**8) - expectedFee
        const result = await CellsService.gatherInputs(
          capacity.toString(),
          [bob.lockHash],
          '0',
          feeRate
        )
        expect(result.capacities).toEqual(toShannon('1000'))
        expect(BigInt(result.finalFee)).toEqual(expectedFee)
      })

      it('capacity 1000 - inputFee + 1 shannon', async () => {
        const feeRate = '1000'
        const inputSize = TransactionSize.input() + TransactionSize.secpLockWitness()
        const inputFee = TransactionFee.fee(inputSize, BigInt(feeRate))

        const capacity = BigInt(1000 * 10**8) - inputFee + BigInt(1)
        const result = await CellsService.gatherInputs(
          capacity.toString(),
          [bob.lockHash],
          '0',
          feeRate
        )
        expect(result.capacities).toEqual(toShannon('3000'))
        const expectedSize = TransactionSize.input() * 2 + TransactionSize.secpLockWitness() + TransactionSize.emptyWitness()
        const expectedFee = TransactionFee.fee(expectedSize, BigInt(feeRate))
        expect(BigInt(result.finalFee)).toEqual(expectedFee)
      })
    })

    describe('getDaoCells', () => {
      const depositData = '0x0000000000000000'
      const step1Data = '0x000000000000000a'
      const generateTx = (hash: string, timestamp: string) => {
        const tx = new TransactionEntity()
        tx.hash = hash
        tx.version = '0x0'
        tx.timestamp = timestamp
        tx.status = TransactionStatus.Success
        tx.witnesses = []
        tx.blockNumber = '1'
        tx.blockHash = '0x10'
        return tx
      }
      beforeEach(async done => {
        const tx1 = generateTx('0x1234', '1572862777481')
        const tx2 = generateTx('0x5678', '1572862829087')
        const cells: OutputEntity[] = [
          generateCell(toShannon('1000'), OutputStatus.Live, false, null, bob, depositData, tx1),
          generateCell(toShannon('2000'), OutputStatus.Live, false, null, bob, step1Data, tx1),
          generateCell(toShannon('3000'), OutputStatus.Live, false, null, bob, depositData, tx2),
          generateCell(toShannon('4000'), OutputStatus.Live, false, null, bob, step1Data, tx2),
        ]
        await getConnection().manager.save([tx1, tx2, ...cells])
        done()
      })

      it('get all in correct order', async () => {
        const cells = await CellsService.getDaoCells(
          [bob.lockHash],
        )
        const expectedCapacitySort = [
          '2000',
          '4000',
          '1000',
          '3000',
        ].map(capacity => toShannon(capacity))
        expect(cells.map(c => c.capacity)).toEqual(expectedCapacitySort)
      })

      it('make sure timestamp/blockNumber/blockHash', async () => {
        const cells = await CellsService.getDaoCells(
          [bob.lockHash],
        )
        const firstCell = cells[0]!
        expect(firstCell.timestamp).toBeDefined()
        expect(firstCell.blockNumber).toBeDefined()
        expect(firstCell.blockHash).toBeDefined()
      })
    })
  })
})
