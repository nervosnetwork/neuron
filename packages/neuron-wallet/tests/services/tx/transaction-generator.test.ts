import { getConnection } from 'typeorm'
import { initConnection } from '../../../src/database/chain/ormconfig'
import OutputEntity from '../../../src/database/chain/entities/output'
import TransactionGenerator, { TargetOutput } from '../../../src/services/tx/transaction-generator'
import LockUtils from '../../../src/models/lock-utils'
import DaoUtils from '../../../src/models/dao-utils'
import TransactionSize from '../../../src/models/transaction-size'
import TransactionFee from '../../../src/models/transaction-fee'
import Script, { ScriptHashType } from '../../../src/models/chain/script'
import Transaction from '../../../src/models/chain/transaction'
import OutPoint from '../../../src/models/chain/out-point'
import Output, { OutputStatus } from '../../../src/models/chain/output'
import BlockHeader from '../../../src/models/chain/block-header'
import MultiSignUtils from '../../../src/models/multi-sign-utils'
import MultiSign from '../../../src/models/multi-sign'

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

const daoTypeScript = new Script(
  "0x82d76d1b75fe2fd9a27dfbaa65a039221a380d76c926f378d3f81cf3e7e13f2e",
  "0x",
  ScriptHashType.Type
)

const multiSignScript = {
  outPoint: {
    txHash: "0x0d9c4af3dd158d6359c9d25d0a600f1dd20b86072b85a095e7bc70c34509b73d",
    index: '1'
  },
  codeHash: '0x5c5069eb0857efc65e1bca0c07df34c31663b3622fd3876c876320fc9634e2a8',
  hashType: ScriptHashType.Type
}

const randomHex = (length: number = 64): string => {
  const str: string = Array.from({ length })
    .map(() => Math.floor(Math.random() * 16).toString(16))
    .join('')

  return `0x${str}`
}

const toShannon = (ckb: string) => `${ckb}00000000`

const bob = {
  lockScript: {
    codeHash: '0x1892ea40d82b53c678ff88312450bbb17e164d7a3e0a90941aa58839f56f8df2',
    args: '0x36c329ed630d6ce750712a477543672adab57f4c',
    hashType: ScriptHashType.Type,
  },
  lockHash: '0x27161d1287c4b472bdff08a9510591d6cb5caa5b4ad7af451dbcd01e10efefac',
  address: 'ckt1qyqrdsefa43s6m882pcj53m4gdnj4k440axqswmu83',
  blake160: '0x36c329ed630d6ce750712a477543672adab57f4c',
}

const alice = {
  lockScript: {
    codeHash: '0x1892ea40d82b53c678ff88312450bbb17e164d7a3e0a90941aa58839f56f8df2',
    args: '0xe2193df51d78411601796b35b17b4f8f2cd85bd0',
    hashType: ScriptHashType.Type,
  },
  lockHash: '0x154d47f1f2f2b30f6377ba80dd92f61a7ff3a005ec79e01113e09359dbdb31ac',
  address: 'ckt1qyqwyxfa75whssgkq9ukkdd30d8c7txct0gqfvmy2v',
  blake160: '0xe2193df51d78411601796b35b17b4f8f2cd85bd0',
}

const fullAddressInfo = {
  lockScript: {
    codeHash: '0x0000000000000000000000000000000000000000000000000000000000000000',
    args: '0x1234',
    hashType: ScriptHashType.Type,
  },
  lockHash: '0x00e823d538d9a390faff0e0f0210fb8220f5a28a810603039fe23f556150ad89',
  address: 'ckt1qsqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqy35nl24gm',
}

// diff = 1000min
const date = '1580659200000'
const tipTimestamp = '1580599200000'
const tipEpoch = '0x7080018000001'
const blockHeader = new BlockHeader('0', tipTimestamp, '0x' + '0'.repeat(64), '0x' + '0'.repeat(64), '0', tipEpoch)

