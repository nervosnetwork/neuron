import { getConnection } from 'typeorm'
import { initConnection } from '../../../src/database/chain/ormconfig'
import OutputEntity from '../../../src/database/chain/entities/output'
import TransactionGenerator, { TargetOutput } from '../../../src/services/tx/transaction-generator'
import TransactionSize from '../../../src/models/transaction-size'
import TransactionFee from '../../../src/models/transaction-fee'
import Script, { ScriptHashType } from '../../../src/models/chain/script'
import Transaction from '../../../src/models/chain/transaction'
import OutPoint from '../../../src/models/chain/out-point'
import Output, { OutputStatus } from '../../../src/models/chain/output'
import BlockHeader from '../../../src/models/chain/block-header'
import MultiSign from '../../../src/models/multi-sign'
import SystemScriptInfo from '../../../src/models/system-script-info'
import LiveCellEntity from '../../../src/database/chain/entities/live-cell'
import AssetAccountInfo from '../../../src/models/asset-account-info'
import BufferUtils from '../../../src/utils/buffer'
import WitnessArgs from '../../../src/models/chain/witness-args'
import { serializeWitnessArgs, AddressPrefix } from '@nervosnetwork/ckb-sdk-utils'
import { CapacityNotEnough } from '../../../src/exceptions/wallet'
import LiveCell from '../../../src/models/chain/live-cell'
import AddressGenerator from '../../../src/models/address-generator'

const randomHex = (length: number = 64): string => {
  const str: string = Array.from({ length })
    .map(() => Math.floor(Math.random() * 16).toString(16))
    .join('')

  return `0x${str}`
}

const toShannon = (ckb: string) => `${ckb}00000000`

const bobLockScript: Script = SystemScriptInfo.generateSecpScript('0x36c329ed630d6ce750712a477543672adab57f4c')
const bob = {
  lockScript: bobLockScript,
  lockHash: bobLockScript.computeHash(),
  address: AddressGenerator.generate(bobLockScript, AddressPrefix.Testnet),
  blake160: bobLockScript.args,
}

const aliceLockScript: Script = SystemScriptInfo.generateSecpScript('0xe2193df51d78411601796b35b17b4f8f2cd85bd0')
const alice = {
  lockScript: aliceLockScript,
  lockHash: aliceLockScript.computeHash(),
  address: AddressGenerator.generate(aliceLockScript, AddressPrefix.Testnet),
  blake160: aliceLockScript.args,
}

const fullAddressLockScript: Script = new Script(
  '0x0000000000000000000000000000000000000000000000000000000000000000',
  '0x1234',
  ScriptHashType.Type
)
const fullAddressInfo = {
  lockScript: fullAddressLockScript,
  lockHash: fullAddressLockScript.computeHash(),
  address: AddressGenerator.generate(fullAddressLockScript, AddressPrefix.Testnet),
}

// diff = 1000min
const date = '1580659200000'
const tipTimestamp = '1580599200000'
// number = 1, length = 1800, index = 24
const tipEpoch = '0x7080018000001'
const blockHeader = new BlockHeader('0', tipTimestamp, '0x' + '0'.repeat(64), '0x' + '0'.repeat(64), '0', tipEpoch)

