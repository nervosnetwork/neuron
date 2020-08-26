import { when } from 'jest-when'
import { getConnection } from 'typeorm'
import { initConnection } from '../../../src/database/chain/ormconfig'
import OutputEntity from '../../../src/database/chain/entities/output'
import { TargetOutput } from '../../../src/services/tx/transaction-generator'
import TransactionSize from '../../../src/models/transaction-size'
import TransactionFee from '../../../src/models/transaction-fee'
import Script, { ScriptHashType } from '../../../src/models/chain/script'
import Transaction from '../../../src/models/chain/transaction'
import OutPoint from '../../../src/models/chain/out-point'
import Output, { OutputStatus } from '../../../src/models/chain/output'
import BlockHeader from '../../../src/models/chain/block-header'
import MultiSign from '../../../src/models/multi-sign'
import SystemScriptInfo from '../../../src/models/system-script-info'
import AssetAccountInfo from '../../../src/models/asset-account-info'
import BufferUtils from '../../../src/utils/buffer'
import WitnessArgs from '../../../src/models/chain/witness-args'
import { serializeWitnessArgs, AddressPrefix } from '@nervosnetwork/ckb-sdk-utils'
import { CapacityNotEnough } from '../../../src/exceptions/wallet'
import LiveCell from '../../../src/models/chain/live-cell'
import AddressGenerator from '../../../src/models/address-generator'
import {keyInfos} from '../../setupAndTeardown/public-key-info.fixture'

const randomHex = (length: number = 64): string => {
  const str: string = Array.from({ length })
    .map(() => Math.floor(Math.random() * 16).toString(16))
    .join('')

  return `0x${str}`
}

const toShannon = (ckb: string) => `${ckb}00000000`

const [alice, bob] = keyInfos
const walletId1 = alice.walletId

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

const stubbedIndexerService = {
  getInstance: jest.fn(),
  getLiveCellsByScript: jest.fn()
}