describe('TransactionGenerator', () => {
  beforeAll(async () => {
    await initConnection('0x1234')
    const mockContractInfo = jest.fn()
    mockContractInfo.mockReturnValue(systemScript)
    LockUtils.systemScript = mockContractInfo.bind(LockUtils)

    const mockDaoScriptInfo = jest.fn()
    mockDaoScriptInfo.mockReturnValue(daoScript)
    DaoUtils.daoScript = mockDaoScriptInfo.bind(DaoUtils)

    const mockMultiSignScriptInfo = jest.fn()
    mockMultiSignScriptInfo.mockReturnValue(multiSignScript)
    MultiSignUtils.multiSignScript = mockMultiSignScriptInfo.bind(MultiSignUtils)

    const mockTipHeader = jest.fn()
    mockTipHeader.mockReturnValue(blockHeader)
    // @ts-ignore: Private method
    TransactionGenerator.getTipHeader = mockTipHeader.bind(TransactionGenerator)
  })

  afterAll(async () => {
    await getConnection().close()
  })

  const generateCell = (
    capacity: string,
    status: OutputStatus,
    hasData: boolean,
    typeScript: Script | null,
    who: any = bob,
    daoData?: string | undefined
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
    if (daoData) {
      output.daoData = daoData
    }

    return output
  }

  beforeEach(async done => {
    const connection = getConnection()
    await connection.synchronize(true)
    done()
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
      const feeRate = '1000'
      it('capacity 500', async () => {
        const feeRate = '1000'
        const tx: Transaction = await TransactionGenerator.generateTx(
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

        const expectedSize: number = TransactionSize.tx(tx) + TransactionSize.secpLockWitness()

        const expectedFee: bigint = TransactionFee.fee(expectedSize, BigInt(feeRate))
        expect(expectedFee).toEqual(BigInt(464))
        expect(inputCapacities - outputCapacities).toEqual(expectedFee)
        expect(tx.fee).toEqual(expectedFee.toString())
      })

      it('capacity 1000', async () => {
        const feeRate = '1000'
        const tx: Transaction = await TransactionGenerator.generateTx(
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

        const expectedSize: number = TransactionSize.tx(tx) + TransactionSize.secpLockWitness() + TransactionSize.emptyWitness()
        const expectedFee: bigint = TransactionFee.fee(expectedSize, BigInt(feeRate))
        expect(inputCapacities - outputCapacities).toEqual(expectedFee)
        expect(tx.fee).toEqual(expectedFee.toString())
      })

      it('capacity 1000 - fee, no change output', async () => {
        const feeRate = '1000'
        const tx: Transaction = await TransactionGenerator.generateTx(
          [bob.lockHash],
          [
            {
              address: bob.address,
              capacity: BigInt(1000 * 10**8 - 355).toString(),
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

        const expectedSize: number = TransactionSize.tx(tx) + TransactionSize.secpLockWitness()
        const expectedFee: bigint = TransactionFee.fee(expectedSize, BigInt(feeRate))
        expect(expectedFee).toEqual(BigInt(355))
        expect(inputCapacities - outputCapacities).toEqual(expectedFee)
        expect(tx.fee).toEqual(expectedFee.toString())
      })

      it('capacity 1000 - fee + 1 shannon', async () => {
        const feeRate = '1000'
        const tx: Transaction = await TransactionGenerator.generateTx(
          [bob.lockHash],
          [
            {
              address: bob.address,
              capacity: (BigInt(1000 * 10**8) - BigInt(464) + BigInt(1)).toString(),
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

        const expectedSize: number = TransactionSize.tx(tx) + TransactionSize.secpLockWitness() + TransactionSize.emptyWitness()
        const expectedFee: bigint = TransactionFee.fee(expectedSize, BigInt(feeRate))
        expect(inputCapacities - outputCapacities).toEqual(expectedFee)
      })

      it(`2 bob's outputs, 1 alice output`, async () => {
        const aliceCell = generateCell(toShannon('1500'), OutputStatus.Live, false, null, alice)
        await getConnection().manager.save(aliceCell)

        const feeRate = '1000'
        const tx: Transaction = await TransactionGenerator.generateTx(
          [bob.lockHash, alice.lockHash],
          [
            {
              address: bob.address,
              capacity: BigInt(1000 * 10**8).toString(),
            },
            {
              address: alice.address,
              capacity: BigInt(2500 * 10**8).toString(),
            }
          ],
          bob.address,
          '0',
          feeRate
        )

        const expectedSize: number = TransactionSize.tx(tx) + TransactionSize.secpLockWitness() * 2 + TransactionSize.emptyWitness()
        const expectedFee: bigint = TransactionFee.fee(expectedSize, BigInt(feeRate))

        expect(tx.fee).toEqual(expectedFee.toString())
      })

      describe('with full address', () => {
        it(`only full address, 43 capacity`, async () => {
          const tx: Transaction = await TransactionGenerator.generateTx(
            [bob.lockHash],
            [
              {
                address: fullAddressInfo.address,
                capacity: BigInt(43 * 10**8).toString()
              }
            ],
            bob.address,
            '0',
            feeRate
          )

          const expectedSize: number = TransactionSize.tx(tx) + TransactionSize.secpLockWitness()
          const expectedFee: bigint = TransactionFee.fee(expectedSize, BigInt(feeRate))

          expect(tx.fee).toEqual(expectedFee.toString())
        })

        it('only full address, 42 capacity', async () => {
          expect(
            TransactionGenerator.generateTx(
              [bob.lockHash],
              [
                {
                  address: fullAddressInfo.address,
                  capacity: BigInt(42 * 10**8).toString()
                }
              ],
              bob.address,
              '0',
              feeRate
            )
          ).rejects.toThrowError()
        })

        it(`full address and bob's output`, async () => {
          const tx: Transaction = await TransactionGenerator.generateTx(
            [bob.lockHash],
            [
              {
                address: fullAddressInfo.address,
                capacity: BigInt(1000 * 10**8).toString()
              },
              {
                address: bob.address,
                capacity: BigInt(1000 * 10**8).toString(),
              },
            ],
            bob.address,
            '0',
            feeRate
          )

          const expectedSize: number = TransactionSize.tx(tx) + TransactionSize.secpLockWitness() + TransactionSize.emptyWitness()
          const expectedFee: bigint = TransactionFee.fee(expectedSize, BigInt(feeRate))

          expect(tx.fee).toEqual(expectedFee.toString())
        })
      })

      describe('with date', () => {
        it('capacity 500', async () => {
          const tx: Transaction = await TransactionGenerator.generateTx(
            [bob.lockHash],
            [
              {
                address: bob.address,
                capacity: toShannon('500'),
                date,
              }
            ],
            bob.address,
            '0',
            feeRate
          )

          const expectedSize: number = TransactionSize.tx(tx) + TransactionSize.secpLockWitness()

          const expectedFee: bigint = TransactionFee.fee(expectedSize, BigInt(feeRate))
          expect(expectedFee).toEqual(BigInt(472))
          expect(tx.fee).toEqual(expectedFee.toString())

          expect(tx.outputs[0].lock.codeHash).toEqual(multiSignScript.codeHash)
        })
      })
    })

    describe('with fee 1000', () => {
      const fee = '1000'
      it('capacity 500', async () => {
        const tx: Transaction = await TransactionGenerator.generateTx(
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

        expect(inputCapacities - outputCapacities).toEqual(BigInt(fee))
      })

      it('capacity 1000', async () => {
        const tx: Transaction = await TransactionGenerator.generateTx(
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

        expect(inputCapacities - outputCapacities).toEqual(BigInt(fee))
      })

      it('capacity 1000 - fee', async () => {
        const tx: Transaction = await TransactionGenerator.generateTx(
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

        expect(inputCapacities - outputCapacities).toEqual(BigInt(fee))
      })

      it('capacity 1000 - fee + 1 shannon', async () => {
        const tx: Transaction = await TransactionGenerator.generateTx(
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

        expect(inputCapacities - outputCapacities).toEqual(BigInt(fee))
      })
    })
  })

  describe('generateSendingAllTx', () => {
    beforeEach(async done => {
      const cells: OutputEntity[] = [
        generateCell(toShannon('1000'), OutputStatus.Live, false, null),
        generateCell(toShannon('2000'), OutputStatus.Live, false, null),
        generateCell(toShannon('3000'), OutputStatus.Live, false, null, alice),
      ]
      await getConnection().manager.save(cells)
      done()
    })
    const totalCapacities: bigint = BigInt(toShannon('6000'))

    const lockHashes: string[] = [bob.lockHash, alice.lockHash]
    const targetOutputs: TargetOutput[] = [
      {
        address: bob.address,
        capacity: toShannon('500'),
      },
      {
        address: alice.address,
        capacity: toShannon('1000'),
      },
      {
        address: bob.address,
        capacity: toShannon('0')
      }
    ]

    it('with fee 800', async () => {
      const fee = '800'
      const feeInt = BigInt(fee)
      const tx: Transaction = await TransactionGenerator.generateSendingAllTx(
        lockHashes,
        targetOutputs,
        fee,
      )

      const inputCapacities = tx.inputs!
        .map(input => BigInt(input.capacity))
        .reduce((result, c) => result + c, BigInt(0))
      const outputCapacities = tx.outputs!
        .map(output => BigInt(output.capacity))
        .reduce((result, c) => result + c, BigInt(0))

      expect(inputCapacities - outputCapacities).toEqual(feeInt)
      expect(tx.fee).toEqual(fee)
      targetOutputs.map((o, index) => {
        if (index !== targetOutputs.length - 1) {
          expect(o.capacity).toEqual(tx.outputs![index].capacity)
        }
      })
      expect(outputCapacities + BigInt(tx.fee)).toEqual(totalCapacities)
    })

    it('with feeRate 1000', async () => {
      const feeRate = '1000'
      const tx: Transaction = await TransactionGenerator.generateSendingAllTx(
        lockHashes,
        targetOutputs,
        '0',
        feeRate
      )

      const inputCapacities = tx.inputs!
        .map(input => BigInt(input.capacity))
        .reduce((result, c) => result + c, BigInt(0))
      const outputCapacities = tx.outputs!
        .map(output => BigInt(output.capacity))
        .reduce((result, c) => result + c, BigInt(0))

      const expectedSize: number = TransactionSize.tx(tx) + TransactionSize.secpLockWitness() * 2 + TransactionSize.emptyWitness()

      const expectedFee: bigint = TransactionFee.fee(expectedSize, BigInt(feeRate))
      // 762 is calculated by SDK
      expect(expectedFee).toEqual(BigInt(762))
      expect(inputCapacities - outputCapacities).toEqual(expectedFee)
      expect(tx.fee).toEqual(expectedFee.toString())
      targetOutputs.map((o, index) => {
        if (index !== targetOutputs.length - 1) {
          expect(o.capacity).toEqual(tx.outputs![index].capacity)
        }
      })
      expect(outputCapacities + BigInt(tx.fee)).toEqual(totalCapacities)
    })

    it('full address with feeRate 1000, 43 capacity', async () => {
      const feeRate = '1000'
      const tx: Transaction = await TransactionGenerator.generateSendingAllTx(
        lockHashes,
        [
          {
            address: fullAddressInfo.address,
            capacity: toShannon('43')
          },
          {
            address: fullAddressInfo.address,
            capacity: toShannon('0')
          }
        ],
        '0',
        feeRate
      )

      const outputCapacities = tx.outputs!
        .map(output => BigInt(output.capacity))
        .reduce((result, c) => result + c, BigInt(0))

      const expectedSize: number = TransactionSize.tx(tx) + TransactionSize.secpLockWitness() * 2 + TransactionSize.emptyWitness()

      const expectedFee: bigint = TransactionFee.fee(expectedSize, BigInt(feeRate))
      expect(tx.fee).toEqual(expectedFee.toString())
      expect(tx.outputs[0].capacity).toEqual(toShannon('43'))
      expect(outputCapacities + BigInt(tx.fee)).toEqual(totalCapacities)
    })

    it('full address with feeRate 1000, 42 capacity', async () => {
      const feeRate = '1000'

      expect(
        TransactionGenerator.generateSendingAllTx(
          lockHashes,
          [
            {
              address: fullAddressInfo.address,
              capacity: toShannon('42')
            },
            {
              address: fullAddressInfo.address,
              capacity: toShannon('0')
            }
          ],
          '0',
          feeRate
        )
      ).rejects.toThrowError()
    })

    describe('feeRate = 1000, with date', () => {
      const feeRate = '1000'
      it('capacity 500', async () => {
        const tx: Transaction = await TransactionGenerator.generateSendingAllTx(
          lockHashes,
          [
            {
              address: bob.address,
              capacity: toShannon('500'),
              date,
            }
          ],
          '0',
          feeRate
        )

        expect(tx.outputs[0].lock.codeHash).toEqual(multiSignScript.codeHash)
      })
    })
  })

  describe('generateDepositTx', () => {
    beforeEach(async done => {
      const cells: OutputEntity[] = [
        generateCell(toShannon('1000'), OutputStatus.Live, false, null),
        generateCell(toShannon('2000'), OutputStatus.Live, false, null),
      ]
      await getConnection().manager.save(cells)
      done()
    })

    const feeRate = '1000'
    const feeRateInt = BigInt(feeRate)

    it('capacity 500', async () => {
      const tx: Transaction = await TransactionGenerator.generateDepositTx(
        [bob.lockHash],
        toShannon('500'),
        bob.address,
        bob.address,
        '0',
        feeRate
      )

      const expectedSize: number = TransactionSize.tx(tx) + TransactionSize.secpLockWitness()
      const expectedFee: bigint = TransactionFee.fee(expectedSize, feeRateInt)
      expect(tx.fee).toEqual(expectedFee.toString())
    })

    it('capacity 1000', async () => {
      const feeRate = '1000'
      const tx: Transaction = await TransactionGenerator.generateDepositTx(
        [bob.lockHash],
        toShannon('1000'),
        bob.address,
        bob.address,
        '0',
        feeRate
      )

      const expectedSize: number = TransactionSize.tx(tx) + TransactionSize.secpLockWitness() + TransactionSize.emptyWitness()
      const expectedFee: bigint = TransactionFee.fee(expectedSize, feeRateInt)
      expect(tx.fee).toEqual(expectedFee.toString())
    })

    it('capacity 1000 - fee, no change output', async () => {
      const tx: Transaction = await TransactionGenerator.generateDepositTx(
        [bob.lockHash],
        (BigInt(1000 * 10**8 - 453)).toString(),
        bob.address,
        bob.address,
        '0',
        feeRate
      )

      const expectedSize: number = TransactionSize.tx(tx) + TransactionSize.secpLockWitness()
      const expectedFee: bigint = TransactionFee.fee(expectedSize, feeRateInt)
      expect(tx.outputs!.length).toEqual(1)
      expect(tx.fee).toEqual(expectedFee.toString())
    })

    it(`2 bob's outputs, 1 alice output`, async () => {
      const aliceCell = generateCell(toShannon('1500'), OutputStatus.Live, false, null, alice)
      await getConnection().manager.save(aliceCell)

      const tx: Transaction = await TransactionGenerator.generateDepositTx(
        [bob.lockHash, alice.lockHash],
        BigInt(3000 * 10**8).toString(),
        alice.address,
        bob.address,
        '0',
        feeRate
      )

      const expectedSize: number = TransactionSize.tx(tx) + TransactionSize.secpLockWitness() * 2 + TransactionSize.emptyWitness()
      const expectedFee: bigint = TransactionFee.fee(expectedSize, feeRateInt)

      expect(tx.fee).toEqual(expectedFee.toString())
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

      // calculated by SDK
      const expectedFee = BigInt('505')
      const expectedCapacity = BigInt('300000000000') - expectedFee

      expect(tx.outputs!.length).toEqual(1)
      expect(tx.outputs![0].capacity).toEqual(expectedCapacity.toString())
      expect(tx.fee!).toEqual(expectedFee.toString())
    })

    it(`2 bob's outputs, 1 alice output`, async () => {
      const aliceCell = generateCell(toShannon('1500'), OutputStatus.Live, false, null, alice)
      await getConnection().manager.save(aliceCell)

      const tx: Transaction = await TransactionGenerator.generateDepositAllTx(
        [bob.lockHash, alice.lockHash],
        bob.address,
        '0',
        '1000'
      )

      // calculated by SDK
      const expectedFee = BigInt('642')
      const expectedCapacity = BigInt('450000000000') - expectedFee

      expect(tx.outputs!.length).toEqual(1)
      expect(tx.outputs![0].capacity).toEqual(expectedCapacity.toString())
      expect(tx.fee!).toEqual(expectedFee.toString())
    })
  })

  describe('startWithdrawFromDao', () => {
    const daoData = "0x0000000000000000"
    const depositDaoOutput = generateCell(toShannon('3000'), OutputStatus.Live, true, daoTypeScript, alice, daoData)
    const depositDaoCell = depositDaoOutput.toModel()
    const depositOutPoint = new OutPoint('0x' + '2'.repeat(64), '0')
    beforeEach(async done => {
      const cells: OutputEntity[] = [
        generateCell(toShannon('1000'), OutputStatus.Live, false, null),
        generateCell(toShannon('2000'), OutputStatus.Live, false, null),
        depositDaoOutput,
      ]

      await getConnection().manager.save(cells)
      done()
    })

    const feeRate = '1000'
    const feeRateInt = BigInt(feeRate)

    it('deposit first', async () => {
      const tx: Transaction = await TransactionGenerator.startWithdrawFromDao(
        [bob.lockHash, alice.lockHash],
        depositOutPoint,
        depositDaoCell,
        '12',
        '0x' + '3'.repeat(64),
        bob.address,
        '0',
        feeRate
      )
      const expectedSize: number = TransactionSize.tx(tx) + TransactionSize.secpLockWitness() * 2
      const expectedFee: bigint = TransactionFee.fee(expectedSize, feeRateInt)
      expect(expectedFee).toEqual(BigInt(731))
      expect(tx.fee).toEqual(expectedFee.toString())
      expect(tx.inputs!.length).toEqual(2)
      expect(tx.outputs!.length).toEqual(2)
    })
  })

  describe('generateWithdrawMultiSignTx', () => {
    const prevOutput = Output.fromObject({
      capacity: toShannon('1000'),
      lock: Script.fromObject({
        codeHash: multiSignScript.codeHash,
        args: new MultiSign().args(bob.blake160, 100, '0x7080018000001'),
        hashType: multiSignScript.hashType
      })
    })
    const outPoint = OutPoint.fromObject({
      txHash: '0x' + '0'.repeat(64),
      index: '1'
    })

    describe('with feeRate 1000', () => {
      const feeRate = '1000'
      it('capacity 500', async () => {
        const tx: Transaction = await TransactionGenerator.generateWithdrawMultiSignTx(
          outPoint,
          prevOutput,
          bob.address,
          '0',
          feeRate
        )

        expect(tx.inputs.length).toEqual(1)
        expect(tx.outputs.length).toEqual(1)
        expect(tx.outputs[0].lock.codeHash).toEqual(systemScript.codeHash)

        const inputCapacities = tx.inputs
          .map(input => BigInt(input.capacity))
          .reduce((result, c) => result + c, BigInt(0))
        const outputCapacities = tx.outputs
          .map(output => BigInt(output.capacity))
          .reduce((result, c) => result + c, BigInt(0))

        const expectedSize: number = TransactionSize.tx(tx) + TransactionSize.singleMultiSignWitness()
        const expectedFee: bigint = TransactionFee.fee(expectedSize, BigInt(feeRate))

        expect(expectedFee).toEqual(BigInt(355 + 24))
        expect(inputCapacities - outputCapacities).toEqual(expectedFee)
        expect(tx.fee).toEqual(expectedFee.toString())
      })
    })
  })
})
