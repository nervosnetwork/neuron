import { getConnection } from 'typeorm'
import { initConnection } from '../../../src/database/chain/ormconfig'
import { ScriptHashType, Script, TransactionWithoutHash } from '../../../src/types/cell-types'
import { OutputStatus } from '../../../src/services/tx/params'
import OutputEntity from '../../../src/database/chain/entities/output'
import TransactionGenerator from '../../../src/services/tx/transaction-generator'
import LockUtils from '../../../src/models/lock-utils'
import CellsService from '../../../src/services/cells'
import DaoUtils from 'models/dao-utils'

const systemScript = {
  outPoint: {
    txHash: '0xb815a396c5226009670e89ee514850dcde452bca746cdd6b41c104b50e559c70',
    index: '0',
  },
  codeHash: '0x9bd7e06f3ecf4be0f2fcd2188b23f1b9fcc88e5d4b65a8637b17723bbda3cce8',
  hashType: ScriptHashType.Type,
}

const daoScript = {
  outPoint: {
    txHash: '0xa563884b3686078ec7e7677a5f86449b15cf2693f3c1241766c6996f206cc541',
    index: '2',
  },
  codeHash: '0x82d76d1b75fe2fd9a27dfbaa65a039221a380d76c926f378d3f81cf3e7e13f2e',
  hashType: ScriptHashType.Type,
}

const randomHex = (length: number = 64): string => {
  const str: string = Array.from({ length })
    .map(() => Math.floor(Math.random() * 16).toString(16))
    .join('')

  return `0x${str}`
}

const toShannon = (ckb: string) => `${ckb}00000000`