stubbedIndexerService.getInstance.mockReturnValue(stubbedIndexerService)
jest.doMock('../../../src/services/indexer-service', () => {
  return stubbedIndexerService
});
import TransactionGenerator from '../../../src/services/tx/transaction-generator'
import HdPublicKeyInfo from '../../../src/database/chain/entities/hd-public-key-info'

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

    stubbedIndexerService.getLiveCellsByScript.mockReset()
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
    output.lockHash = who.lockScript.computeHash()
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

  beforeEach(async () => {
    const connection = getConnection()
    await connection.synchronize(true)

    const keyEntities = keyInfos.map(d => HdPublicKeyInfo.fromObject(d))
    await getConnection().manager.save(keyEntities)
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
          walletId1,
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
          walletId1,
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
          walletId1,
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
          walletId1,
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
          walletId1,
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
            walletId1,
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
              walletId1,
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
            walletId1,
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
            walletId1,
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
          walletId1,
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
          walletId1,
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
          walletId1,
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
          walletId1,
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

    // const lockHashes: string[] = [bob.lockHash, alice.lockHash]
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
        walletId1,
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
        walletId1,
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
        walletId1,
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
          walletId1,
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
          walletId1,
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
        walletId1,
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
        walletId1,
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
        walletId1,
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
        walletId1,
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
        walletId1,
        bob.address,
        '0'
      )

      const expectCapacity = '300000000000'

      expect(tx.outputs!.length).toEqual(1)
      expect(tx.outputs![0].capacity).toEqual(expectCapacity)
    })

    it('in fee mode, fee = 999', async () => {
      const tx = await TransactionGenerator.generateDepositAllTx(
        walletId1,
        bob.address,
        '999'
      )

      const expectCapacity = BigInt('300000000000') - BigInt('999')

      expect(tx.outputs!.length).toEqual(1)
      expect(tx.outputs![0].capacity).toEqual(expectCapacity.toString())
    })

    it('in feeRate mode, feeRate = 0', async () => {
      const tx = await TransactionGenerator.generateDepositAllTx(
        walletId1,
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
        walletId1,
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
        walletId1,
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
        walletId1,
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
      lock: SystemScriptInfo.generateMultiSignScript(new MultiSign().args(bob.lockScript.args, 100, '0x7080018000001'))
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
    const davidAnyoneCanPayLockScript = assetAccountInfo.generateAnyoneCanPayScript('0x' + '0'.repeat(40))

    // generate anyone-can-pay live cell
    const generateLiveCell = (
      capacity: string,
      amount: string | undefined = undefined,
      tokenID: string | undefined = undefined,
      lockScript: Script = bobAnyoneCanPayLockScript
    ) => {
      const liveCell = {
        block_hash: randomHex(),
        out_point: {
          tx_hash: randomHex(),
          index: '0x0'
        },
        cell_output: {
          capacity: capacity,
          lock: {
            code_hash: lockScript.codeHash,
            args: lockScript.args,
            hash_type: lockScript.hashType.toString(),
          },
        },
        data: '0x'
      }
      if (tokenID) {
        const typeScript = assetAccountInfo.generateSudtScript(tokenID)
        // @ts-ignore
        liveCell.cell_output.type = {
          code_hash: typeScript.codeHash,
          args: typeScript.args,
          hash_type: typeScript.hashType.toString(),
        }
      }
      liveCell.data = amount ? BufferUtils.writeBigUInt128LE(BigInt(amount)) : '0x'

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
      describe('sending from bob to alice', () => {
        let tx: Transaction
        let expectedTxSize: number
        let expectedTxFee: string
        beforeEach(async () => {
          when(stubbedIndexerService.getLiveCellsByScript)
            .calledWith(bobAnyoneCanPayLockScript).mockResolvedValue([
              generateLiveCell(toShannon('70'), undefined, undefined, bobAnyoneCanPayLockScript)
            ])
            .calledWith(aliceAnyoneCanPayLockScript).mockResolvedValue([
              generateLiveCell(toShannon('61'), undefined, undefined, aliceAnyoneCanPayLockScript)
            ])

          const targetOutput: Output = Output.fromObject({
            capacity: toShannon('61'),
            lock: aliceAnyoneCanPayLockScript,
            type: null,
            data: '0x',
          })

          tx = await TransactionGenerator.generateAnyoneCanPayToCKBTx(
            walletId1,
            [bobAnyoneCanPayLockScript],
            targetOutput,
            (1 * 10**8).toString(),
            bob.lockScript.args,
            feeRate,
            '0'
          )
          tx.witnesses[0] = serializeWitnessArgs(WitnessArgs.emptyLock().toSDK())

          expectedTxSize = TransactionSize.tx(tx)
          expectedTxFee = TransactionFee.fee(expectedTxSize, BigInt(feeRate)).toString()
        });
        it('calculates fees', async () => {
          expect(tx.fee).toEqual(expectedTxFee)
        })
        it('generates inputs and outputs', () => {
          expect(tx.inputs.length).toEqual(2)
          expect(tx.outputs.length).toEqual(2)

          const inputCapacities = tx.inputs
            .map(input => BigInt(input.capacity))
            .reduce((result, c) => result + c, BigInt(0))
          const outputCapacities = tx.outputs
            .map(output => BigInt(output.capacity))
            .reduce((result, c) => result + c, BigInt(0))

          expect(inputCapacities - outputCapacities).toEqual(BigInt(expectedTxFee))
        });
      });

      describe('when capacity is not sufficient', () => {
        const targetOutput: Output = Output.fromObject({
          capacity: toShannon('61'),
          lock: aliceAnyoneCanPayLockScript,
          type: null,
          data: '0x',
        })
        beforeEach(() => {
          when(stubbedIndexerService.getLiveCellsByScript)
            .calledWith(bobAnyoneCanPayLockScript).mockResolvedValue([
              generateLiveCell(toShannon('70'), undefined, undefined, bobAnyoneCanPayLockScript),
            ])
            .calledWith(davidAnyoneCanPayLockScript).mockResolvedValue([
              generateLiveCell(toShannon('70'), undefined, undefined, davidAnyoneCanPayLockScript),
            ])
            .calledWith(aliceAnyoneCanPayLockScript).mockResolvedValue([
              generateLiveCell(toShannon('61'), undefined, undefined, aliceAnyoneCanPayLockScript),
            ])
        })
        it('throws error CapacityNotEnough', async () => {
          let error
          try {
            await TransactionGenerator.generateAnyoneCanPayToCKBTx(
              walletId1,
              [bobAnyoneCanPayLockScript],
              targetOutput,
              (10 * 10**8).toString(),
              bob.lockScript.args,
              feeRate,
              '0'
            )
          } catch (e) {
            error = e
          }
          expect(error).toBeInstanceOf(CapacityNotEnough)
        })
      })

      describe('when total capacity of multiple cells is sufficient for a transfer', () => {
        const targetOutput: Output = Output.fromObject({
          capacity: toShannon('61'),
          lock: aliceAnyoneCanPayLockScript,
          type: null,
          data: '0x',
        })
        let expectedTxSize: number
        let expectedTxFee: string
        let tx: Transaction
        beforeEach(async  () => {
          when(stubbedIndexerService.getLiveCellsByScript)
            .calledWith(bobAnyoneCanPayLockScript).mockResolvedValue([
              generateLiveCell(toShannon('62'), undefined, undefined, bobAnyoneCanPayLockScript),
              generateLiveCell(toShannon('62'), undefined, undefined, bobAnyoneCanPayLockScript),
            ])
            .calledWith(aliceAnyoneCanPayLockScript).mockResolvedValue([
              generateLiveCell(toShannon('61'), undefined, undefined, aliceAnyoneCanPayLockScript),
            ])

          tx = await TransactionGenerator.generateAnyoneCanPayToCKBTx(
            walletId1,
            [bobAnyoneCanPayLockScript],
            targetOutput,
            (1 * 10**8).toString(),
            bob.lockScript.args,
            feeRate,
            '0'
          )

          tx.witnesses[0] = serializeWitnessArgs(WitnessArgs.emptyLock().toSDK())
          tx.witnesses[1] = '0x'

          expectedTxSize = TransactionSize.tx(tx)
          expectedTxFee = TransactionFee.fee(expectedTxSize, BigInt(feeRate)).toString()
        });

        it('calculates fees', () => {
          expect(tx.fee).toEqual(expectedTxFee)

          const inputCapacities = tx.inputs
            .map(input => BigInt(input.capacity))
            .reduce((result, c) => result + c, BigInt(0))
          const outputCapacities = tx.outputs
            .map(output => BigInt(output.capacity))
            .reduce((result, c) => result + c, BigInt(0))

          expect(inputCapacities - outputCapacities).toEqual(BigInt(expectedTxFee))
        });
        it('merges the cells in need', async () => {
          expect(tx.inputs.length).toEqual(3)
          expect(tx.outputs.length).toEqual(2)
        })
      });

      describe('when ACP cell has enough capacity for transfer amount but insufficient for fee', () => {
        const targetOutput: Output = Output.fromObject({
          capacity: toShannon('61'),
          lock: aliceAnyoneCanPayLockScript,
          type: null,
          data: '0x',
        })
        let tx: Transaction
        let expectedTxSize: number
        let expectedTxFee: string

        beforeEach(async () => {
          when(stubbedIndexerService.getLiveCellsByScript)
            .calledWith(bobAnyoneCanPayLockScript).mockResolvedValue([
              generateLiveCell(toShannon('62'), undefined, undefined, bobAnyoneCanPayLockScript),
            ])
            .calledWith(aliceAnyoneCanPayLockScript).mockResolvedValue([
              generateLiveCell(toShannon('61'), undefined, undefined, aliceAnyoneCanPayLockScript),
            ])

            tx = await TransactionGenerator.generateAnyoneCanPayToCKBTx(
              walletId1,
              [bobAnyoneCanPayLockScript],
              targetOutput,
              (1 * 10**8).toString(),
              bob.lockScript.args,
              feeRate,
              '0'
            )

            tx.witnesses[0] = serializeWitnessArgs(WitnessArgs.emptyLock().toSDK())
            tx.witnesses[1] = serializeWitnessArgs(WitnessArgs.emptyLock().toSDK())

            expectedTxSize = TransactionSize.tx(tx)
            expectedTxFee = TransactionFee.fee(expectedTxSize, BigInt(feeRate)).toString()
        });
        it('calculates fees', () => {
          expect(tx.fee).toEqual(expectedTxFee)

          const inputCapacities = tx.inputs
            .map(input => BigInt(input.capacity))
            .reduce((result, c) => result + c, BigInt(0))
          const outputCapacities = tx.outputs
            .map(output => BigInt(output.capacity))
            .reduce((result, c) => result + c, BigInt(0))

          expect(inputCapacities - outputCapacities).toEqual(BigInt(expectedTxFee))
        });
        it('uses a non ACP cell to cover fees', async () => {
          expect(tx.inputs.length).toEqual(3)
          expect(tx.outputs.length).toEqual(3)
        })
      });

      describe('when the total capacity of ACP cells is insufficient for the transfer amount', () => {
        const targetOutput: Output = Output.fromObject({
          capacity: toShannon('61'),
          lock: aliceAnyoneCanPayLockScript,
          type: null,
          data: '0x',
        })
        beforeEach(() => {
          when(stubbedIndexerService.getLiveCellsByScript)
            .calledWith(bobAnyoneCanPayLockScript).mockResolvedValue([
              generateLiveCell(toShannon('61'), undefined, undefined, bobAnyoneCanPayLockScript),
            ])
            .calledWith(aliceAnyoneCanPayLockScript).mockResolvedValue([
              generateLiveCell(toShannon('61'), undefined, undefined, aliceAnyoneCanPayLockScript),
            ])
        })
        it('throws error CapacityNotEnough', async () => {
          let error
          try {
            await TransactionGenerator.generateAnyoneCanPayToCKBTx(
              walletId1,
              [bobAnyoneCanPayLockScript],
              targetOutput,
              (1 * 10**8).toString(),
              bob.lockScript.args,
              feeRate,
              '0'
            )
          } catch (e) {
            error = e
          }
          expect(error).toBeInstanceOf(CapacityNotEnough)
        })
      });

      describe('when sending all', () => {
        const targetOutput: Output = Output.fromObject({
          capacity: toShannon('61'),
          lock: aliceAnyoneCanPayLockScript,
          type: null,
          data: '0x',
        })
        let tx: Transaction
        beforeEach(async () => {
          when(stubbedIndexerService.getLiveCellsByScript)
            .calledWith(bobAnyoneCanPayLockScript).mockResolvedValue([
              generateLiveCell(toShannon('70'), undefined, undefined, bobAnyoneCanPayLockScript),
            ])
            .calledWith(aliceAnyoneCanPayLockScript).mockResolvedValue([
              generateLiveCell(toShannon('61'), undefined, undefined, aliceAnyoneCanPayLockScript),
            ])
          tx = await TransactionGenerator.generateAnyoneCanPayToCKBTx(
            walletId1,
            [bobAnyoneCanPayLockScript],
            targetOutput,
            'all',
            bob.lockScript.args,
            feeRate,
            '0'
          )
        });

        it('capacity remains the minimum 61', () => {
          const changeOutput = tx.outputs.filter(
            output => output.lock.computeHash() === bobAnyoneCanPayLockScript.computeHash()
          )[0]
          expect(changeOutput.capacity).toEqual(toShannon('61'))
        })
      });
    })

    describe('generateAnyoneCanPayToSudtTx, with feeRate 1000', () => {
      const tokenID = bob.lockScript.computeHash()
      const feeRate = '1000'
      let tx: Transaction
      let expectedTxSize: number
      let expectedTxFee: string
      describe('when capacity is sufficient for fee', () => {
        beforeEach(async () => {
          const targetLiveCellEntity = generateLiveCell(toShannon('142'), '100', tokenID, aliceAnyoneCanPayLockScript)

          when(stubbedIndexerService.getLiveCellsByScript)
            .calledWith(bobAnyoneCanPayLockScript).mockResolvedValue([
              generateLiveCell(toShannon('150'), '1000', tokenID),
            ])
            .calledWith(aliceAnyoneCanPayLockScript).mockResolvedValue([
              targetLiveCellEntity
            ])

          const targetLiveCell: LiveCell = LiveCell.fromLumos(targetLiveCellEntity)

          const targetOutput: Output = Output.fromObject({
            capacity: targetLiveCell.capacity,
            lock: targetLiveCell.lock(),
            type: targetLiveCell.type(),
            data: targetLiveCell.data,
          })

          tx = await TransactionGenerator.generateAnyoneCanPayToSudtTx(
            walletId1,
            [bobAnyoneCanPayLockScript],
            targetOutput,
            '100',
            bob.lockScript.args,
            feeRate,
            '0'
          )
          tx.witnesses[0] = serializeWitnessArgs(WitnessArgs.emptyLock().toSDK())

          expectedTxSize = TransactionSize.tx(tx)
          expectedTxFee = TransactionFee.fee(expectedTxSize, BigInt(feeRate)).toString()
        })
        it('the size of inputs and outputs should remain 2', () => {
          expect(tx.inputs.length).toEqual(2)
          expect(tx.outputs.length).toEqual(2)
          expect(tx.outputs.map(o => o.lockHash)).toEqual([bobAnyoneCanPayLockScript.computeHash(), aliceAnyoneCanPayLockScript.computeHash()])
        });
        it('calculates fees', () => {
          expect(tx.fee).toEqual(expectedTxFee)

          const expectedOutputCapacities: bigint[] = [BigInt(toShannon('150')) - BigInt(tx.fee), BigInt(toShannon('142'))]
          expect(tx.outputs.map(o => BigInt(o.capacity))).toEqual(expectedOutputCapacities)

          const inputCapacities = tx.inputs
            .map(input => BigInt(input.capacity))
            .reduce((result, c) => result + c, BigInt(0))
          const outputCapacities = tx.outputs
            .map(output => BigInt(output.capacity))
            .reduce((result, c) => result + c, BigInt(0))

          expect(inputCapacities - outputCapacities).toEqual(BigInt(expectedTxFee))
        });
        it('updates output data', () => {
          expect(tx.outputsData).toEqual([BufferUtils.writeBigUInt128LE(BigInt(900)), BufferUtils.writeBigUInt128LE(BigInt(200))])
        })
      });

      describe('when both token balance and capacity are insufficient', () => {
        let targetOutput: Output
        beforeEach(() => {
          const targetLiveCellEntity = generateLiveCell(toShannon('142'), '100', tokenID, aliceAnyoneCanPayLockScript)

          when(stubbedIndexerService.getLiveCellsByScript)
          .calledWith(bobAnyoneCanPayLockScript).mockResolvedValue([
            generateLiveCell(toShannon('150'), '100', tokenID),
          ])
          .calledWith(davidAnyoneCanPayLockScript).mockResolvedValue([
            generateLiveCell(toShannon('150'), '100', tokenID),
          ])
          .calledWith(aliceAnyoneCanPayLockScript).mockResolvedValue([
            targetLiveCellEntity
          ])

          const targetLiveCell: LiveCell = LiveCell.fromLumos(targetLiveCellEntity)
          targetOutput = Output.fromObject({
            capacity: targetLiveCell.capacity,
            lock: targetLiveCell.lock(),
            type: targetLiveCell.type(),
            data: targetLiveCell.data,
          })

        })
        it('throws error CapacityNotEnough', async () => {
          let error
          try {
            await TransactionGenerator.generateAnyoneCanPayToSudtTx(
              walletId1,
              [bobAnyoneCanPayLockScript],
              targetOutput,
              '101',
              bob.lockScript.args,
              feeRate,
              '0'
            )
          } catch (e) {
            error = e
          }
          expect(error).toBeInstanceOf(CapacityNotEnough)
        })
      });

      describe('when token balance is sufficient for transfering, but capacity is insufficient for fees', () => {
        beforeEach(async () => {
          const targetLiveCellEntity = generateLiveCell(toShannon('142'), '100', tokenID, aliceAnyoneCanPayLockScript)

          when(stubbedIndexerService.getLiveCellsByScript)
            .calledWith(bobAnyoneCanPayLockScript).mockResolvedValue([
              generateLiveCell(toShannon('142'), '1000', tokenID),
            ])
            .calledWith(aliceAnyoneCanPayLockScript).mockResolvedValue([
              targetLiveCellEntity
            ])

          const targetLiveCell: LiveCell = LiveCell.fromLumos(targetLiveCellEntity)

          const targetOutput: Output = Output.fromObject({
            capacity: targetLiveCell.capacity,
            lock: targetLiveCell.lock(),
            type: targetLiveCell.type(),
            data: targetLiveCell.data,
          })

          tx = await TransactionGenerator.generateAnyoneCanPayToSudtTx(
            walletId1,
            [bobAnyoneCanPayLockScript],
            targetOutput,
            '100',
            bob.lockScript.args,
            feeRate,
            '0'
          )

          tx.witnesses[0] = serializeWitnessArgs(WitnessArgs.emptyLock().toSDK())
          tx.witnesses[1] = serializeWitnessArgs(WitnessArgs.emptyLock().toSDK())

          expectedTxSize = TransactionSize.tx(tx)
          expectedTxFee = TransactionFee.fee(expectedTxSize, BigInt(feeRate)).toString()
        });
        it('uses a non ACP cell to cover fees', async () => {
          expect(tx.inputs.length).toEqual(3)
          expect(tx.outputs.length).toEqual(3)

          expect(tx.outputs.map(o => o.lockHash)).toEqual([
            bobAnyoneCanPayLockScript.computeHash(),
            aliceAnyoneCanPayLockScript.computeHash(),
            bob.lockScript.computeHash(),
          ])
        })
        it('calculates fees', () => {
          expect(tx.fee).toEqual(expectedTxFee)
          const expectedOutputCapacities: bigint[] = [BigInt(toShannon('142')), BigInt(toShannon('142')), BigInt(toShannon('1000')) - BigInt(tx.fee)]
          expect(tx.outputs.map(o => BigInt(o.capacity))).toEqual(expectedOutputCapacities)

          const inputCapacities = tx.inputs
            .map(input => BigInt(input.capacity))
            .reduce((result, c) => result + c, BigInt(0))
          const outputCapacities = tx.outputs
            .map(output => BigInt(output.capacity))
            .reduce((result, c) => result + c, BigInt(0))

          expect(inputCapacities - outputCapacities).toEqual(BigInt(expectedTxFee))
        })
        it('updates output data', () => {
          expect(tx.outputsData).toEqual([BufferUtils.writeBigUInt128LE(BigInt(900)), BufferUtils.writeBigUInt128LE(BigInt(200)), '0x'])
        })
      });

      describe('when some of ACP cells not satisfy the token transfer amount', () => {
        beforeEach(async () => {
          const targetLiveCellEntity = generateLiveCell(toShannon('142'), '100', tokenID, aliceAnyoneCanPayLockScript)

          when(stubbedIndexerService.getLiveCellsByScript)
            .calledWith(bobAnyoneCanPayLockScript).mockResolvedValue([
              generateLiveCell(toShannon('143'), '50', tokenID),
              generateLiveCell(toShannon('142'), '1000', tokenID),
            ])
            .calledWith(aliceAnyoneCanPayLockScript).mockResolvedValue([
              targetLiveCellEntity
            ])

          const targetLiveCell: LiveCell = LiveCell.fromLumos(targetLiveCellEntity)

          const targetOutput: Output = Output.fromObject({
            capacity: targetLiveCell.capacity,
            lock: targetLiveCell.lock(),
            type: targetLiveCell.type(),
            data: targetLiveCell.data,
          })

          tx = await TransactionGenerator.generateAnyoneCanPayToSudtTx(
            walletId1,
            [bobAnyoneCanPayLockScript],
            targetOutput,
            '100',
            bob.lockScript.args,
            feeRate,
            '0'
          )

          tx.witnesses[0] = serializeWitnessArgs(WitnessArgs.emptyLock().toSDK())
          tx.witnesses[1] = '0x'

          expectedTxSize = TransactionSize.tx(tx)
          expectedTxFee = TransactionFee.fee(expectedTxSize, BigInt(feeRate)).toString()
        });
        it('merges multiple ACP cells to spare sufficient capacity to cover fees', async () => {
          expect(tx.inputs.length).toEqual(3)
          expect(tx.outputs.length).toEqual(2)

          expect(tx.outputs.map(o => o.lockHash)).toEqual([
            bobAnyoneCanPayLockScript.computeHash(),
            aliceAnyoneCanPayLockScript.computeHash(),
          ])
        })
        it('calculates fees', () => {
          expect(tx.fee).toEqual(expectedTxFee)

          const inputCapacities = tx.inputs
            .map(input => BigInt(input.capacity))
            .reduce((result, c) => result + c, BigInt(0))
          const outputCapacities = tx.outputs
            .map(output => BigInt(output.capacity))
            .reduce((result, c) => result + c, BigInt(0))

          expect(inputCapacities - outputCapacities).toEqual(BigInt(expectedTxFee))

          const expectedOutputCapacities: bigint[] = [
            BigInt(toShannon('143')) + BigInt(toShannon('142')) - BigInt(tx.fee),
            BigInt(toShannon('142')),
          ]
          expect(tx.outputs.map(o => BigInt(o.capacity))).toEqual(expectedOutputCapacities)

        })
        it('updates output data', () => {
          expect(tx.outputsData).toEqual([
            BufferUtils.writeBigUInt128LE(BigInt(950)),
            BufferUtils.writeBigUInt128LE(BigInt(200)),
          ])
        })
      });


      describe('when token balance is insufficient for transfer', () => {
        let targetOutput: Output
        beforeEach(() => {
          const targetLiveCellEntity = generateLiveCell(toShannon('142'), '100', tokenID, aliceAnyoneCanPayLockScript)

          when(stubbedIndexerService.getLiveCellsByScript)
            .calledWith(bobAnyoneCanPayLockScript).mockResolvedValue([
              generateLiveCell(toShannon('142'), '50', tokenID),
            ])
            .calledWith(aliceAnyoneCanPayLockScript).mockResolvedValue([
              targetLiveCellEntity
            ])

          const targetLiveCell: LiveCell = LiveCell.fromLumos(targetLiveCellEntity)

          targetOutput = Output.fromObject({
            capacity: targetLiveCell.capacity,
            lock: targetLiveCell.lock(),
            type: targetLiveCell.type(),
            data: targetLiveCell.data,
          })
        });
        it('throws error CapacityNotEnough', async () => {
          let error
          try {
            await TransactionGenerator.generateAnyoneCanPayToSudtTx(
              walletId1,
              [bobAnyoneCanPayLockScript],
              targetOutput,
              '100',
              bob.lockScript.args,
              feeRate,
              '0'
            )
          } catch (e) {
            error = e
          }
          expect(error).toBeInstanceOf(CapacityNotEnough)
        })
      });

      describe('transfers all token balance', () => {
        beforeEach(async () => {
          const targetLiveCellEntity = generateLiveCell(toShannon('142'), '100', tokenID, aliceAnyoneCanPayLockScript)

          when(stubbedIndexerService.getLiveCellsByScript)
            .calledWith(bobAnyoneCanPayLockScript).mockResolvedValue([
              generateLiveCell(toShannon('1000'), '1000', tokenID),
            ])
            .calledWith(aliceAnyoneCanPayLockScript).mockResolvedValue([
              targetLiveCellEntity
            ])

          const targetLiveCell: LiveCell = LiveCell.fromLumos(targetLiveCellEntity)

          const targetOutput: Output = Output.fromObject({
            capacity: targetLiveCell.capacity,
            lock: targetLiveCell.lock(),
            type: targetLiveCell.type(),
            data: targetLiveCell.data,
          })

          tx = await TransactionGenerator.generateAnyoneCanPayToSudtTx(
            walletId1,
            [bobAnyoneCanPayLockScript],
            targetOutput,
            'all',
            bob.lockScript.args,
            feeRate,
            '0'
          )

          tx.witnesses[0] = serializeWitnessArgs(WitnessArgs.emptyLock().toSDK())

          expectedTxSize = TransactionSize.tx(tx)
          expectedTxFee = TransactionFee.fee(expectedTxSize, BigInt(feeRate)).toString()
        })
        it('calculates fees', () => {
          expect(tx.fee).toEqual(expectedTxFee)

          const expectedOutputCapacities: bigint[] = [BigInt(toShannon('1000')) - BigInt(tx.fee), BigInt(toShannon('142'))]
          expect(tx.outputs.map(o => BigInt(o.capacity))).toEqual(expectedOutputCapacities)

          const inputCapacities = tx.inputs
            .map(input => BigInt(input.capacity))
            .reduce((result, c) => result + c, BigInt(0))
          const outputCapacities = tx.outputs
            .map(output => BigInt(output.capacity))
            .reduce((result, c) => result + c, BigInt(0))

          expect(inputCapacities - outputCapacities).toEqual(BigInt(expectedTxFee))
        })
        it('the size of inputs and outputs should remain 2', async () => {
          expect(tx.inputs.length).toEqual(2)
          expect(tx.outputs.length).toEqual(2)

          expect(tx.outputs.map(o => o.lockHash)).toEqual([bobAnyoneCanPayLockScript.computeHash(), aliceAnyoneCanPayLockScript.computeHash()])
        })
        it('updates output data', () => {
          expect(tx.outputsData).toEqual([BufferUtils.writeBigUInt128LE(BigInt(0)), BufferUtils.writeBigUInt128LE(BigInt(1100))])
          expect(tx.sudtInfo!.amount).toEqual('1000')
        })
      });
    })

    describe('generateCreateAnyoneCanPayTx', () => {
      const feeRate = '1000'
      it('create ckb', async () => {
        const tx = await TransactionGenerator.generateCreateAnyoneCanPayTx(
          'CKBytes',
          walletId1,
          alice.lockScript.args,
          bob.lockScript.args,
          feeRate,
          '0',
        )

        // check fee
        const inputCapacities = tx.inputs
          .map(i => BigInt(i.capacity))
          .reduce((result, c) => result + c, BigInt(0))
        const outputCapacities = tx.outputs
          .map(o => BigInt(o.capacity))
          .reduce((result, c) => result + c, BigInt(0))
        expect(tx.fee).toEqual((inputCapacities - outputCapacities).toString())

        const expectedFee = TransactionFee.fee(
          TransactionSize.tx(tx) + TransactionSize.secpLockWitness(),
          BigInt(feeRate)
        ).toString()
        expect(tx.fee).toEqual(expectedFee)

        // check output
        expect(tx.outputs.length).toEqual(2)

        const output = tx.outputs[0]
        expect(output.capacity).toEqual(BigInt(61 * 10**8).toString())
        expect(!!output.type).toBe(false)
        expect(assetAccountInfo.isAnyoneCanPayScript(output.lock)).toBe(true)
        expect(output.data).toEqual('0x')

        const changeOutput = tx.outputs[1]
        expect(SystemScriptInfo.isSecpScript(changeOutput.lock)).toBe(true)
      })

      it('create sudt', async () => {
        const tokenID = '0x' + '0'.repeat(64)
        const tx = await TransactionGenerator.generateCreateAnyoneCanPayTx(
          tokenID,
          walletId1,
          alice.lockScript.args,
          bob.lockScript.args,
          feeRate,
          '0',
        )

        // check fee
        const inputCapacities = tx.inputs
          .map(i => BigInt(i.capacity))
          .reduce((result, c) => result + c, BigInt(0))
        const outputCapacities = tx.outputs
          .map(o => BigInt(o.capacity))
          .reduce((result, c) => result + c, BigInt(0))
        expect(tx.fee).toEqual((inputCapacities - outputCapacities).toString())

        // check output
        expect(tx.outputs.length).toEqual(2)

        const output = tx.outputs[0]
        expect(output.capacity).toEqual(BigInt(142 * 10**8).toString())
        expect(assetAccountInfo.isSudtScript(output.type!)).toBe(true)
        expect(assetAccountInfo.isAnyoneCanPayScript(output.lock)).toBe(true)
        expect(output.data).toEqual('0x' + '0'.repeat(32))

        const changeOutput = tx.outputs[1]
        expect(SystemScriptInfo.isSecpScript(changeOutput.lock)).toBe(true)
      })
    })
  })

  describe('generateCreateAnyoneCanPayTxUseAllBalance', () => {
    const assetAccountInfo = new AssetAccountInfo()
    const feeRate = '1000'
    it('create ckb', async () => {
      const cells: OutputEntity[] = [
        generateCell(toShannon('100'), OutputStatus.Live, false, null),
      ]
      await getConnection().manager.save(cells)

      const tx = await TransactionGenerator.generateCreateAnyoneCanPayTxUseAllBalance(
        'CKBytes',
        walletId1,
        alice.lockScript.args,
        feeRate,
        '0',
      )

      // check fee
      const inputCapacities = tx.inputs
        .map(i => BigInt(i.capacity))
        .reduce((result, c) => result + c, BigInt(0))
      const outputCapacities = tx.outputs
        .map(o => BigInt(o.capacity))
        .reduce((result, c) => result + c, BigInt(0))
      expect(tx.fee).toEqual((inputCapacities - outputCapacities).toString())

      const expectedFee = TransactionFee.fee(
        TransactionSize.tx(tx) + TransactionSize.secpLockWitness(),
        BigInt(feeRate)
      ).toString()
      expect(tx.fee).toEqual(expectedFee)

      // check output
      expect(tx.outputs.length).toEqual(1)

      const output = tx.outputs[0]
      expect(output.capacity).toEqual((BigInt(100 * 10**8) - BigInt(tx.fee)).toString())
      expect(!!output.type).toBe(false)
      expect(assetAccountInfo.isAnyoneCanPayScript(output.lock)).toBe(true)
      expect(output.data).toEqual('0x')
    })

    it('create sudt', async () => {
      const cells: OutputEntity[] = [
        generateCell(toShannon('143'), OutputStatus.Live, false, null),
      ]
      await getConnection().manager.save(cells)

      const tokenID = '0x' + '0'.repeat(64)
      const tx = await TransactionGenerator.generateCreateAnyoneCanPayTxUseAllBalance(
        tokenID,
        walletId1,
        alice.lockScript.args,
        feeRate,
        '0',
      )

      // check fee
      const inputCapacities = tx.inputs
        .map(i => BigInt(i.capacity))
        .reduce((result, c) => result + c, BigInt(0))
      const outputCapacities = tx.outputs
        .map(o => BigInt(o.capacity))
        .reduce((result, c) => result + c, BigInt(0))
      expect(tx.fee).toEqual((inputCapacities - outputCapacities).toString())

      // check output
      expect(tx.outputs.length).toEqual(1)

      const output = tx.outputs[0]
      expect(output.capacity).toEqual((BigInt(143 * 10**8) - BigInt(tx.fee)).toString())
      expect(assetAccountInfo.isSudtScript(output.type!)).toBe(true)
      expect(assetAccountInfo.isAnyoneCanPayScript(output.lock)).toBe(true)
      expect(output.data).toEqual('0x' + '0'.repeat(32))
    })
  })
})