describe('TransactionGenerator', () => {
  beforeAll(async () => {
    await initConnection('0x1234')

    // @ts-ignore: Private method
    SystemScriptInfo.getInstance().secpOutPointInfo = new Map<string, OutPoint>([
      ['0x92b197aa1fba0f63633922c61c92375c9c074a93e85963554f5499fe1450d0e5', new OutPoint('0x71a7ba8fc96349fea0ed3a5c47992e3b4084b031a42264a018e0072e8172e46c', '0')]
    ])

    // @ts-ignore: Private method
    SystemScriptInfo.getInstance().daoOutPointInfo = new Map<string, OutPoint>([
      ['0x92b197aa1fba0f63633922c61c92375c9c074a93e85963554f5499fe1450d0e5', new OutPoint('0xe2fb199810d49a4d8beec56718ba2593b665db9d52299a0f9e6e75416d73ff5c', '2')]
    ])

    // @ts-ignore: Private method
    SystemScriptInfo.getInstance().multiSignOutPointInfo = new Map<string, OutPoint>([
      ['0x92b197aa1fba0f63633922c61c92375c9c074a93e85963554f5499fe1450d0e5', new OutPoint('0x71a7ba8fc96349fea0ed3a5c47992e3b4084b031a42264a018e0072e8172e46c', '1')]
    ])

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
    output.lockCodeHash = who.lockScript.codeHash
    output.lockArgs = who.lockScript.args
    output.lockHashType = who.lockScript.hashType
    output.lockHash = who.lockHash
    output.status = status
    output.hasData = hasData
    if (typeScript) {
      output.typeCodeHash = typeScript.codeHash
      output.typeArgs = typeScript.args
      output.typeHashType = typeScript.hashType
    }
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

          const multiSignOutput = tx.outputs.find(o => o.lock.codeHash === SystemScriptInfo.MULTI_SIGN_CODE_HASH)
          expect(multiSignOutput).toBeDefined()

          const multiSign = new MultiSign()
          const epoch = multiSign.parseSince(multiSignOutput!.lock.args)
          // @ts-ignore: Private method
          const parsedEpoch = multiSign.parseEpoch(epoch)
          expect(parsedEpoch.number).toEqual(BigInt(5))
          expect(parsedEpoch.length).toEqual(BigInt(240))
          expect(parsedEpoch.index).toEqual(BigInt(43))
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

        expect(tx.outputs[0].lock.codeHash).toEqual(SystemScriptInfo.MULTI_SIGN_CODE_HASH)

        const multiSign = new MultiSign()
        const epoch = multiSign.parseSince(tx.outputs[0].lock.args)
        // @ts-ignore: Private method
        const parsedEpoch = multiSign.parseEpoch(epoch)
        expect(parsedEpoch.number).toEqual(BigInt(5))
        expect(parsedEpoch.length).toEqual(BigInt(240))
        expect(parsedEpoch.index).toEqual(BigInt(43))
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
    const depositDaoOutput = generateCell(toShannon('3000'), OutputStatus.Live, true, SystemScriptInfo.generateDaoScript(), alice, daoData)
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
      lock: SystemScriptInfo.generateMultiSignScript(new MultiSign().args(bob.blake160, 100, '0x7080018000001'))
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
        expect(tx.outputs[0].lock.codeHash).toEqual(SystemScriptInfo.SECP_CODE_HASH)

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

  describe('AnyoneCanPay', () => {
    const assetAccountInfo = new AssetAccountInfo()
    const bobAnyoneCanPayLockScript = assetAccountInfo.generateAnyoneCanPayScript('0x36c329ed630d6ce750712a477543672adab57f4c')
    const aliceAnyoneCanPayLockScript = assetAccountInfo.generateAnyoneCanPayScript('0xe2193df51d78411601796b35b17b4f8f2cd85bd0')

    // generate anyone-can-pay live cell
    const generateLiveCell = (
      capacity: string,
      amount: string | undefined = undefined,
      tokenID: string | undefined = undefined,
      lockScript: Script = bobAnyoneCanPayLockScript,
      blockNumber: string = '1',
    ) => {
      const liveCell = new LiveCellEntity()
      liveCell.txHash = Buffer.from(randomHex().slice(2), 'hex')
      liveCell.outputIndex = 0
      liveCell.capacity = capacity
      liveCell.lockCodeHash = Buffer.from(lockScript.codeHash.slice(2), 'hex')
      liveCell.lockArgs = Buffer.from(lockScript.args.slice(2), 'hex')
      liveCell.lockHashType = lockScript.hashType === 'data' ? '1' : '2'
      liveCell.lockHash = Buffer.from(lockScript.computeHash().slice(2), 'hex')
      liveCell.createdBlockNumber = blockNumber
      const data = amount ? BufferUtils.writeBigUInt128LE(BigInt(amount)) : '0x'
      liveCell.data = Buffer.from(data.slice(2), 'hex')

      if (tokenID) {
        const typeScript = assetAccountInfo.generateSudtScript(tokenID)
        liveCell.typeCodeHash = Buffer.from(typeScript.codeHash.slice(2), 'hex')
        liveCell.typeArgs = Buffer.from(typeScript.args.slice(2), 'hex')
        liveCell.typeHashType = typeScript.hashType === 'data' ? '1' : '2'
        liveCell.typeHash = Buffer.from(typeScript.computeHash().slice(2), 'hex')
      }

      return liveCell
    }
    beforeEach(async done => {
      const cells: OutputEntity[] = [
        generateCell(toShannon('1000'), OutputStatus.Live, false, null),
        generateCell(toShannon('2000'), OutputStatus.Live, false, null),
      ]
      await getConnection().manager.save(cells)
      done()
    })

    describe('generateAnyoneCanPayToCKBTx, with feeRate 1000', () => {
      const feeRate = '1000'
      it('capacity 70, enough for fee', async () => {
        const liveCells: LiveCellEntity[] = [
          generateLiveCell(toShannon('70')),
          generateLiveCell(toShannon('61'), undefined, undefined, aliceAnyoneCanPayLockScript),
        ]
        await getConnection().manager.save(liveCells)

        const targetOutput: Output = Output.fromObject({
          capacity: toShannon('61'),
          lock: aliceAnyoneCanPayLockScript,
          type: null,
          data: '0x',
        })

        const tx: Transaction = await TransactionGenerator.generateAnyoneCanPayToCKBTx(
          [bob.lockHash],
          [bobAnyoneCanPayLockScript.computeHash()],
          targetOutput,
          (1 * 10**8).toString(),
          bob.blake160,
          feeRate,
          '0'
        )

        tx.witnesses[0] = serializeWitnessArgs(WitnessArgs.emptyLock().toSDK())

        const expectedTxSize: number = TransactionSize.tx(tx)
        const expectedTxFee: string = TransactionFee.fee(expectedTxSize, BigInt(feeRate)).toString()

        expect(tx.fee).toEqual(expectedTxFee)

        expect(tx.inputs.length).toEqual(2)
        expect(tx.outputs.length).toEqual(2)

        const inputCapacities = tx.inputs
          .map(input => BigInt(input.capacity))
          .reduce((result, c) => result + c, BigInt(0))
        const outputCapacities = tx.outputs
          .map(output => BigInt(output.capacity))
          .reduce((result, c) => result + c, BigInt(0))

        expect(inputCapacities - outputCapacities).toEqual(BigInt(expectedTxFee))
      })

      it('2 capacity 62, enough for send, 1 not enough for fee', async () => {
        const liveCells: LiveCellEntity[] = [
          generateLiveCell(toShannon('62')),
          generateLiveCell(toShannon('62')),
          generateLiveCell(toShannon('61'), undefined, undefined, aliceAnyoneCanPayLockScript),
        ]
        await getConnection().manager.save(liveCells)

        const targetOutput: Output = Output.fromObject({
          capacity: toShannon('61'),
          lock: aliceAnyoneCanPayLockScript,
          type: null,
          data: '0x',
        })

        const tx: Transaction = await TransactionGenerator.generateAnyoneCanPayToCKBTx(
          [bob.lockHash],
          [bobAnyoneCanPayLockScript.computeHash()],
          targetOutput,
          (1 * 10**8).toString(),
          bob.blake160,
          feeRate,
          '0'
        )

        tx.witnesses[0] = serializeWitnessArgs(WitnessArgs.emptyLock().toSDK())
        tx.witnesses[1] = '0x'

        const expectedTxSize: number = TransactionSize.tx(tx)
        const expectedTxFee: string = TransactionFee.fee(expectedTxSize, BigInt(feeRate)).toString()

        expect(tx.fee).toEqual(expectedTxFee)

        expect(tx.inputs.length).toEqual(3)
        expect(tx.outputs.length).toEqual(3)

        const inputCapacities = tx.inputs
          .map(input => BigInt(input.capacity))
          .reduce((result, c) => result + c, BigInt(0))
        const outputCapacities = tx.outputs
          .map(output => BigInt(output.capacity))
          .reduce((result, c) => result + c, BigInt(0))

        expect(inputCapacities - outputCapacities).toEqual(BigInt(expectedTxFee))
      })

      it('1 capacity 62, enough for send, not enough for fee, need normal cell', async () => {
        const liveCells: LiveCellEntity[] = [
          generateLiveCell(toShannon('62')),
          generateLiveCell(toShannon('61'), undefined, undefined, aliceAnyoneCanPayLockScript),
        ]
        await getConnection().manager.save(liveCells)

        const targetOutput: Output = Output.fromObject({
          capacity: toShannon('61'),
          lock: aliceAnyoneCanPayLockScript,
          type: null,
          data: '0x',
        })

        const tx: Transaction = await TransactionGenerator.generateAnyoneCanPayToCKBTx(
          [bob.lockHash],
          [bobAnyoneCanPayLockScript.computeHash()],
          targetOutput,
          (1 * 10**8).toString(),
          bob.blake160,
          feeRate,
          '0'
        )

        tx.witnesses[0] = serializeWitnessArgs(WitnessArgs.emptyLock().toSDK())
        tx.witnesses[1] = serializeWitnessArgs(WitnessArgs.emptyLock().toSDK())

        const expectedTxSize: number = TransactionSize.tx(tx)
        const expectedTxFee: string = TransactionFee.fee(expectedTxSize, BigInt(feeRate)).toString()

        expect(tx.fee).toEqual(expectedTxFee)

        expect(tx.inputs.length).toEqual(3)
        expect(tx.outputs.length).toEqual(3)

        const inputCapacities = tx.inputs
          .map(input => BigInt(input.capacity))
          .reduce((result, c) => result + c, BigInt(0))
        const outputCapacities = tx.outputs
          .map(output => BigInt(output.capacity))
          .reduce((result, c) => result + c, BigInt(0))

        expect(inputCapacities - outputCapacities).toEqual(BigInt(expectedTxFee))
      })

      it('capacity 61, not enough for send', async () => {
        const liveCells: LiveCellEntity[] = [
          generateLiveCell(toShannon('61')),
          generateLiveCell(toShannon('61'), undefined, undefined, aliceAnyoneCanPayLockScript),
        ]
        await getConnection().manager.save(liveCells)

        const targetOutput: Output = Output.fromObject({
          capacity: toShannon('61'),
          lock: aliceAnyoneCanPayLockScript,
          type: null,
          data: '0x',
        })

        let error
        try {
          await TransactionGenerator.generateAnyoneCanPayToCKBTx(
            [bob.lockHash],
            [bobAnyoneCanPayLockScript.computeHash()],
            targetOutput,
            (1 * 10**8).toString(),
            bob.blake160,
            feeRate,
            '0'
          )
        } catch (e) {
          error = e
        }
        expect(error).toBeInstanceOf(CapacityNotEnough)
      })
    })

    describe('generateAnyoneCanPayToSudtTx, with feeRate 1000', () => {
      const tokenID = bob.lockHash
      const feeRate = '1000'
      it('capacity 150, enough for fee', async () => {
        const targetLiveCellEntity = generateLiveCell(toShannon('142'), '100', tokenID, aliceAnyoneCanPayLockScript)
        const liveCells: LiveCellEntity[] = [
          generateLiveCell(toShannon('150'), '1000', tokenID),
          targetLiveCellEntity
        ]
        await getConnection().manager.save(liveCells)

        const targetLiveCell: LiveCell = LiveCell.fromEntity(targetLiveCellEntity)

        const targetOutput: Output = Output.fromObject({
          capacity: targetLiveCell.capacity,
          lock: targetLiveCell.lock(),
          type: targetLiveCell.type(),
          data: targetLiveCell.data,
        })

        const tx: Transaction = await TransactionGenerator.generateAnyoneCanPayToSudtTx(
          [bob.lockHash],
          [bobAnyoneCanPayLockScript.computeHash()],
          targetOutput,
          '100',
          bob.blake160,
          feeRate,
          '0'
        )

        tx.witnesses[0] = serializeWitnessArgs(WitnessArgs.emptyLock().toSDK())

        const expectedTxSize: number = TransactionSize.tx(tx)
        const expectedTxFee: string = TransactionFee.fee(expectedTxSize, BigInt(feeRate)).toString()

        expect(tx.fee).toEqual(expectedTxFee)

        expect(tx.inputs.length).toEqual(2)
        expect(tx.outputs.length).toEqual(2)

        const expectedOutputCapacities: bigint[] = [BigInt(toShannon('150')) - BigInt(tx.fee), BigInt(toShannon('142'))]
        expect(tx.outputs.map(o => BigInt(o.capacity))).toEqual(expectedOutputCapacities)
        expect(tx.outputs.map(o => o.lockHash)).toEqual([bobAnyoneCanPayLockScript.computeHash(), aliceAnyoneCanPayLockScript.computeHash()])
        expect(tx.outputsData).toEqual([BufferUtils.writeBigUInt128LE(BigInt(900)), BufferUtils.writeBigUInt128LE(BigInt(200))])

        const inputCapacities = tx.inputs
          .map(input => BigInt(input.capacity))
          .reduce((result, c) => result + c, BigInt(0))
        const outputCapacities = tx.outputs
          .map(output => BigInt(output.capacity))
          .reduce((result, c) => result + c, BigInt(0))

        expect(inputCapacities - outputCapacities).toEqual(BigInt(expectedTxFee))
      })

      it('capacity 142 , enough for send, 1 not enough for fee', async () => {
        const targetLiveCellEntity = generateLiveCell(toShannon('142'), '100', tokenID, aliceAnyoneCanPayLockScript)
        const liveCells: LiveCellEntity[] = [
          generateLiveCell(toShannon('142'), '1000', tokenID),
          targetLiveCellEntity
        ]
        await getConnection().manager.save(liveCells)

        const targetLiveCell: LiveCell = LiveCell.fromEntity(targetLiveCellEntity)

        const targetOutput: Output = Output.fromObject({
          capacity: targetLiveCell.capacity,
          lock: targetLiveCell.lock(),
          type: targetLiveCell.type(),
          data: targetLiveCell.data,
        })

        const tx: Transaction = await TransactionGenerator.generateAnyoneCanPayToSudtTx(
          [bob.lockHash],
          [bobAnyoneCanPayLockScript.computeHash()],
          targetOutput,
          '100',
          bob.blake160,
          feeRate,
          '0'
        )

        tx.witnesses[0] = serializeWitnessArgs(WitnessArgs.emptyLock().toSDK())
        tx.witnesses[1] = serializeWitnessArgs(WitnessArgs.emptyLock().toSDK())

        const expectedTxSize: number = TransactionSize.tx(tx)
        const expectedTxFee: string = TransactionFee.fee(expectedTxSize, BigInt(feeRate)).toString()

        expect(tx.fee).toEqual(expectedTxFee)

        expect(tx.inputs.length).toEqual(3)
        expect(tx.outputs.length).toEqual(3)

        const expectedOutputCapacities: bigint[] = [BigInt(toShannon('142')), BigInt(toShannon('142')), BigInt(toShannon('1000')) - BigInt(tx.fee)]
        expect(tx.outputs.map(o => BigInt(o.capacity))).toEqual(expectedOutputCapacities)
        expect(tx.outputs.map(o => o.lockHash)).toEqual([
          bobAnyoneCanPayLockScript.computeHash(),
          aliceAnyoneCanPayLockScript.computeHash(),
          bob.lockHash,
        ])
        expect(tx.outputsData).toEqual([BufferUtils.writeBigUInt128LE(BigInt(900)), BufferUtils.writeBigUInt128LE(BigInt(200)), '0x'])

        const inputCapacities = tx.inputs
          .map(input => BigInt(input.capacity))
          .reduce((result, c) => result + c, BigInt(0))
        const outputCapacities = tx.outputs
          .map(output => BigInt(output.capacity))
          .reduce((result, c) => result + c, BigInt(0))

        expect(inputCapacities - outputCapacities).toEqual(BigInt(expectedTxFee))
      })

      it('capacity 143 / 142 , enough for send, 1 not enough for fee', async () => {
        const targetLiveCellEntity = generateLiveCell(toShannon('142'), '100', tokenID, aliceAnyoneCanPayLockScript)
        const liveCells: LiveCellEntity[] = [
          generateLiveCell(toShannon('143'), '50', tokenID),
          generateLiveCell(toShannon('142'), '1000', tokenID),
          targetLiveCellEntity
        ]
        await getConnection().manager.save(liveCells)

        const targetLiveCell: LiveCell = LiveCell.fromEntity(targetLiveCellEntity)

        const targetOutput: Output = Output.fromObject({
          capacity: targetLiveCell.capacity,
          lock: targetLiveCell.lock(),
          type: targetLiveCell.type(),
          data: targetLiveCell.data,
        })

        const tx: Transaction = await TransactionGenerator.generateAnyoneCanPayToSudtTx(
          [bob.lockHash],
          [bobAnyoneCanPayLockScript.computeHash()],
          targetOutput,
          '100',
          bob.blake160,
          feeRate,
          '0'
        )

        tx.witnesses[0] = serializeWitnessArgs(WitnessArgs.emptyLock().toSDK())
        tx.witnesses[1] = '0x'

        const expectedTxSize: number = TransactionSize.tx(tx)
        const expectedTxFee: string = TransactionFee.fee(expectedTxSize, BigInt(feeRate)).toString()

        expect(tx.fee).toEqual(expectedTxFee)

        expect(tx.inputs.length).toEqual(3)
        expect(tx.outputs.length).toEqual(3)

        const expectedOutputCapacities: bigint[] = [
          BigInt(toShannon('143')) - BigInt(tx.fee),
          BigInt(toShannon('142')),
          BigInt(toShannon('142'))
        ]
        expect(tx.outputs.map(o => BigInt(o.capacity))).toEqual(expectedOutputCapacities)
        expect(tx.outputs.map(o => o.lockHash)).toEqual([
          bobAnyoneCanPayLockScript.computeHash(),
          bobAnyoneCanPayLockScript.computeHash(),
          aliceAnyoneCanPayLockScript.computeHash(),
        ])
        expect(tx.outputsData).toEqual([
          BufferUtils.writeBigUInt128LE(BigInt(0)),
          BufferUtils.writeBigUInt128LE(BigInt(950)),
          BufferUtils.writeBigUInt128LE(BigInt(200)),
        ])

        const inputCapacities = tx.inputs
          .map(input => BigInt(input.capacity))
          .reduce((result, c) => result + c, BigInt(0))
        const outputCapacities = tx.outputs
          .map(output => BigInt(output.capacity))
          .reduce((result, c) => result + c, BigInt(0))

        expect(inputCapacities - outputCapacities).toEqual(BigInt(expectedTxFee))
      })


      it('amount 50, not enough for send', async () => {
        const targetLiveCellEntity = generateLiveCell(toShannon('142'), '100', tokenID, aliceAnyoneCanPayLockScript)
        const liveCells: LiveCellEntity[] = [
          generateLiveCell(toShannon('142'), '50', tokenID),
          targetLiveCellEntity
        ]
        await getConnection().manager.save(liveCells)

        const targetLiveCell: LiveCell = LiveCell.fromEntity(targetLiveCellEntity)

        const targetOutput: Output = Output.fromObject({
          capacity: targetLiveCell.capacity,
          lock: targetLiveCell.lock(),
          type: targetLiveCell.type(),
          data: targetLiveCell.data,
        })

        let error
        try {
          await TransactionGenerator.generateAnyoneCanPayToSudtTx(
            [bob.lockHash],
            [bobAnyoneCanPayLockScript.computeHash()],
            targetOutput,
            '100',
            bob.blake160,
            feeRate,
            '0'
          )
        } catch (e) {
          error = e
        }
        expect(error).toBeInstanceOf(CapacityNotEnough)
      })
    })
  })
})