describe('TransactionGenerator', () => {
  beforeAll(async () => {
    await initConnection('0x1234')
    const mockContractInfo = jest.fn()
    mockContractInfo.mockReturnValue(systemScript)
    LockUtils.systemScript = mockContractInfo.bind(LockUtils)

    const mockDaoScriptInfo = jest.fn()
    mockDaoScriptInfo.mockReturnValue(daoScript)
    DaoUtils.daoScript = mockDaoScriptInfo.bind(DaoUtils)
  })

  afterAll(async () => {
    await getConnection().close()
  })

  const generateCell = (
    capacity: string,
    status: OutputStatus,
    hasData: boolean,
    typeScript: Script | null,
    who: any = bob
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

    return output
  }

  beforeEach(async done => {
    const connection = getConnection()
    await connection.synchronize(true)
    done()
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

  const calculateFee = (outputLength: number, inputLength: number, feeRate: bigint): bigint => {
    // @ts-ignore: Private method
    return TransactionGenerator.txFee(
      // @ts-ignore: Private methods
      TransactionGenerator.txSerializedSizeInBlockWithoutInputs(
        outputLength
      ),
      feeRate
    ) + CellsService.everyInputFee(feeRate) * BigInt(inputLength)
  }

  it('txSerializedSizeInBlockWithoutInputs', () => {
    expect(
      // @ts-ignore: Private method
      TransactionGenerator.txSerializedSizeInBlockWithoutInputs(2)
    ).toEqual(327)
  })

  it('txFee without carry', () => {
    expect(
      // @ts-ignore: Private method
      TransactionGenerator.txFee(1035, BigInt(1000))
    ).toEqual(BigInt(1035))
  })

  it('txFee with carry', () => {
    expect(
      // @ts-ignore: Private method
      TransactionGenerator.txFee(1035, BigInt(900))
    ).toEqual(BigInt(932))
  })

  describe('generateTx', () => {
    beforeEach(async done => {
      const cells: OutputEntity[] = [
        generateCell(toShannon('1000'), OutputStatus.Live, false, null),
        generateCell(toShannon('2000'), OutputStatus.Live, false, null),
      ]
      await getConnection().manager.save(cells)
      done()
    })

    describe('with feeRate 1000', () => {
      it('capacity 500', async () => {
        const feeRate = '1000'
        const tx: TransactionWithoutHash = await TransactionGenerator.generateTx(
          [bob.lockHash],
          [
            {
              address: bob.address,
              capacity: toShannon('500'),
            }
          ],
          bob.address,
          '0',
          feeRate
        )

        const inputCapacities = tx.inputs!
          .map(input => BigInt(input.capacity))
          .reduce((result, c) => result + c, BigInt(0))
        const outputCapacities = tx.outputs!
          .map(output => BigInt(output.capacity))
          .reduce((result, c) => result + c, BigInt(0))

        // @ts-ignore: Private method
        const expectedFee: bigint = calculateFee(2, 1, BigInt(feeRate))
        expect(inputCapacities - outputCapacities).toEqual(expectedFee)
      })

      it('capacity 1000', async () => {
        const feeRate = '1000'
        const tx: TransactionWithoutHash = await TransactionGenerator.generateTx(
          [bob.lockHash],
          [
            {
              address: bob.address,
              capacity: toShannon('1000'),
            }
          ],
          bob.address,
          '0',
          feeRate
        )

        const inputCapacities = tx.inputs!
          .map(input => BigInt(input.capacity))
          .reduce((result, c) => result + c, BigInt(0))
        const outputCapacities = tx.outputs!
          .map(output => BigInt(output.capacity))
          .reduce((result, c) => result + c, BigInt(0))

        // @ts-ignore: Private method
        const expectedFee: bigint = calculateFee(2, 2, BigInt(feeRate))
        expect(inputCapacities - outputCapacities).toEqual(expectedFee)
      })

      it('capacity 1000 - fee', async () => {
        const feeRate = '1000'
        const tx: TransactionWithoutHash = await TransactionGenerator.generateTx(
          [bob.lockHash],
          [
            {
              address: bob.address,
              capacity: (BigInt(1000 * 10**8) - calculateFee(2, 1, BigInt(feeRate))).toString(),
            }
          ],
          bob.address,
          '0',
          feeRate
        )

        const inputCapacities = tx.inputs!
          .map(input => BigInt(input.capacity))
          .reduce((result, c) => result + c, BigInt(0))
        const outputCapacities = tx.outputs!
          .map(output => BigInt(output.capacity))
          .reduce((result, c) => result + c, BigInt(0))

        // @ts-ignore: Private method
        const expectedFee: bigint = calculateFee(2, 1, BigInt(feeRate))
        expect(inputCapacities - outputCapacities).toEqual(expectedFee)
      })

      it('capacity 1000 - fee + 1 shannon', async () => {
        const feeRate = '1000'
        const tx: TransactionWithoutHash = await TransactionGenerator.generateTx(
          [bob.lockHash],
          [
            {
              address: bob.address,
              capacity: (BigInt(1000 * 10**8) - calculateFee(2, 1, BigInt(feeRate)) + BigInt(1)).toString(),
            }
          ],
          bob.address,
          '0',
          feeRate
        )

        const inputCapacities = tx.inputs!
          .map(input => BigInt(input.capacity))
          .reduce((result, c) => result + c, BigInt(0))
        const outputCapacities = tx.outputs!
          .map(output => BigInt(output.capacity))
          .reduce((result, c) => result + c, BigInt(0))

        // @ts-ignore: Private method
        const expectedFee: bigint = calculateFee(2, 2, BigInt(feeRate))
        expect(inputCapacities - outputCapacities).toEqual(expectedFee)
      })
    })

    describe('with fee 1000', () => {
      const fee = '1000'
      it('capacity 500', async () => {
        const tx: TransactionWithoutHash = await TransactionGenerator.generateTx(
          [bob.lockHash],
          [
            {
              address: bob.address,
              capacity: toShannon('500'),
            }
          ],
          bob.address,
          fee
        )

        const inputCapacities = tx.inputs!
          .map(input => BigInt(input.capacity))
          .reduce((result, c) => result + c, BigInt(0))
        const outputCapacities = tx.outputs!
          .map(output => BigInt(output.capacity))
          .reduce((result, c) => result + c, BigInt(0))

        // @ts-ignore: Private method
        expect(inputCapacities - outputCapacities).toEqual(BigInt(fee))
      })

      it('capacity 1000', async () => {
        const tx: TransactionWithoutHash = await TransactionGenerator.generateTx(
          [bob.lockHash],
          [
            {
              address: bob.address,
              capacity: toShannon('1000'),
            }
          ],
          bob.address,
          fee
        )

        const inputCapacities = tx.inputs!
          .map(input => BigInt(input.capacity))
          .reduce((result, c) => result + c, BigInt(0))
        const outputCapacities = tx.outputs!
          .map(output => BigInt(output.capacity))
          .reduce((result, c) => result + c, BigInt(0))

        // @ts-ignore: Private method
        expect(inputCapacities - outputCapacities).toEqual(BigInt(fee))
      })

      it('capacity 1000 - fee', async () => {
        const tx: TransactionWithoutHash = await TransactionGenerator.generateTx(
          [bob.lockHash],
          [
            {
              address: bob.address,
              capacity: (BigInt(1000 * 10**8) - BigInt(fee)).toString(),
            }
          ],
          bob.address,
          fee
        )

        const inputCapacities = tx.inputs!
          .map(input => BigInt(input.capacity))
          .reduce((result, c) => result + c, BigInt(0))
        const outputCapacities = tx.outputs!
          .map(output => BigInt(output.capacity))
          .reduce((result, c) => result + c, BigInt(0))

        // @ts-ignore: Private method
        expect(inputCapacities - outputCapacities).toEqual(BigInt(fee))
      })

      it('capacity 1000 - fee + 1 shannon', async () => {
        const tx: TransactionWithoutHash = await TransactionGenerator.generateTx(
          [bob.lockHash],
          [
            {
              address: bob.address,
              capacity: (BigInt(1000 * 10**8) - BigInt(fee) + BigInt(1)).toString(),
            }
          ],
          bob.address,
          fee
        )

        const inputCapacities = tx.inputs!
          .map(input => BigInt(input.capacity))
          .reduce((result, c) => result + c, BigInt(0))
        const outputCapacities = tx.outputs!
          .map(output => BigInt(output.capacity))
          .reduce((result, c) => result + c, BigInt(0))

        // @ts-ignore: Private method
        expect(inputCapacities - outputCapacities).toEqual(BigInt(fee))
      })
    })
  })

  describe('generateDepositAllTx', () => {
    beforeEach(async done => {
      const cells: OutputEntity[] = [
        generateCell(toShannon('1000'), OutputStatus.Live, false, null),
        generateCell(toShannon('2000'), OutputStatus.Live, false, null),
      ]
      await getConnection().manager.save(cells)
      done()
    })

    it('in fee mode, fee = 0', async () => {
      const tx = await TransactionGenerator.generateDepositAllTx(
        [bob.lockHash],
        bob.address,
        '0'
      )

      const expectCapacity = '300000000000'

      expect(tx.outputs!.length).toEqual(1)
      expect(tx.outputs![0].capacity).toEqual(expectCapacity)
    })

    it('in fee mode, fee = 999', async () => {
      const tx = await TransactionGenerator.generateDepositAllTx(
        [bob.lockHash],
        bob.address,
        '999'
      )

      const expectCapacity = BigInt('300000000000') - BigInt('999')

      expect(tx.outputs!.length).toEqual(1)
      expect(tx.outputs![0].capacity).toEqual(expectCapacity.toString())
    })

    it('in feeRate mode, feeRate = 0', async () => {
      const tx = await TransactionGenerator.generateDepositAllTx(
        [bob.lockHash],
        bob.address,
        '0',
        '0'
      )

      const expectCapacity = BigInt('300000000000')

      expect(tx.outputs!.length).toEqual(1)
      expect(tx.outputs![0].capacity).toEqual(expectCapacity.toString())
    })

    it('in feeRate mode, feeRate = 1000', async () => {
      const tx = await TransactionGenerator.generateDepositAllTx(
        [bob.lockHash],
        bob.address,
        '0',
        '1000'
      )

      const expectedFee = BigInt('590')
      const expectedCapacity = BigInt('300000000000') - expectedFee

      expect(tx.outputs!.length).toEqual(1)
      expect(tx.outputs![0].capacity).toEqual(expectedCapacity.toString())
      expect(tx.fee!).toEqual(expectedFee.toString())
    })
  })
})
