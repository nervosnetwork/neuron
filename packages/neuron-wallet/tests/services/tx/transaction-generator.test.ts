import { when } from 'jest-when'
import { getConnection } from 'typeorm'
import { config, helpers } from '@ckb-lumos/lumos'
import { initConnection } from '../../../src/database/chain/ormconfig'
import OutputEntity from '../../../src/database/chain/entities/output'
import InputEntity from '../../../src/database/chain/entities/input'
import TransactionEntity from '../../../src/database/chain/entities/transaction'
import { TargetOutput } from '../../../src/services/tx/transaction-generator'
import TransactionSize from '../../../src/models/transaction-size'
import TransactionFee from '../../../src/models/transaction-fee'
import Script, { ScriptHashType } from '../../../src/models/chain/script'
import Transaction, { TransactionStatus } from '../../../src/models/chain/transaction'
import OutPoint from '../../../src/models/chain/out-point'
import Output, { OutputStatus } from '../../../src/models/chain/output'
import BlockHeader from '../../../src/models/chain/block-header'
import Multisig from '../../../src/models/multisig'
import SystemScriptInfo from '../../../src/models/system-script-info'
import AssetAccountInfo from '../../../src/models/asset-account-info'
import BufferUtils from '../../../src/utils/buffer'
import WitnessArgs from '../../../src/models/chain/witness-args'
import {
  CapacityNotEnough,
  CurrentWalletNotSet,
  LiveCapacityNotEnough,
  MigrateSudtCellNoTypeError,
  SudtAcpHaveDataError,
  TargetOutputNotFoundError,
} from '../../../src/exceptions'
import LiveCell from '../../../src/models/chain/live-cell'
import { keyInfos } from '../../setupAndTeardown/public-key-info.fixture'

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
  '0x0000000000000000000000000000000000000000000000000000000000000011',
  '0x1234',
  ScriptHashType.Type
)

const fullAddressInfo = {
  lockScript: fullAddressLockScript,
  lockHash: fullAddressLockScript.computeHash(),
  address: helpers.encodeToAddress(fullAddressLockScript, { config: config.predefined.AGGRON4 }),
}

// diff = 1000min
const date = '1580659200000'
const tipTimestamp = '1580599200000'
// number = 1, length = 1800, index = 24
const tipEpoch = '0x7080018000001'
const blockHeader = new BlockHeader('0', tipTimestamp, '0x' + '0'.repeat(64), '0x' + '0'.repeat(64), '0', tipEpoch)

const stubbedQueryIndexer = jest.fn()
jest.doMock('../../../src/block-sync-renderer/index', () => {
  return { queryIndexer: stubbedQueryIndexer }
})
const getCurrentMock = jest.fn()
jest.doMock('../../../src/services/wallets', () => ({
  getInstance() {
    return {
      getCurrent: getCurrentMock,
    }
  },
}))
jest.mock('../../../src/models/asset-account-info', () => {
  const originalModule = jest.requireActual('../../../src/models/asset-account-info').default
  return function () {
    return new originalModule('0x92b197aa1fba0f63633922c61c92375c9c074a93e85963554f5499fe1450d0e6')
  }
})

import TransactionGenerator from '../../../src/services/tx/transaction-generator'
import HdPublicKeyInfo from '../../../src/database/chain/entities/hd-public-key-info'
import AssetAccount from '../../../src/models/asset-account'
import MultisigConfigModel from '../../../src/models/multisig-config'
import MultisigOutput from '../../../src/database/chain/entities/multisig-output'
import { bytes } from '@ckb-lumos/codec'
import { blockchain } from '@ckb-lumos/base'
import { LumosCell } from '../../../src/block-sync-renderer/sync/connector'

describe('TransactionGenerator', () => {
  beforeAll(async () => {
    await initConnection('0x1234')

    // @ts-ignore: Private method
    SystemScriptInfo.getInstance().secpOutPointInfo = new Map<string, OutPoint>([
      [
        '0x92b197aa1fba0f63633922c61c92375c9c074a93e85963554f5499fe1450d0e5',
        new OutPoint('0x71a7ba8fc96349fea0ed3a5c47992e3b4084b031a42264a018e0072e8172e46c', '0'),
      ],
    ])

    // @ts-ignore: Private method
    SystemScriptInfo.getInstance().daoOutPointInfo = new Map<string, OutPoint>([
      [
        '0x92b197aa1fba0f63633922c61c92375c9c074a93e85963554f5499fe1450d0e5',
        new OutPoint('0xe2fb199810d49a4d8beec56718ba2593b665db9d52299a0f9e6e75416d73ff5c', '2'),
      ],
    ])

    // @ts-ignore: Private method
    SystemScriptInfo.getInstance().multiSignOutPointInfo = new Map<string, OutPoint>([
      [
        '0x92b197aa1fba0f63633922c61c92375c9c074a93e85963554f5499fe1450d0e5',
        new OutPoint('0x71a7ba8fc96349fea0ed3a5c47992e3b4084b031a42264a018e0072e8172e46c', '1'),
      ],
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
    daoData?: string | undefined,
    outputData?: string | undefined
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
    if (outputData) {
      output.data = outputData
    }

    return output
  }

  const createInput = (lock: Script, type: Script | undefined, txHash: string) => {
    const input = new InputEntity()

    input.lockArgs = lock.args
    input.lockCodeHash = lock.codeHash
    input.lockHashType = lock.hashType
    input.lockHash = lock.computeHash()
    if (type) {
      input.typeArgs = type!.args
      input.typeCodeHash = type!.codeHash
      input.typeHashType = type!.hashType
      input.typeHash = type!.computeHash()
    }

    input.since = '0x0'
    input.transactionHash = txHash

    return input
  }

  const createOutput = (lock: Script, type: Script, capacity: string, data: string, outpoint: OutPoint) => {
    const output = new OutputEntity()
    output.capacity = capacity
    output.lockArgs = lock.args
    output.lockCodeHash = lock.codeHash
    output.lockHashType = lock.hashType
    output.lockHash = lock.computeHash()
    if (type) {
      output.typeArgs = type!.args
      output.typeCodeHash = type!.codeHash
      output.typeHashType = type!.hashType
      output.typeHash = type!.computeHash()
    }
    output.hasData = true
    output.data = data
    output.outPointTxHash = outpoint.txHash
    output.outPointIndex = outpoint.index
    output.status = 'live'

    return output
  }

  const createMultisigCell = async (capacity: string, status: OutputStatus, who: any) => {
    const multisigCell = new MultisigOutput()
    multisigCell.capacity = capacity
    multisigCell.status = status
    multisigCell.outPointTxHash = randomHex()
    multisigCell.outPointIndex = '0'
    multisigCell.outPointTxHashAddIndex = multisigCell.outPointTxHash + multisigCell.outPointIndex
    multisigCell.lockCodeHash = who.lockScript.codeHash
    multisigCell.lockArgs = who.lockScript.args
    multisigCell.lockHashType = who.lockScript.hashType
    multisigCell.lockHash = who.lockScript.computeHash()
    await getConnection().manager.save(multisigCell)
    return multisigCell
  }

  beforeEach(async () => {
    const connection = getConnection()
    await connection.synchronize(true)

    const keyEntities = keyInfos.map(d => HdPublicKeyInfo.fromObject(d))
    await getConnection().manager.save(keyEntities)
  })

  describe('generateTx', () => {
    beforeEach(async () => {
      const cells: OutputEntity[] = [
        generateCell(toShannon('1000'), OutputStatus.Live, false, null),
        generateCell(toShannon('2000'), OutputStatus.Live, false, null),
      ]
      await getConnection().manager.save(cells)
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
            },
          ],
          bob.address,
          '0',
          feeRate
        )

        const inputCapacities = tx
          .inputs!.map(input => BigInt(input.capacity ?? 0))
          .reduce((result, c) => result + c, BigInt(0))
        const outputCapacities = tx
          .outputs!.map(output => BigInt(output.capacity))
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
            },
          ],
          bob.address,
          '0',
          feeRate
        )

        const inputCapacities = tx
          .inputs!.map(input => BigInt(input.capacity ?? 0))
          .reduce((result, c) => result + c, BigInt(0))
        const outputCapacities = tx
          .outputs!.map(output => BigInt(output.capacity))
          .reduce((result, c) => result + c, BigInt(0))

        const expectedSize: number =
          TransactionSize.tx(tx) + TransactionSize.secpLockWitness() + TransactionSize.emptyWitness()
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
              capacity: BigInt(1000 * 10 ** 8 - 355).toString(),
            },
          ],
          bob.address,
          '0',
          feeRate
        )

        const inputCapacities = tx
          .inputs!.map(input => BigInt(input.capacity ?? 0))
          .reduce((result, c) => result + c, BigInt(0))
        const outputCapacities = tx
          .outputs!.map(output => BigInt(output.capacity))
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
              capacity: (BigInt(1000 * 10 ** 8) - BigInt(464) + BigInt(1)).toString(),
            },
          ],
          bob.address,
          '0',
          feeRate
        )

        const inputCapacities = tx
          .inputs!.map(input => BigInt(input.capacity ?? 0))
          .reduce((result, c) => result + c, BigInt(0))
        const outputCapacities = tx
          .outputs!.map(output => BigInt(output.capacity))
          .reduce((result, c) => result + c, BigInt(0))

        const expectedSize: number =
          TransactionSize.tx(tx) + TransactionSize.secpLockWitness() + TransactionSize.emptyWitness()
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
              capacity: BigInt(1000 * 10 ** 8).toString(),
            },
            {
              address: alice.address,
              capacity: BigInt(2500 * 10 ** 8).toString(),
            },
          ],
          bob.address,
          '0',
          feeRate
        )

        const expectedSize: number =
          TransactionSize.tx(tx) + TransactionSize.secpLockWitness() * 2 + TransactionSize.emptyWitness()
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
                capacity: BigInt(43 * 10 ** 8).toString(),
              },
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
                  capacity: BigInt(42 * 10 ** 8).toString(),
                },
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
                capacity: BigInt(1000 * 10 ** 8).toString(),
              },
              {
                address: bob.address,
                capacity: BigInt(1000 * 10 ** 8).toString(),
              },
            ],
            bob.address,
            '0',
            feeRate
          )

          const expectedSize: number =
            TransactionSize.tx(tx) + TransactionSize.secpLockWitness() + TransactionSize.emptyWitness()
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
              },
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

          const multiSign = new Multisig()
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
            },
          ],
          bob.address,
          fee
        )

        const inputCapacities = tx
          .inputs!.map(input => BigInt(input.capacity ?? 0))
          .reduce((result, c) => result + c, BigInt(0))
        const outputCapacities = tx
          .outputs!.map(output => BigInt(output.capacity))
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
            },
          ],
          bob.address,
          fee
        )

        const inputCapacities = tx
          .inputs!.map(input => BigInt(input.capacity ?? 0))
          .reduce((result, c) => result + c, BigInt(0))
        const outputCapacities = tx
          .outputs!.map(output => BigInt(output.capacity))
          .reduce((result, c) => result + c, BigInt(0))

        expect(inputCapacities - outputCapacities).toEqual(BigInt(fee))
      })

      it('capacity 1000 - fee', async () => {
        const tx: Transaction = await TransactionGenerator.generateTx(
          walletId1,
          [
            {
              address: bob.address,
              capacity: (BigInt(1000 * 10 ** 8) - BigInt(fee)).toString(),
            },
          ],
          bob.address,
          fee
        )

        const inputCapacities = tx
          .inputs!.map(input => BigInt(input.capacity ?? 0))
          .reduce((result, c) => result + c, BigInt(0))
        const outputCapacities = tx
          .outputs!.map(output => BigInt(output.capacity))
          .reduce((result, c) => result + c, BigInt(0))

        expect(inputCapacities - outputCapacities).toEqual(BigInt(fee))
      })

      it('capacity 1000 - fee + 1 shannon', async () => {
        const tx: Transaction = await TransactionGenerator.generateTx(
          walletId1,
          [
            {
              address: bob.address,
              capacity: (BigInt(1000 * 10 ** 8) - BigInt(fee) + BigInt(1)).toString(),
            },
          ],
          bob.address,
          fee
        )

        const inputCapacities = tx
          .inputs!.map(input => BigInt(input.capacity ?? 0))
          .reduce((result, c) => result + c, BigInt(0))
        const outputCapacities = tx
          .outputs!.map(output => BigInt(output.capacity))
          .reduce((result, c) => result + c, BigInt(0))

        expect(inputCapacities - outputCapacities).toEqual(BigInt(fee))
      })
    })
  })

  describe('generateSendingAllTx', () => {
    beforeEach(async () => {
      const cells: OutputEntity[] = [
        generateCell(toShannon('1000'), OutputStatus.Live, false, null),
        generateCell(toShannon('2000'), OutputStatus.Live, false, null),
        generateCell(toShannon('3000'), OutputStatus.Live, false, null, alice),
      ]
      await getConnection().manager.save(cells)
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
        capacity: toShannon('0'),
      },
    ]

    it('with fee 800', async () => {
      const fee = '800'
      const feeInt = BigInt(fee)
      const tx: Transaction = await TransactionGenerator.generateSendingAllTx(walletId1, targetOutputs, fee)

      const inputCapacities = tx
        .inputs!.map(input => BigInt(input.capacity ?? 0))
        .reduce((result, c) => result + c, BigInt(0))
      const outputCapacities = tx
        .outputs!.map(output => BigInt(output.capacity))
        .reduce((result, c) => result + c, BigInt(0))

      expect(inputCapacities - outputCapacities).toEqual(feeInt)
      expect(tx.fee).toEqual(fee)
      targetOutputs.forEach((o, index) => {
        if (index !== targetOutputs.length - 1) {
          expect(o.capacity).toEqual(tx.outputs![index].capacity)
        }
      })
      expect(outputCapacities + BigInt(tx.fee ?? 0)).toEqual(totalCapacities)
    })

    it('with feeRate 1000', async () => {
      const feeRate = '1000'
      const tx: Transaction = await TransactionGenerator.generateSendingAllTx(walletId1, targetOutputs, '0', feeRate)

      const inputCapacities = tx
        .inputs!.map(input => BigInt(input.capacity ?? 0))
        .reduce((result, c) => result + c, BigInt(0))
      const outputCapacities = tx
        .outputs!.map(output => BigInt(output.capacity))
        .reduce((result, c) => result + c, BigInt(0))

      const expectedSize: number =
        TransactionSize.tx(tx) + TransactionSize.secpLockWitness() * 2 + TransactionSize.emptyWitness()

      const expectedFee: bigint = TransactionFee.fee(expectedSize, BigInt(feeRate))
      // 762 is calculated by SDK
      expect(expectedFee).toEqual(BigInt(762))
      expect(inputCapacities - outputCapacities).toEqual(expectedFee)
      expect(tx.fee).toEqual(expectedFee.toString())
      targetOutputs.forEach((o, index) => {
        if (index !== targetOutputs.length - 1) {
          expect(o.capacity).toEqual(tx.outputs![index].capacity)
        }
      })
      expect(outputCapacities + BigInt(tx.fee ?? 0)).toEqual(totalCapacities)
    })

    it('full address with feeRate 1000, 43 capacity', async () => {
      const feeRate = '1000'
      const tx: Transaction = await TransactionGenerator.generateSendingAllTx(
        walletId1,
        [
          {
            address: fullAddressInfo.address,
            capacity: toShannon('43'),
          },
          {
            address: fullAddressInfo.address,
            capacity: toShannon('0'),
          },
        ],
        '0',
        feeRate
      )

      const outputCapacities = tx
        .outputs!.map(output => BigInt(output.capacity))
        .reduce((result, c) => result + c, BigInt(0))

      const expectedSize: number =
        TransactionSize.tx(tx) + TransactionSize.secpLockWitness() * 2 + TransactionSize.emptyWitness()

      const expectedFee: bigint = TransactionFee.fee(expectedSize, BigInt(feeRate))
      expect(tx.fee).toEqual(expectedFee.toString())
      expect(tx.outputs[0].capacity).toEqual(toShannon('43'))
      expect(outputCapacities + BigInt(tx.fee ?? 0)).toEqual(totalCapacities)
    })

    it('full address with feeRate 1000, 42 capacity', async () => {
      const feeRate = '1000'

      expect(
        TransactionGenerator.generateSendingAllTx(
          walletId1,
          [
            {
              address: fullAddressInfo.address,
              capacity: toShannon('42'),
            },
            {
              address: fullAddressInfo.address,
              capacity: toShannon('0'),
            },
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
            },
          ],
          '0',
          feeRate
        )

        expect(tx.outputs[0].lock.codeHash).toEqual(SystemScriptInfo.MULTI_SIGN_CODE_HASH)

        const multiSign = new Multisig()
        const epoch = multiSign.parseSince(tx.outputs[0].lock.args)
        // @ts-ignore: Private method
        const parsedEpoch = multiSign.parseEpoch(epoch)
        expect(parsedEpoch.number).toEqual(BigInt(5))
        expect(parsedEpoch.length).toEqual(BigInt(240))
        expect(parsedEpoch.index).toEqual(BigInt(43))
      })
    })

    it('generator with multisigConfig', async () => {
      await createMultisigCell(toShannon('3000'), OutputStatus.Live, {
        lockScript: Script.fromObject({
          codeHash: '0x5c5069eb0857efc65e1bca0c07df34c31663b3622fd3876c876320fc9634e2a8',
          hashType: ScriptHashType.Type,
          args: '0x87b9ae2c1c7108178e709bf4a89b736bc0f0ae60',
        }),
      })
      const feeRate = '1000'
      const tx: Transaction = await TransactionGenerator.generateSendingAllTx(
        walletId1,
        targetOutputs,
        '0',
        feeRate,
        MultisigConfigModel.fromObject({
          walletId: walletId1,
          r: 1,
          m: 2,
          n: 3,
          blake160s: [
            'ckt1qyqdpymnu202x3p4cnrrgek5czcdsg95xznswjr98y',
            'ckt1qyqdpymnu202x3p4cnrrgek5czcdsg95xznswjr98y',
            'ckt1qyqwqcknusdreymrhhme00hg9af3pr5hcmwqzfxvda',
          ].map(v => helpers.addressToScript(v, {config: config.predefined.AGGRON4}).args),
        })
      )

      const inputCapacities = tx
        .inputs!.map(input => BigInt(input.capacity ?? 0))
        .reduce((result, c) => result + c, BigInt(0))
      const outputCapacities = tx
        .outputs!.map(output => BigInt(output.capacity))
        .reduce((result, c) => result + c, BigInt(0))

      const expectedSize: number = TransactionSize.tx(tx) + TransactionSize.multiSignWitness(1, 2, 3)

      const expectedFee: bigint = TransactionFee.fee(expectedSize, BigInt(feeRate))
      expect(inputCapacities - outputCapacities).toEqual(expectedFee)
      expect(tx.fee).toEqual(expectedFee.toString())
      targetOutputs.forEach((o, index) => {
        if (index !== targetOutputs.length - 1) {
          expect(o.capacity).toEqual(tx.outputs![index].capacity)
        }
      })
      const totalCapacities: bigint = BigInt(toShannon('3000'))
      expect(outputCapacities + BigInt(tx.fee ?? 0)).toEqual(totalCapacities)
    })
  })

  describe('generateDepositTx', () => {
    beforeEach(async () => {
      const cells: OutputEntity[] = [
        generateCell(toShannon('1000'), OutputStatus.Live, false, null),
        generateCell(toShannon('2000'), OutputStatus.Live, false, null),
      ]
      await getConnection().manager.save(cells)
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

      const expectedSize: number =
        TransactionSize.tx(tx) + TransactionSize.secpLockWitness() + TransactionSize.emptyWitness()
      const expectedFee: bigint = TransactionFee.fee(expectedSize, feeRateInt)
      expect(tx.fee).toEqual(expectedFee.toString())
    })

    it('capacity 1000 - fee, no change output', async () => {
      const tx: Transaction = await TransactionGenerator.generateDepositTx(
        walletId1,
        BigInt(1000 * 10 ** 8 - 453).toString(),
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
        BigInt(3000 * 10 ** 8).toString(),
        alice.address,
        bob.address,
        '0',
        feeRate
      )

      const expectedSize: number =
        TransactionSize.tx(tx) + TransactionSize.secpLockWitness() * 2 + TransactionSize.emptyWitness()
      const expectedFee: bigint = TransactionFee.fee(expectedSize, feeRateInt)

      expect(tx.fee).toEqual(expectedFee.toString())
    })
  })

  describe('generateDepositAllTx', () => {
    beforeEach(async () => {
      const cells: OutputEntity[] = [
        generateCell(toShannon('1000'), OutputStatus.Live, false, null),
        generateCell(toShannon('2000'), OutputStatus.Live, false, null),
      ]
      await getConnection().manager.save(cells)
    })

    it('in fee mode, fee = 0', async () => {
      const tx = await TransactionGenerator.generateDepositAllTx(walletId1, bob.address, bob.address, false, '0')

      const expectCapacity = '300000000000'

      expect(tx.outputs!.length).toEqual(1)
      expect(tx.outputs![0].capacity).toEqual(expectCapacity)
    })

    it('in fee mode, fee = 999', async () => {
      const tx = await TransactionGenerator.generateDepositAllTx(walletId1, bob.address, bob.address, false, '999')

      const expectCapacity = BigInt('300000000000') - BigInt('999')

      expect(tx.outputs!.length).toEqual(1)
      expect(tx.outputs![0].capacity).toEqual(expectCapacity.toString())
    })

    it('in feeRate mode, feeRate = 0', async () => {
      const tx = await TransactionGenerator.generateDepositAllTx(walletId1, bob.address, bob.address, false, '0', '0')

      const expectCapacity = BigInt('300000000000')

      expect(tx.outputs!.length).toEqual(1)
      expect(tx.outputs![0].capacity).toEqual(expectCapacity.toString())
    })

    it('in feeRate mode, feeRate = 1000', async () => {
      const tx = await TransactionGenerator.generateDepositAllTx(
        walletId1,
        bob.address,
        bob.address,
        false,
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
        bob.address,
        false,
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

    it('with reserved balance', async () => {
      const tx = await TransactionGenerator.generateDepositAllTx(walletId1, bob.address, bob.address, true, '999')

      const expectCapacity = BigInt('300000000000') - BigInt('999') - BigInt('6200000000')

      expect(tx.outputs!.length).toEqual(2)
      expect(tx.outputs![0].capacity).toEqual(expectCapacity.toString())
    })
  })

  describe('#startWithdrawFromDao', () => {
    const daoData = '0x0000000000000000'
    const depositDaoOutput = generateCell(
      toShannon('3000'),
      OutputStatus.Live,
      true,
      SystemScriptInfo.generateDaoScript(),
      alice,
      daoData
    )
    const depositDaoCell = depositDaoOutput.toModel()
    const depositOutPoint = new OutPoint('0x' + '2'.repeat(64), '0')

    describe('with deposit tx', () => {
      const feeRate = '1000'
      const feeRateInt = BigInt(feeRate)
      beforeEach(async () => {
        const cells: OutputEntity[] = [depositDaoOutput]

        await getConnection().manager.save(cells)
      })

      describe('with enough live capacity', () => {
        beforeEach(async () => {
          const cells: OutputEntity[] = [generateCell(toShannon('1000'), OutputStatus.Live, false, null)]

          await getConnection().manager.save(cells)
        })
        it('generates withdraw tx', async () => {
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

      describe('when no enough live capacity to cover fee', () => {
        beforeEach(async () => {
          const cells: OutputEntity[] = [
            generateCell(toShannon('1000'), OutputStatus.Sent, false, null),
            generateCell(toShannon('1000'), OutputStatus.Dead, false, null),
            generateCell(toShannon('1000'), OutputStatus.Pending, false, null),
            generateCell(toShannon('1000'), OutputStatus.Failed, false, null),
          ]

          await getConnection().manager.save(cells)
        })
        it('throws LiveCapacityNotEnough', async () => {
          let err
          try {
            await TransactionGenerator.startWithdrawFromDao(
              walletId1,
              depositOutPoint,
              depositDaoCell,
              '12',
              '0x' + '3'.repeat(64),
              bob.address,
              '0',
              feeRate
            )
          } catch (error) {
            err = error
          }

          expect(err).toEqual(new LiveCapacityNotEnough())
        })
      })
    })
  })

  describe('generateWithdrawMultiSignTx', () => {
    const prevOutput = Output.fromObject({
      capacity: toShannon('1000'),
      lock: SystemScriptInfo.generateMultiSignScript(new Multisig().args(bob.lockScript.args, 100, '0x7080018000001')),
    })
    const outPoint = OutPoint.fromObject({
      txHash: '0x' + '0'.repeat(64),
      index: '1',
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
          .map(input => BigInt(input.capacity ?? 0))
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
    const aliceAnyoneCanPayLockScript = assetAccountInfo.generateAnyoneCanPayScript(
      '0xe2193df51d78411601796b35b17b4f8f2cd85bd0'
    )
    const bobAnyoneCanPayLockScript = assetAccountInfo.generateAnyoneCanPayScript(
      '0x36c329ed630d6ce750712a477543672adab57f4c'
    )

    // generate anyone-can-pay live cell
    const generateLiveCell = (
      capacity: string,
      amount: string | undefined = undefined,
      tokenID: string | undefined = undefined,
      lockScript: Script = bobAnyoneCanPayLockScript,
      customData: string = '0x'
    ): LumosCell => {
      const liveCell: LumosCell = {
        blockHash: randomHex(),
        outPoint: {
          txHash: randomHex(),
          index: '0x0',
        },
        cellOutput: {
          capacity: capacity,
          lock: {
            codeHash: lockScript.codeHash,
            args: lockScript.args,
            hashType: lockScript.hashType.toString(),
          },
        },
        data: '0x',
      }
      if (tokenID) {
        const typeScript = assetAccountInfo.generateSudtScript(tokenID)
        // @ts-ignore
        liveCell.cellOutput.type = {
          codeHash: typeScript.codeHash,
          args: typeScript.args,
          hashType: typeScript.hashType.toString(),
        }
      }
      liveCell.data = amount ? BufferUtils.writeBigUInt128LE(BigInt(amount)) : '0x'

      if (customData !== '0x') {
        liveCell.data = customData
      }

      return liveCell
    }
    beforeEach(async () => {
      const cells: OutputEntity[] = [
        generateCell(toShannon('1000'), OutputStatus.Live, false, null, alice),
        generateCell(toShannon('2000'), OutputStatus.Live, false, null, bob),
      ]
      await getConnection().manager.save(cells)
    })

    describe('generateAnyoneCanPayToCKBTx, with feeRate 1000', () => {
      const feeRate = '1000'
      describe('sending to another ckb acp', () => {
        let tx: Transaction
        let expectedTxSize: number
        let expectedTxFee: string
        beforeEach(async () => {
          when(stubbedQueryIndexer)
            .calledWith({ lock: bobAnyoneCanPayLockScript, type: null, data: null })
            .mockResolvedValue([generateLiveCell(toShannon('70'), undefined, undefined, bobAnyoneCanPayLockScript)])

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
            (1 * 10 ** 8).toString(),
            bob.lockScript.args,
            feeRate,
            '0'
          )
          // tx.witnesses[0] = bytes.hexify(blockchain.WitnessArgs.pack(WitnessArgs.emptyLock().toSDK())
          tx.witnesses[0] = bytes.hexify(blockchain.WitnessArgs.pack(WitnessArgs.emptyLock().toSDK()))

          expectedTxSize = TransactionSize.tx(tx)
          expectedTxFee = TransactionFee.fee(expectedTxSize, BigInt(feeRate)).toString()
        })
        it('binds both secp and acp cell dep', () => {
          expect(tx.cellDeps.length).toEqual(2)
        })
        it('calculates fees', async () => {
          expect(tx.fee).toEqual(expectedTxFee)
        })
        it('generates inputs and outputs', () => {
          expect(tx.inputs.length).toEqual(2)
          expect(tx.outputs.length).toEqual(2)

          const inputCapacities = tx.inputs
            .map(input => BigInt(input.capacity ?? 0))
            .reduce((result, c) => result + c, BigInt(0))
          const outputCapacities = tx.outputs
            .map(output => BigInt(output.capacity))
            .reduce((result, c) => result + c, BigInt(0))

          expect(inputCapacities - outputCapacities).toEqual(BigInt(expectedTxFee))
        })
      })
      describe('sending to sudt acp', () => {
        let tx: Transaction
        let expectedTxSize: number
        let expectedTxFee: string
        beforeEach(async () => {
          when(stubbedQueryIndexer)
            .calledWith({ lock: bobAnyoneCanPayLockScript, type: null, data: null })
            .mockResolvedValue([generateLiveCell(toShannon('70'), undefined, undefined, bobAnyoneCanPayLockScript)])

          const targetOutput: Output = Output.fromObject({
            capacity: toShannon('61'),
            lock: aliceAnyoneCanPayLockScript,
            // DELETE ME: 0xuuid is not a valid args for sudt
            type: assetAccountInfo.generateSudtScript('0x1234567890123456789012345678901234567890'),
            data: '0x',
          })

          tx = await TransactionGenerator.generateAnyoneCanPayToCKBTx(
            walletId1,
            [bobAnyoneCanPayLockScript],
            targetOutput,
            (1 * 10 ** 8).toString(),
            bob.lockScript.args,
            feeRate,
            '0'
          )
          tx.witnesses[0] = bytes.hexify(blockchain.WitnessArgs.pack(WitnessArgs.emptyLock().toSDK()))

          expectedTxSize = TransactionSize.tx(tx)
          expectedTxFee = TransactionFee.fee(expectedTxSize, BigInt(feeRate)).toString()
        })
        it('binds both secp, acp and sudt cell deps', () => {
          expect(tx.cellDeps.length).toEqual(3)
        })
        it('calculates fees', async () => {
          expect(tx.fee).toEqual(expectedTxFee)
        })
        it('generates inputs and outputs', () => {
          expect(tx.inputs.length).toEqual(2)
          expect(tx.outputs.length).toEqual(2)

          const inputCapacities = tx.inputs
            .map(input => BigInt(input.capacity ?? 0))
            .reduce((result, c) => result + c, BigInt(0))
          const outputCapacities = tx.outputs
            .map(output => BigInt(output.capacity))
            .reduce((result, c) => result + c, BigInt(0))

          expect(inputCapacities - outputCapacities).toEqual(BigInt(expectedTxFee))
        })
      })

      describe('sending to pw ckb acp', () => {
        let tx: Transaction
        let expectedTxSize: number
        let expectedTxFee: string
        beforeEach(async () => {
          when(stubbedQueryIndexer)
            .calledWith({ lock: bobAnyoneCanPayLockScript, type: null, data: null })
            .mockResolvedValue([generateLiveCell(toShannon('70'), undefined, undefined, bobAnyoneCanPayLockScript)])

          const pwAnyoneCanPayLockScript = new Script(
            process.env.MAINNET_PW_ACP_SCRIPT_CODEHASH!,
            '0x36c329ed630d6ce750712a477543672adab57f4c',
            process.env.MAINNET_PW_ACP_SCRIPT_HASHTYPE as ScriptHashType
          )

          const targetOutput: Output = Output.fromObject({
            capacity: toShannon('61'),
            lock: pwAnyoneCanPayLockScript,
            type: null,
            data: '0x',
          })

          tx = await TransactionGenerator.generateAnyoneCanPayToCKBTx(
            walletId1,
            [bobAnyoneCanPayLockScript],
            targetOutput,
            (1 * 10 ** 8).toString(),
            bob.lockScript.args,
            feeRate,
            '0'
          )
          tx.witnesses[0] = bytes.hexify(blockchain.WitnessArgs.pack(WitnessArgs.emptyLock().toSDK()))

          expectedTxSize = TransactionSize.tx(tx)
          expectedTxFee = TransactionFee.fee(expectedTxSize, BigInt(feeRate)).toString()
        })
        it('binds both secp, pw and acp cell dep', () => {
          expect(tx.cellDeps.length).toEqual(3)
        })
        it('calculates fees', async () => {
          expect(tx.fee).toEqual(expectedTxFee)
        })
        it('generates inputs and outputs', () => {
          expect(tx.inputs.length).toEqual(2)
          expect(tx.outputs.length).toEqual(2)

          const inputCapacities = tx.inputs
            .map(input => BigInt(input.capacity ?? 0))
            .reduce((result, c) => result + c, BigInt(0))
          const outputCapacities = tx.outputs
            .map(output => BigInt(output.capacity))
            .reduce((result, c) => result + c, BigInt(0))

          expect(inputCapacities - outputCapacities).toEqual(BigInt(expectedTxFee))
        })
      })

      describe('when capacity is not sufficient', () => {
        const targetOutput: Output = Output.fromObject({
          capacity: toShannon('61'),
          lock: aliceAnyoneCanPayLockScript,
          type: null,
          data: '0x',
        })
        beforeEach(() => {
          when(stubbedQueryIndexer)
            .calledWith({ lock: bobAnyoneCanPayLockScript, type: null, data: null })
            .mockResolvedValue([generateLiveCell(toShannon('70'), undefined, undefined, bobAnyoneCanPayLockScript)])
        })
        it('throws error CapacityNotEnough', async () => {
          let error
          try {
            await TransactionGenerator.generateAnyoneCanPayToCKBTx(
              walletId1,
              [bobAnyoneCanPayLockScript],
              targetOutput,
              (10 * 10 ** 8).toString(),
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
        beforeEach(async () => {
          when(stubbedQueryIndexer)
            .calledWith({ lock: bobAnyoneCanPayLockScript, type: null, data: null })
            .mockResolvedValue([
              generateLiveCell(toShannon('62'), undefined, undefined, bobAnyoneCanPayLockScript),
              generateLiveCell(toShannon('62'), undefined, undefined, bobAnyoneCanPayLockScript),
            ])

          tx = await TransactionGenerator.generateAnyoneCanPayToCKBTx(
            walletId1,
            [bobAnyoneCanPayLockScript],
            targetOutput,
            (1 * 10 ** 8).toString(),
            bob.lockScript.args,
            feeRate,
            '0'
          )

          tx.witnesses[0] = bytes.hexify(blockchain.WitnessArgs.pack(WitnessArgs.emptyLock().toSDK()))
          tx.witnesses[1] = '0x'

          expectedTxSize = TransactionSize.tx(tx)
          expectedTxFee = TransactionFee.fee(expectedTxSize, BigInt(feeRate)).toString()
        })

        it('calculates fees', () => {
          expect(tx.fee).toEqual(expectedTxFee)

          const inputCapacities = tx.inputs
            .map(input => BigInt(input.capacity ?? 0))
            .reduce((result, c) => result + c, BigInt(0))
          const outputCapacities = tx.outputs
            .map(output => BigInt(output.capacity))
            .reduce((result, c) => result + c, BigInt(0))

          expect(inputCapacities - outputCapacities).toEqual(BigInt(expectedTxFee))
        })
        it('merges the cells in need', async () => {
          expect(tx.inputs.length).toEqual(3)
          expect(tx.outputs.length).toEqual(2)
        })
      })

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
          when(stubbedQueryIndexer)
            .calledWith({ lock: bobAnyoneCanPayLockScript, type: null, data: null })
            .mockResolvedValue([generateLiveCell(toShannon('62'), undefined, undefined, bobAnyoneCanPayLockScript)])

          tx = await TransactionGenerator.generateAnyoneCanPayToCKBTx(
            walletId1,
            [bobAnyoneCanPayLockScript],
            targetOutput,
            (1 * 10 ** 8).toString(),
            bob.lockScript.args,
            feeRate,
            '0'
          )

          tx.witnesses[0] = bytes.hexify(blockchain.WitnessArgs.pack(WitnessArgs.emptyLock().toSDK()))
          tx.witnesses[1] = bytes.hexify(blockchain.WitnessArgs.pack(WitnessArgs.emptyLock().toSDK()))

          expectedTxSize = TransactionSize.tx(tx)
          expectedTxFee = TransactionFee.fee(expectedTxSize, BigInt(feeRate)).toString()
        })
        it('calculates fees', () => {
          expect(tx.fee).toEqual(expectedTxFee)

          const inputCapacities = tx.inputs
            .map(input => BigInt(input.capacity ?? 0))
            .reduce((result, c) => result + c, BigInt(0))
          const outputCapacities = tx.outputs
            .map(output => BigInt(output.capacity))
            .reduce((result, c) => result + c, BigInt(0))

          expect(inputCapacities - outputCapacities).toEqual(BigInt(expectedTxFee))
        })
        it('uses a non ACP cell to cover fees', async () => {
          expect(tx.inputs.length).toEqual(3)
          expect(tx.outputs.length).toEqual(3)
        })
      })

      describe('with some of ACP cells having data', () => {
        const targetOutput: Output = Output.fromObject({
          capacity: toShannon('61'),
          lock: bobAnyoneCanPayLockScript,
          type: null,
          data: '0x',
        })
        let tx: Transaction

        const customData = '0x000000'
        const cellsByAlice = [
          generateLiveCell(toShannon('62'), undefined, undefined, aliceAnyoneCanPayLockScript, customData),
          generateLiveCell(toShannon('62'), undefined, undefined, aliceAnyoneCanPayLockScript),
        ]
        beforeEach(async () => {
          when(stubbedQueryIndexer)
            .calledWith({ lock: aliceAnyoneCanPayLockScript, type: null, data: null })
            .mockResolvedValue(cellsByAlice)

          tx = await TransactionGenerator.generateAnyoneCanPayToCKBTx(
            walletId1,
            [aliceAnyoneCanPayLockScript],
            targetOutput,
            (1 * 10 ** 8).toString(),
            bob.lockScript.args,
            feeRate,
            '0'
          )

          tx.witnesses[0] = bytes.hexify(blockchain.WitnessArgs.pack(WitnessArgs.emptyLock().toSDK()))
          tx.witnesses[1] = bytes.hexify(blockchain.WitnessArgs.pack(WitnessArgs.emptyLock().toSDK()))
        })
        it('should not use insufficient ACP cell as input', async () => {
          expect(tx.inputs.length).toEqual(3)
          expect(tx.outputs.length).toEqual(3)

          expect(tx.outputs.find(o => o.data === customData)).toEqual(undefined)
        })
      })

      describe('when the total capacity of ACP cells is insufficient for the transfer amount', () => {
        const targetOutput: Output = Output.fromObject({
          capacity: toShannon('61'),
          lock: aliceAnyoneCanPayLockScript,
          type: null,
          data: '0x',
        })
        beforeEach(() => {
          when(stubbedQueryIndexer)
            .calledWith({ lock: bobAnyoneCanPayLockScript, type: null, data: null })
            .mockResolvedValue([generateLiveCell(toShannon('61'), undefined, undefined, bobAnyoneCanPayLockScript)])
        })
        it('throws error CapacityNotEnough', async () => {
          let error
          try {
            await TransactionGenerator.generateAnyoneCanPayToCKBTx(
              walletId1,
              [bobAnyoneCanPayLockScript],
              targetOutput,
              (1 * 10 ** 8).toString(),
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

      describe('when sending all', () => {
        const targetOutput: Output = Output.fromObject({
          capacity: toShannon('61'),
          lock: aliceAnyoneCanPayLockScript,
          type: null,
          data: '0x',
        })
        let tx: Transaction
        describe('with all ACP cells without data', () => {
          beforeEach(async () => {
            when(stubbedQueryIndexer)
              .calledWith({ lock: bobAnyoneCanPayLockScript, type: null, data: null })
              .mockResolvedValue([
                generateLiveCell(toShannon('70'), undefined, undefined, bobAnyoneCanPayLockScript),
                generateLiveCell(toShannon('70'), undefined, undefined, bobAnyoneCanPayLockScript),
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
          })

          it('transfers all capacities and has minimum 61 CKB left', () => {
            expect(tx.outputs.length).toEqual(2)

            const changeOutput = tx.outputs.find(
              output => output.lock.computeHash() === bobAnyoneCanPayLockScript.computeHash()
            )
            expect(changeOutput!.capacity).toEqual(toShannon('61'))

            const aliceOutput = tx.outputs.find(
              output => output.lock.computeHash() === aliceAnyoneCanPayLockScript.computeHash()
            )

            expect(aliceOutput!.capacity).toEqual(
              (
                BigInt(targetOutput.capacity) +
                BigInt(toShannon('70')) +
                (BigInt(toShannon('70')) - BigInt(changeOutput!.capacity)) -
                BigInt(tx.fee ?? 0)
              ).toString()
            )
          })
        })
        describe('with some of ACP cells having data', () => {
          beforeEach(async () => {
            when(stubbedQueryIndexer)
              .calledWith({ lock: bobAnyoneCanPayLockScript, type: null, data: null })
              .mockResolvedValue([
                generateLiveCell(toShannon('70'), undefined, undefined, bobAnyoneCanPayLockScript),
                generateLiveCell(toShannon('70'), undefined, undefined, bobAnyoneCanPayLockScript, '0x00'),
              ])
              .calledWith({ lock: aliceAnyoneCanPayLockScript, type: null, data: null })
              .mockResolvedValue([generateLiveCell(toShannon('61'), undefined, undefined, aliceAnyoneCanPayLockScript)])
            tx = await TransactionGenerator.generateAnyoneCanPayToCKBTx(
              walletId1,
              [bobAnyoneCanPayLockScript],
              targetOutput,
              'all',
              bob.lockScript.args,
              feeRate,
              '0'
            )
          })

          it('should not use ACP cell input with data', () => {
            expect(tx.inputs.length).toEqual(2)

            const aliceOutputs = tx.outputs.filter(
              output => output.lock!.computeHash() === bobAnyoneCanPayLockScript.computeHash()
            )
            expect(aliceOutputs.length).toEqual(1)
            expect(aliceOutputs[0].data).toEqual('0x')
          })
        })
      })
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

          when(stubbedQueryIndexer)
            .calledWith({
              lock: bobAnyoneCanPayLockScript,
              type: assetAccountInfo.generateSudtScript(tokenID),
              data: null,
            })
            .mockResolvedValue([generateLiveCell(toShannon('150'), '1000', tokenID)])

          const targetLiveCell: LiveCell = LiveCell.fromLumos(targetLiveCellEntity)

          const targetOutput: Output = Output.fromObject({
            capacity: targetLiveCell.capacity,
            lock: targetLiveCell.lock(),
            type: targetLiveCell.type(),
            data: targetLiveCell.data,
            outPoint: new OutPoint('0x1558c9aed78d657eba858302b56800a8270aa7b43426d82c58cf96ae4afd6774', '0x0'),
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
          tx.witnesses[0] = bytes.hexify(blockchain.WitnessArgs.pack(WitnessArgs.emptyLock().toSDK()))

          expectedTxSize = TransactionSize.tx(tx)
          expectedTxFee = TransactionFee.fee(expectedTxSize, BigInt(feeRate)).toString()
        })
        it('binds secp, sudt, acp cell dep', () => {
          expect(tx.cellDeps.length).toEqual(3)
        })
        it('the size of inputs and outputs should remain 2', () => {
          expect(tx.inputs.length).toEqual(2)
          expect(tx.outputs.length).toEqual(2)
          expect(tx.outputs.map(o => o.lockHash)).toEqual([
            bobAnyoneCanPayLockScript.computeHash(),
            aliceAnyoneCanPayLockScript.computeHash(),
          ])
        })
        it('calculates fees', () => {
          expect(tx.fee).toEqual(expectedTxFee)

          const expectedOutputCapacities: bigint[] = [
            BigInt(toShannon('150')) - BigInt(tx.fee ?? 0),
            BigInt(toShannon('142')),
          ]
          expect(tx.outputs.map(o => BigInt(o.capacity))).toEqual(expectedOutputCapacities)

          const inputCapacities = tx.inputs
            .map(input => BigInt(input.capacity ?? 0))
            .reduce((result, c) => result + c, BigInt(0))
          const outputCapacities = tx.outputs
            .map(output => BigInt(output.capacity))
            .reduce((result, c) => result + c, BigInt(0))

          expect(inputCapacities - outputCapacities).toEqual(BigInt(expectedTxFee))
        })
        it('updates output data', () => {
          expect(tx.outputsData).toEqual([
            BufferUtils.writeBigUInt128LE(BigInt(900)),
            BufferUtils.writeBigUInt128LE(BigInt(200)),
          ])
        })
      })

      describe('when sending to pw acp', () => {
        const pwAnyoneCanPayLockScript = new Script(
          process.env.MAINNET_PW_ACP_SCRIPT_CODEHASH!,
          '0x36c329ed630d6ce750712a477543672adab57f4c',
          process.env.MAINNET_PW_ACP_SCRIPT_HASHTYPE as ScriptHashType
        )
        beforeEach(async () => {
          const targetLiveCellEntity = generateLiveCell(toShannon('142'), '100', tokenID, pwAnyoneCanPayLockScript)

          when(stubbedQueryIndexer)
            .calledWith({ lock: bobAnyoneCanPayLockScript, type: null, data: null })
            .mockResolvedValue([generateLiveCell(toShannon('150'), '1000', tokenID)])

          const targetLiveCell: LiveCell = LiveCell.fromLumos(targetLiveCellEntity)

          const targetOutput: Output = Output.fromObject({
            capacity: targetLiveCell.capacity,
            lock: targetLiveCell.lock(),
            type: targetLiveCell.type(),
            data: targetLiveCell.data,
            outPoint: new OutPoint('0x1558c9aed78d657eba858302b56800a8270aa7b43426d82c58cf96ae4afd6774', '0x0'),
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
          tx.witnesses[0] = bytes.hexify(blockchain.WitnessArgs.pack(WitnessArgs.emptyLock().toSDK()))

          expectedTxSize = TransactionSize.tx(tx)
          expectedTxFee = TransactionFee.fee(expectedTxSize, BigInt(feeRate)).toString()
        })
        it('binds secp, sudt, pw and acp cell dep', () => {
          expect(tx.cellDeps.length).toEqual(4)
        })
      })

      describe('when both token balance and capacity are insufficient', () => {
        let targetOutput: Output
        beforeEach(() => {
          const targetLiveCellEntity = generateLiveCell(toShannon('142'), '100', tokenID, aliceAnyoneCanPayLockScript)

          when(stubbedQueryIndexer)
            .calledWith({
              lock: bobAnyoneCanPayLockScript,
              type: assetAccountInfo.generateSudtScript(tokenID),
              data: null,
            })
            .mockResolvedValue([generateLiveCell(toShannon('150'), '100', tokenID)])

          const targetLiveCell: LiveCell = LiveCell.fromLumos(targetLiveCellEntity)
          targetOutput = Output.fromObject({
            capacity: targetLiveCell.capacity,
            lock: targetLiveCell.lock(),
            type: targetLiveCell.type(),
            data: targetLiveCell.data,
            outPoint: new OutPoint('0x1558c9aed78d657eba858302b56800a8270aa7b43426d82c58cf96ae4afd6774', '0x0'),
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
      })

      describe('when token balance is sufficient for transfering, but capacity is insufficient for fees', () => {
        beforeEach(async () => {
          const targetLiveCellEntity = generateLiveCell(toShannon('142'), '100', tokenID, aliceAnyoneCanPayLockScript)

          when(stubbedQueryIndexer)
            .calledWith({
              lock: bobAnyoneCanPayLockScript,
              type: assetAccountInfo.generateSudtScript(tokenID),
              data: null,
            })
            .mockResolvedValue([generateLiveCell(toShannon('142'), '1000', tokenID)])

          const targetLiveCell: LiveCell = LiveCell.fromLumos(targetLiveCellEntity)

          const targetOutput: Output = Output.fromObject({
            capacity: targetLiveCell.capacity,
            lock: targetLiveCell.lock(),
            type: targetLiveCell.type(),
            data: targetLiveCell.data,
            outPoint: new OutPoint('0x1558c9aed78d657eba858302b56800a8270aa7b43426d82c58cf96ae4afd6774', '0x0'),
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

          tx.witnesses[0] = bytes.hexify(blockchain.WitnessArgs.pack(WitnessArgs.emptyLock().toSDK()))
          tx.witnesses[1] = bytes.hexify(blockchain.WitnessArgs.pack(WitnessArgs.emptyLock().toSDK()))

          expectedTxSize = TransactionSize.tx(tx)
          expectedTxFee = TransactionFee.fee(expectedTxSize, BigInt(feeRate)).toString()
        })
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
          const expectedOutputCapacities: bigint[] = [
            BigInt(toShannon('142')),
            BigInt(toShannon('142')),
            BigInt(toShannon('1000')) - BigInt(tx.fee ?? 0),
          ]
          expect(tx.outputs.map(o => BigInt(o.capacity))).toEqual(expectedOutputCapacities)

          const inputCapacities = tx.inputs
            .map(input => BigInt(input.capacity ?? 0))
            .reduce((result, c) => result + c, BigInt(0))
          const outputCapacities = tx.outputs
            .map(output => BigInt(output.capacity))
            .reduce((result, c) => result + c, BigInt(0))

          expect(inputCapacities - outputCapacities).toEqual(BigInt(expectedTxFee))
        })
        it('updates output data', () => {
          expect(tx.outputsData).toEqual([
            BufferUtils.writeBigUInt128LE(BigInt(900)),
            BufferUtils.writeBigUInt128LE(BigInt(200)),
            '0x',
          ])
        })
      })

      describe('when some of ACP cells not satisfy the token transfer amount', () => {
        beforeEach(async () => {
          const targetLiveCellEntity = generateLiveCell(toShannon('142'), '100', tokenID, aliceAnyoneCanPayLockScript)

          when(stubbedQueryIndexer)
            .calledWith({
              lock: bobAnyoneCanPayLockScript,
              type: assetAccountInfo.generateSudtScript(tokenID),
              data: null,
            })
            .mockResolvedValue([
              generateLiveCell(toShannon('143'), '50', tokenID),
              generateLiveCell(toShannon('142'), '1000', tokenID),
            ])

          const targetLiveCell: LiveCell = LiveCell.fromLumos(targetLiveCellEntity)

          const targetOutput: Output = Output.fromObject({
            capacity: targetLiveCell.capacity,
            lock: targetLiveCell.lock(),
            type: targetLiveCell.type(),
            data: targetLiveCell.data,
            outPoint: new OutPoint('0x1558c9aed78d657eba858302b56800a8270aa7b43426d82c58cf96ae4afd6774', '0x0'),
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

          tx.witnesses[0] = bytes.hexify(blockchain.WitnessArgs.pack(WitnessArgs.emptyLock().toSDK()))
          tx.witnesses[1] = '0x'

          expectedTxSize = TransactionSize.tx(tx)
          expectedTxFee = TransactionFee.fee(expectedTxSize, BigInt(feeRate)).toString()
        })
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
            .map(input => BigInt(input.capacity ?? 0))
            .reduce((result, c) => result + c, BigInt(0))
          const outputCapacities = tx.outputs
            .map(output => BigInt(output.capacity))
            .reduce((result, c) => result + c, BigInt(0))

          expect(inputCapacities - outputCapacities).toEqual(BigInt(expectedTxFee))

          const expectedOutputCapacities: bigint[] = [
            BigInt(toShannon('143')) + BigInt(toShannon('142')) - BigInt(tx.fee ?? 0),
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
      })

      describe('when token balance is insufficient for transfer', () => {
        let targetOutput: Output
        beforeEach(() => {
          const targetLiveCellEntity = generateLiveCell(toShannon('142'), '100', tokenID, aliceAnyoneCanPayLockScript)

          when(stubbedQueryIndexer)
            .calledWith({
              lock: bobAnyoneCanPayLockScript,
              type: assetAccountInfo.generateSudtScript(tokenID),
              data: null,
            })
            .mockResolvedValue([generateLiveCell(toShannon('142'), '50', tokenID)])

          const targetLiveCell: LiveCell = LiveCell.fromLumos(targetLiveCellEntity)

          targetOutput = Output.fromObject({
            capacity: targetLiveCell.capacity,
            lock: targetLiveCell.lock(),
            type: targetLiveCell.type(),
            data: targetLiveCell.data,
            outPoint: new OutPoint('0x1558c9aed78d657eba858302b56800a8270aa7b43426d82c58cf96ae4afd6774', '0x0'),
          })
        })
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
      })

      describe('transfers all token balance', () => {
        beforeEach(async () => {
          const targetLiveCellEntity = generateLiveCell(toShannon('142'), '100', tokenID, aliceAnyoneCanPayLockScript)

          when(stubbedQueryIndexer)
            .calledWith({
              lock: bobAnyoneCanPayLockScript,
              type: assetAccountInfo.generateSudtScript(tokenID),
              data: null,
            })
            .mockResolvedValue([generateLiveCell(toShannon('1000'), '1000', tokenID)])

          const targetLiveCell: LiveCell = LiveCell.fromLumos(targetLiveCellEntity)

          const targetOutput: Output = Output.fromObject({
            capacity: targetLiveCell.capacity,
            lock: targetLiveCell.lock(),
            type: targetLiveCell.type(),
            data: targetLiveCell.data,
            outPoint: new OutPoint('0x1558c9aed78d657eba858302b56800a8270aa7b43426d82c58cf96ae4afd6774', '0x0'),
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

          tx.witnesses[0] = bytes.hexify(blockchain.WitnessArgs.pack(WitnessArgs.emptyLock().toSDK()))

          expectedTxSize = TransactionSize.tx(tx)
          expectedTxFee = TransactionFee.fee(expectedTxSize, BigInt(feeRate)).toString()
        })
        it('calculates fees', () => {
          expect(tx.fee).toEqual(expectedTxFee)

          const expectedOutputCapacities: bigint[] = [
            BigInt(toShannon('1000')) - BigInt(tx.fee ?? 0),
            BigInt(toShannon('142')),
          ]
          expect(tx.outputs.map(o => BigInt(o.capacity))).toEqual(expectedOutputCapacities)

          const inputCapacities = tx.inputs
            .map(input => BigInt(input.capacity ?? 0))
            .reduce((result, c) => result + c, BigInt(0))
          const outputCapacities = tx.outputs
            .map(output => BigInt(output.capacity))
            .reduce((result, c) => result + c, BigInt(0))

          expect(inputCapacities - outputCapacities).toEqual(BigInt(expectedTxFee))
        })
        it('the size of inputs and outputs should remain 2', async () => {
          expect(tx.inputs.length).toEqual(2)
          expect(tx.outputs.length).toEqual(2)

          expect(tx.outputs.map(o => o.lockHash)).toEqual([
            bobAnyoneCanPayLockScript.computeHash(),
            aliceAnyoneCanPayLockScript.computeHash(),
          ])
        })
        it('updates output data', () => {
          expect(tx.outputsData).toEqual([
            BufferUtils.writeBigUInt128LE(BigInt(0)),
            BufferUtils.writeBigUInt128LE(BigInt(1100)),
          ])
          expect(tx.sudtInfo!.amount).toEqual('1000')
        })
      })

      describe('ouput is a new cell', () => {
        beforeEach(async () => {
          const targetLiveCellEntity = generateLiveCell(toShannon('142'), '0', tokenID, aliceAnyoneCanPayLockScript)

          when(stubbedQueryIndexer)
            .calledWith({
              lock: bobAnyoneCanPayLockScript,
              type: assetAccountInfo.generateSudtScript(tokenID),
              data: null,
            })
            .mockResolvedValue([generateLiveCell(toShannon('150'), '1000', tokenID)])

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
          tx.witnesses[0] = bytes.hexify(blockchain.WitnessArgs.pack(WitnessArgs.emptyLock().toSDK()))
          tx.witnesses[1] = bytes.hexify(blockchain.WitnessArgs.pack(WitnessArgs.emptyLock().toSDK()))

          expectedTxSize = TransactionSize.tx(tx)
          expectedTxFee = TransactionFee.fee(expectedTxSize, BigInt(feeRate)).toString()
        })
        it('input 2, ouputs 3', () => {
          expect(tx.inputs.length).toEqual(2)
          expect(tx.outputs.length).toEqual(3)
          expect(tx.inputs.map(o => o.lockHash)).toEqual([
            bobAnyoneCanPayLockScript.computeHash(),
            alice.lockScript.computeHash(),
          ])
          expect(tx.outputs.map(o => o.lockHash)).toEqual([
            bobAnyoneCanPayLockScript.computeHash(),
            aliceAnyoneCanPayLockScript.computeHash(),
            bob.lockScript.computeHash(),
          ])
        })
        it('calculates fees', () => {
          expect(tx.fee).toEqual(expectedTxFee)

          const expectedOutputCapacities: bigint[] = [
            BigInt(toShannon('142')),
            BigInt(toShannon('142')),
            BigInt(toShannon('1008')) - BigInt(toShannon('142')) - BigInt(tx.fee ?? 0),
          ]
          expect(tx.outputs.map(o => BigInt(o.capacity))).toEqual(expectedOutputCapacities)

          const inputCapacities = tx.inputs
            .map(input => BigInt(input.capacity ?? 0))
            .reduce((result, c) => result + c, BigInt(0))
          const outputCapacities = tx.outputs
            .map(output => BigInt(output.capacity))
            .reduce((result, c) => result + c, BigInt(0))

          expect(inputCapacities - outputCapacities).toEqual(BigInt(expectedTxFee))
        })
        it('updates output data', () => {
          expect(tx.outputsData).toEqual([
            BufferUtils.writeBigUInt128LE(BigInt(900)),
            BufferUtils.writeBigUInt128LE(BigInt(100)),
            '0x',
          ])
        })
      })
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
          '0'
        )

        // check fee
        const inputCapacities = tx.inputs.map(i => BigInt(i.capacity ?? 0)).reduce((result, c) => result + c, BigInt(0))
        const outputCapacities = tx.outputs.map(o => BigInt(o.capacity)).reduce((result, c) => result + c, BigInt(0))
        expect(tx.fee).toEqual((inputCapacities - outputCapacities).toString())

        const expectedFee = TransactionFee.fee(
          TransactionSize.tx(tx) + TransactionSize.secpLockWitness(),
          BigInt(feeRate)
        ).toString()
        expect(tx.fee).toEqual(expectedFee)

        // check output
        expect(tx.outputs.length).toEqual(2)

        const output = tx.outputs[0]
        expect(output.capacity).toEqual(BigInt(61 * 10 ** 8).toString())
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
          '0'
        )

        // check fee
        const inputCapacities = tx.inputs.map(i => BigInt(i.capacity ?? 0)).reduce((result, c) => result + c, BigInt(0))
        const outputCapacities = tx.outputs.map(o => BigInt(o.capacity)).reduce((result, c) => result + c, BigInt(0))
        expect(tx.fee).toEqual((inputCapacities - outputCapacities).toString())

        // check output
        expect(tx.outputs.length).toEqual(2)

        const output = tx.outputs[0]
        expect(output.capacity).toEqual(BigInt(142 * 10 ** 8).toString())
        expect(assetAccountInfo.isSudtScript(output.type!)).toBe(true)
        expect(assetAccountInfo.isAnyoneCanPayScript(output.lock)).toBe(true)
        expect(output.data).toEqual('0x' + '0'.repeat(32))

        const changeOutput = tx.outputs[1]
        expect(SystemScriptInfo.isSecpScript(changeOutput.lock)).toBe(true)
      })
    })

    describe('generators for cheque', () => {
      const tokenID = '0x' + '0'.repeat(64)
      const typeScript = assetAccountInfo.generateSudtScript(tokenID)
      const chequeAmount = '10'
      let assetAccount: AssetAccount
      let tx: Transaction
      describe('#generateCreateChequeTx', () => {
        let senderAcpLiveCell: LiveCell
        let senderDefaultLock: Script
        let expectedChequeOutput: Output
        beforeEach(async () => {
          const senderAcpCellEntity = generateLiveCell(toShannon('142'), '100', tokenID, aliceAnyoneCanPayLockScript)
          senderAcpLiveCell = LiveCell.fromLumos(senderAcpCellEntity)
          senderDefaultLock = alice.lockScript
          const receiverDefaultLock = bob.lockScript

          when(stubbedQueryIndexer)
            .calledWith({
              lock: aliceAnyoneCanPayLockScript,
              type: assetAccountInfo.generateSudtScript(tokenID),
              data: null,
            })
            .mockResolvedValue([
              generateLiveCell(toShannon('142'), '100', tokenID, aliceAnyoneCanPayLockScript),
              generateLiveCell(toShannon('142'), '100', tokenID, aliceAnyoneCanPayLockScript),
            ])

          expectedChequeOutput = Output.fromObject({
            capacity: toShannon('161'),
            lock: assetAccountInfo.generateChequeScript(
              receiverDefaultLock.computeHash(),
              senderDefaultLock.computeHash()
            ),
            type: senderAcpLiveCell.type(),
            data: BufferUtils.writeBigUInt128LE(BigInt(110)),
          })
          assetAccount = new AssetAccount(tokenID, '', '', '', '', '', alice.lockScript.args)
        })
        describe('with numeric send amount', () => {
          beforeEach(async () => {
            tx = await TransactionGenerator.generateCreateChequeTx(
              walletId1,
              BufferUtils.readBigUInt128LE(expectedChequeOutput.data).toString(),
              assetAccount,
              bob.address,
              alice.address,
              '0',
              '1000'
            )
          })
          it('creates cheque output', () => {
            const chequeOutput = tx.outputs[0]
            expect(chequeOutput.lock.computeHash()).toEqual(expectedChequeOutput.lockHash)
            expect(chequeOutput.lock.args.length).toEqual(82)
          })
          it('sender lock hash equals to one of default lock inputs', () => {
            const defaultLockInput = tx.inputs.find(input => {
              const isDefaultLock = input.lock!.codeHash === SystemScriptInfo.SECP_CODE_HASH
              return (
                isDefaultLock &&
                input.lock!.computeHash().slice(0, 42) === '0x' + expectedChequeOutput.lock.args.slice(42)
              )
            })
            expect(defaultLockInput).not.toEqual(undefined)
          })
          it('specifies send amount', () => {
            expect(tx.outputsData[0]).toEqual(expectedChequeOutput.data)
            expect(tx.sudtInfo!.amount).toBe('110')
            expect(tx.anyoneCanPaySendAmount).toBe('110')
          })
        })
        describe('with send all amount', () => {
          beforeEach(async () => {
            tx = await TransactionGenerator.generateCreateChequeTx(
              walletId1,
              'all',
              assetAccount,
              bob.address,
              alice.address,
              '0',
              '1000'
            )
          })
          it('specifies send amount', () => {
            expect(tx.outputsData[0]).toEqual(BufferUtils.writeBigUInt128LE(BigInt(200)))
            expect(tx.sudtInfo!.amount).toBe('200')
            expect(tx.anyoneCanPaySendAmount).toBe('200')
          })
        })
      })

      describe('#generateClaimChequeTx', () => {
        let expectedChequeOutput: Output
        let receiverAcpCell: OutputEntity
        const senderDefaultLock: Script = alice.lockScript
        const receiverDefaultLock = bob.lockScript

        beforeEach(async () => {
          const receiverDefaultLockHash = receiverDefaultLock.computeHash()
          const senderDefaultLockHash = senderDefaultLock.computeHash()

          const transaction = new TransactionEntity()
          transaction.hash = '0x'
          transaction.version = '0'
          transaction.witnesses = []
          transaction.status = TransactionStatus.Success

          const senderDefaultLockInput = createInput(senderDefaultLock, undefined, transaction.hash)
          await getConnection().manager.save([transaction, senderDefaultLockInput])

          expectedChequeOutput = Output.fromObject({
            capacity: toShannon('161'),
            lock: assetAccountInfo.generateChequeScript(receiverDefaultLockHash, senderDefaultLockHash),
            type: typeScript,
            data: BufferUtils.writeBigUInt128LE(BigInt(chequeAmount)),
          })
        })
        describe('with existing acp cell', () => {
          beforeEach(async () => {
            const receiverAcpLock = bobAnyoneCanPayLockScript
            receiverAcpCell = generateCell(
              toShannon('1000'),
              OutputStatus.Live,
              true,
              typeScript,
              { lockScript: receiverAcpLock },
              undefined,
              BufferUtils.writeBigUInt128LE(BigInt(100))
            )
            await getConnection().manager.save([receiverAcpCell])
            tx = await TransactionGenerator.generateClaimChequeTx(
              walletId1,
              expectedChequeOutput,
              alice.address,
              undefined,
              '1000'
            )
          })
          it('uses the existing acp cell to hold the claimed sudt amount', () => {
            const acpInput = tx.inputs.find(
              input =>
                input.lock!.computeHash() === receiverAcpCell!.lockScript()!.computeHash() &&
                input.type!.computeHash() === receiverAcpCell!.typeScript()!.computeHash()
            )
            const acpInputAmount = BufferUtils.readBigUInt128LE(acpInput!.data!)

            const acpOutput = tx.outputs.find(
              input =>
                input.lock!.computeHash() === receiverAcpCell!.lockScript()!.computeHash() &&
                input.type!.computeHash() === receiverAcpCell!.typeScript()!.computeHash()
            )

            const chequeCellAmount = BufferUtils.readBigUInt128LE(expectedChequeOutput.data)
            const acpOutputAmount = BufferUtils.readBigUInt128LE(acpOutput!.data!)

            const claimedAmount = acpOutputAmount - acpInputAmount
            expect(claimedAmount).toEqual(chequeCellAmount)
          })
          it('returns ckb to sender', () => {
            const senderDefaultOutput = tx.outputs.find(
              input => input.lock!.computeHash() === senderDefaultLock.computeHash()
            )
            expect(senderDefaultOutput!.capacity).toEqual(expectedChequeOutput.capacity)
          })
        })

        describe('without existing acp cell', () => {
          beforeEach(async () => {
            tx = await TransactionGenerator.generateClaimChequeTx(
              walletId1,
              expectedChequeOutput,
              alice.address,
              undefined,
              '1000'
            )
          })
          it('creates an new acp cell to hold the claimed sudt amount', () => {
            const acpInput = tx.inputs.find(
              input =>
                input.lock!.computeHash() === receiverAcpCell!.lockScript()!.computeHash() &&
                input.type!.computeHash() === receiverAcpCell!.typeScript()!.computeHash()
            )
            expect(acpInput).toBe(undefined)

            const acpOutput = tx.outputs.find(
              input =>
                input.lock!.computeHash() === receiverAcpCell!.lockScript()!.computeHash() &&
                input.type!.computeHash() === receiverAcpCell!.typeScript()!.computeHash()
            )

            const chequeCellAmount = BufferUtils.readBigUInt128LE(expectedChequeOutput.data)
            const claimedAmount = BufferUtils.readBigUInt128LE(acpOutput!.data!)

            expect(claimedAmount).toEqual(chequeCellAmount)
          })
          it('returns ckb to sender', () => {
            const senderDefaultOutput = tx.outputs.find(
              input => input.lock!.computeHash() === senderDefaultLock.computeHash()
            )
            expect(senderDefaultOutput!.capacity).toEqual(expectedChequeOutput.capacity)
          })
        })
      })
      describe('#generateWithdrawChequeTx', () => {
        let senderDefaultLock: Script = alice.lockScript
        let senderAcpOutputEntity: OutputEntity
        let senderDefaultLockInputEntity: InputEntity
        let chequeOutputEntity: OutputEntity

        const transaction = new TransactionEntity()
        transaction.hash = '0x' + '0'.repeat(64)
        transaction.version = '0'
        transaction.witnesses = []
        transaction.status = TransactionStatus.Success

        senderDefaultLockInputEntity = createInput(senderDefaultLock, undefined, transaction.hash)

        const chequeLock = assetAccountInfo.generateChequeScript('0x' + '0'.repeat(40), senderDefaultLock.computeHash())
        chequeOutputEntity = createOutput(
          chequeLock,
          typeScript,
          toShannon('162'),
          BufferUtils.writeBigUInt128LE(BigInt(chequeAmount)),
          OutPoint.fromObject({ txHash: transaction.hash, index: '0x1' })
        )

        describe('when the sender acp output from cheque tx is still live', () => {
          beforeEach(async () => {
            senderAcpOutputEntity = createOutput(
              aliceAnyoneCanPayLockScript,
              typeScript,
              toShannon('142'),
              BufferUtils.writeBigUInt128LE(BigInt('1')),
              OutPoint.fromObject({ txHash: transaction.hash, index: '0x0' })
            )
            await getConnection().manager.save([
              transaction,
              senderAcpOutputEntity,
              senderDefaultLockInputEntity,
              chequeOutputEntity,
            ])

            const chequeOutput = chequeOutputEntity.toModel()
            tx = await TransactionGenerator.generateWithdrawChequeTx(chequeOutput, undefined, '1000')
          })
          it('returns cheque sudt to sender acp', () => {
            const updatedSenderAcpOutput = tx.outputs.find(
              output => output.lockHash === senderAcpOutputEntity.lockHash
            )!
            expect(BufferUtils.parseAmountFromSUDTData(updatedSenderAcpOutput.data)).toEqual(
              BufferUtils.parseAmountFromSUDTData(chequeOutputEntity.data) +
                BufferUtils.parseAmountFromSUDTData(senderAcpOutputEntity.data)
            )
          })
          it('returns cheque ckb subtracted fees to sender lock', () => {
            const senderDefaultLockOutput = tx.outputs.find(
              output => output.lockHash === senderDefaultLockInputEntity.lockHash
            )!
            const capacityAfterFees = BigInt(chequeOutputEntity.capacity) - BigInt(tx.fee ?? 0)
            expect(senderDefaultLockOutput.capacity).toEqual(capacityAfterFees.toString())
          })
          it('use 6 relative epoch in cheque input since', () => {
            const chequeInput = tx.inputs.find(input => input.lockHash === chequeOutputEntity.lockHash)!
            expect(chequeInput.toSDK().since).toEqual('0xa000000000000006')
          })
        })
        describe('when the sender acp output from cheque tx is consumed', () => {
          const senderLiveAcpOutputEntity = createOutput(
            aliceAnyoneCanPayLockScript,
            typeScript,
            toShannon('142'),
            BufferUtils.writeBigUInt128LE(BigInt('2')),
            OutPoint.fromObject({ txHash: '0x' + '1'.repeat(64), index: '0x0' })
          )
          beforeEach(async () => {
            senderAcpOutputEntity = createOutput(
              aliceAnyoneCanPayLockScript,
              typeScript,
              toShannon('142'),
              BufferUtils.writeBigUInt128LE(BigInt('1')),
              OutPoint.fromObject({ txHash: transaction.hash, index: '0x0' })
            )
            senderAcpOutputEntity.status = OutputStatus.Dead

            await getConnection().manager.save([
              transaction,
              senderAcpOutputEntity,
              senderLiveAcpOutputEntity,
              senderDefaultLockInputEntity,
              chequeOutputEntity,
            ])

            const chequeOutput = chequeOutputEntity.toModel()
            tx = await TransactionGenerator.generateWithdrawChequeTx(chequeOutput, undefined, '1000')
          })
          it('returns cheque sudt to latest live sender acp', () => {
            const updatedSenderAcpOutput = tx.outputs.find(
              output => output.lockHash === senderLiveAcpOutputEntity.lockHash
            )!
            expect(BufferUtils.parseAmountFromSUDTData(updatedSenderAcpOutput.data)).toEqual(
              BufferUtils.parseAmountFromSUDTData(chequeOutputEntity.data) +
                BufferUtils.parseAmountFromSUDTData(senderLiveAcpOutputEntity.data)
            )
          })
        })
      })
    })

    describe('generateSudtMigrateAcpTx', () => {
      const assetAccountInfo = new AssetAccountInfo()
      const sudtCellObject = {
        capacity: toShannon('142'),
        lock: alice.lockScript,
        type: assetAccountInfo.generateSudtScript('0x2619a9dc0428f87c0921ed22d0f10707c5c4ec9e8185764d8236d7ea996a9b03'),
        data: BufferUtils.writeBigUInt128LE(BigInt(100)),
      }
      it('no wallet', async () => {
        getCurrentMock.mockReturnValueOnce(undefined)
        expect(TransactionGenerator.generateSudtMigrateAcpTx(Output.fromObject(sudtCellObject))).rejects.toThrow(
          new CurrentWalletNotSet()
        )
      })

      describe('with acp address', () => {
        let receiverAcpCell: OutputEntity
        let secpCell: OutputEntity
        const bobAnyoneCanPayLockScript = assetAccountInfo.generateAnyoneCanPayScript(
          '0x36c329ed630d6ce750712a477543672adab57f4c'
        )
        beforeEach(async () => {
          receiverAcpCell = generateCell(
            toShannon('1000'),
            OutputStatus.Live,
            true,
            sudtCellObject.type!,
            { lockScript: bobAnyoneCanPayLockScript },
            undefined,
            BufferUtils.writeBigUInt128LE(BigInt(100))
          )
          secpCell = generateCell(toShannon('100'), OutputStatus.Live, false, null, { lockScript: alice.lockScript })
          await getConnection().manager.save([receiverAcpCell, secpCell])
          when(stubbedQueryIndexer)
            .calledWith({ lock: bobAnyoneCanPayLockScript, type: Output.fromObject(sudtCellObject).type, data: null })
            .mockResolvedValue([
              generateLiveCell(toShannon('70'), '100', receiverAcpCell.typeArgs!, bobAnyoneCanPayLockScript),
            ])
        })
        it('sudt cell no type', async () => {
          getCurrentMock.mockReturnValueOnce({})
          const sudtCell = Output.fromObject(sudtCellObject)
          sudtCell.type = null
          expect(TransactionGenerator.generateSudtMigrateAcpTx(sudtCell, 'acpAddress')).rejects.toThrow(
            new MigrateSudtCellNoTypeError()
          )
        })
        it('acp address is invalid', async () => {
          getCurrentMock.mockReturnValueOnce({})
          const sudtCell = Output.fromObject(sudtCellObject)
          when(stubbedQueryIndexer)
            .calledWith({
              lock: helpers.addressToScript('ckt1qyq0tejcz8rl6yyjw3m3vnu7r955d9ecj9gq46suu6', {config: config.predefined.AGGRON4}),
              type: sudtCell.type,
              data: null,
            })
            .mockResolvedValue([])
          expect(
            TransactionGenerator.generateSudtMigrateAcpTx(sudtCell, 'ckt1qyq0tejcz8rl6yyjw3m3vnu7r955d9ecj9gq46suu6')
          ).rejects.toThrow(new TargetOutputNotFoundError())
        })
        it('sudt capacitity is enough', async () => {
          const sudtCell = Output.fromObject(sudtCellObject)
          sudtCell.setCapacity(toShannon('144'))
          getCurrentMock.mockReturnValueOnce({})
          const bobLockHash = helpers.encodeToAddress(bobAnyoneCanPayLockScript)
          const res = (await TransactionGenerator.generateSudtMigrateAcpTx(sudtCell, bobLockHash)) as Transaction
          expect(res.outputs).toHaveLength(2)
          expect(res.outputs[1].data).toEqual(BufferUtils.writeBigUInt128LE(BigInt(200)))
        })
        it('sudt capacitity is not enough and last address should be acp input cell', async () => {
          const sudtCell = Output.fromObject(sudtCellObject)
          getCurrentMock.mockReturnValueOnce({
            id: alice.walletId,
            getNextChangeAddress: () => ({ address: alice.address }),
          })
          const bobLockHash = helpers.encodeToAddress(bobAnyoneCanPayLockScript)
          const res = (await TransactionGenerator.generateSudtMigrateAcpTx(sudtCell, bobLockHash)) as Transaction
          expect(res.outputs).toHaveLength(3)
          expect(res.outputs[1].data).toEqual(BufferUtils.writeBigUInt128LE(BigInt(200)))
          expect(res.outputs[2].capacity).toEqual((BigInt(secpCell.capacity) - BigInt(res.fee ?? 0)).toString())
          expect(res.inputs).toHaveLength(3)
          expect(res.inputs[2].lockHash).toBe(bobAnyoneCanPayLockScript.computeHash())
        })
      })

      describe('create new acp address', () => {
        let receiverAcpCell: OutputEntity
        const bobAnyoneCanPayLockScript = assetAccountInfo.generateAnyoneCanPayScript(
          '0x36c329ed630d6ce750712a477543672adab57f4c'
        )
        beforeEach(async () => {
          receiverAcpCell = generateCell(
            toShannon('1000'),
            OutputStatus.Live,
            true,
            sudtCellObject.type!,
            { lockScript: bobAnyoneCanPayLockScript },
            undefined,
            BufferUtils.writeBigUInt128LE(BigInt(100))
          )
          await getConnection().manager.save([receiverAcpCell])
        })
        it('new account create', async () => {
          const sudtCell = Output.fromObject(sudtCellObject)
          sudtCell.setCapacity(toShannon('144'))
          getCurrentMock.mockReturnValueOnce({
            id: alice.walletId,
            getNextChangeAddress: () => ({ address: alice.address }),
            isHDWallet: () => true,
            getNextReceivingAddresses: () => [{ blake160: alice.publicKeyInBlake160 }],
          })
          const res = (await TransactionGenerator.generateSudtMigrateAcpTx(sudtCell)) as Transaction
          expect(res.outputs).toHaveLength(1)
          expect(res.outputs[0].data).toEqual(sudtCell.data)
          expect(res.outputs[0].capacity).toEqual((BigInt(sudtCell.capacity) - BigInt(res.fee ?? 0)).toString())
        })

        it('account capacity is not enough', async () => {
          const sudtCell = Output.fromObject(sudtCellObject)
          getCurrentMock.mockReturnValueOnce({
            id: alice.walletId,
            getNextChangeAddress: () => ({ address: alice.address }),
          })
          expect(TransactionGenerator.generateSudtMigrateAcpTx(sudtCell)).rejects.toThrow()
        })

        it('account capacity not enough for change', async () => {
          const secpCell = generateCell(toShannon('61'), OutputStatus.Live, false, null, {
            lockScript: alice.lockScript,
          })
          await getConnection().manager.save([receiverAcpCell, secpCell])
          const sudtCell = Output.fromObject(sudtCellObject)
          getCurrentMock.mockReturnValueOnce({
            id: alice.walletId,
            getNextChangeAddress: () => ({ address: alice.address }),
          })
          expect(TransactionGenerator.generateSudtMigrateAcpTx(sudtCell)).rejects.toThrow()
        })
      })
    })
  })

  describe('generateCreateAnyoneCanPayTxUseAllBalance', () => {
    const assetAccountInfo = new AssetAccountInfo()
    const feeRate = '1000'
    it('create ckb', async () => {
      const cells: OutputEntity[] = [generateCell(toShannon('100'), OutputStatus.Live, false, null)]
      await getConnection().manager.save(cells)

      const tx = await TransactionGenerator.generateCreateAnyoneCanPayTxUseAllBalance(
        'CKBytes',
        walletId1,
        alice.lockScript.args,
        feeRate,
        '0'
      )

      // check fee
      const inputCapacities = tx.inputs.map(i => BigInt(i.capacity ?? 0)).reduce((result, c) => result + c, BigInt(0))
      const outputCapacities = tx.outputs.map(o => BigInt(o.capacity)).reduce((result, c) => result + c, BigInt(0))
      expect(tx.fee).toEqual((inputCapacities - outputCapacities).toString())

      const expectedFee = TransactionFee.fee(
        TransactionSize.tx(tx) + TransactionSize.secpLockWitness(),
        BigInt(feeRate)
      ).toString()
      expect(tx.fee).toEqual(expectedFee)

      // check output
      expect(tx.outputs.length).toEqual(1)

      const output = tx.outputs[0]
      expect(output.capacity).toEqual((BigInt(100 * 10 ** 8) - BigInt(tx.fee ?? 0)).toString())
      expect(!!output.type).toBe(false)
      expect(assetAccountInfo.isAnyoneCanPayScript(output.lock)).toBe(true)
      expect(output.data).toEqual('0x')
    })

    it('create sudt', async () => {
      const cells: OutputEntity[] = [generateCell(toShannon('143'), OutputStatus.Live, false, null)]
      await getConnection().manager.save(cells)

      const tokenID = '0x' + '0'.repeat(64)
      const tx = await TransactionGenerator.generateCreateAnyoneCanPayTxUseAllBalance(
        tokenID,
        walletId1,
        alice.lockScript.args,
        feeRate,
        '0'
      )

      // check fee
      const inputCapacities = tx.inputs.map(i => BigInt(i.capacity ?? 0)).reduce((result, c) => result + c, BigInt(0))
      const outputCapacities = tx.outputs.map(o => BigInt(o.capacity)).reduce((result, c) => result + c, BigInt(0))
      expect(tx.fee).toEqual((inputCapacities - outputCapacities).toString())

      // check output
      expect(tx.outputs.length).toEqual(1)

      const output = tx.outputs[0]
      expect(output.capacity).toEqual((BigInt(143 * 10 ** 8) - BigInt(tx.fee ?? 0)).toString())
      expect(assetAccountInfo.isSudtScript(output.type!)).toBe(true)
      expect(assetAccountInfo.isAnyoneCanPayScript(output.lock)).toBe(true)
      expect(output.data).toEqual('0x' + '0'.repeat(32))
    })
  })

  describe('#generateMigrateLegacyACPTx', () => {
    const defaultLock = new Script(
      SystemScriptInfo.SECP_CODE_HASH,
      alice.publicKeyInBlake160,
      SystemScriptInfo.SECP_HASH_TYPE
    )
    const legacyACPCodeHash: string = process.env.LEGACY_MAINNET_ACP_SCRIPT_CODEHASH as string
    const legacyACPHashType: string = process.env.LEGACY_MAINNET_ACP_SCRIPT_HASHTYPE as string
    const legacyACPLock = new Script(legacyACPCodeHash, alice.publicKeyInBlake160, legacyACPHashType as ScriptHashType)
    const assetAccountInfo = new AssetAccountInfo()
    const tokenID = '0x' + '0'.repeat(64)

    const sudtScript = assetAccountInfo.generateSudtScript(tokenID)
    const acpLock = assetAccountInfo.generateAnyoneCanPayScript(alice.publicKeyInBlake160)

    describe('with legacy acp cells', () => {
      beforeEach(async () => {
        const cells = [
          generateCell(toShannon('1000'), OutputStatus.Live, false, null, { lockScript: legacyACPLock }),
          generateCell(toShannon('1000'), OutputStatus.Live, false, null, { lockScript: legacyACPLock }),

          generateCell(toShannon('61'), OutputStatus.Live, false, null, { lockScript: defaultLock }),
          generateCell(toShannon('100'), OutputStatus.Live, false, null, { lockScript: defaultLock }),
          generateCell(toShannon('100'), OutputStatus.Live, false, null, { lockScript: defaultLock }),

          generateCell(
            toShannon('200'),
            OutputStatus.Live,
            false,
            sudtScript,
            { lockScript: legacyACPLock },
            undefined,
            BufferUtils.writeBigUInt128LE(BigInt(100))
          ),
          generateCell(
            toShannon('200'),
            OutputStatus.Live,
            false,
            sudtScript,
            { lockScript: legacyACPLock },
            undefined,
            BufferUtils.writeBigUInt128LE(BigInt(100))
          ),
        ]
        await getConnection().manager.save(cells)
      })
      it('generates acp migration transaction', async () => {
        const tx = (await TransactionGenerator.generateMigrateLegacyACPTx(alice.walletId))!
        const totalLegacyACPCellsCount = tx.inputs.filter(
          input => input.lockHash === legacyACPLock.computeHash()
        ).length
        const totalMigratedACPCellsCount = tx.outputs.filter(output => output.lockHash === acpLock.computeHash()).length
        const totalMigratedSUDTCellCount = tx.outputs.filter(
          output => output.typeHash === sudtScript.computeHash()
        ).length
        const normalInputCellCapacity = tx.inputs
          .filter(input => input.lockHash === defaultLock.computeHash())
          .reduce((sum, input) => {
            return (sum += BigInt(input.capacity ?? 0))
          }, BigInt(0))
        const normalOutputCellCapacity = tx.outputs
          .filter(output => output.lockHash === defaultLock.computeHash())
          .reduce((sum, output) => {
            return (sum += BigInt(output.capacity))
          }, BigInt(0))
        const acpCellCapacity = tx.outputs
          .filter(output => output.lockHash === acpLock.computeHash())
          .reduce((sum, output) => {
            return (sum += BigInt(output.capacity))
          }, BigInt(0))
        const acpCellSudtAmount = tx.outputsData.reduce((sum, lehex) => {
          return (sum += BufferUtils.parseAmountFromSUDTData(lehex))
        }, BigInt(0))

        expect(totalLegacyACPCellsCount).toEqual(4)
        expect(totalMigratedACPCellsCount).toEqual(4)
        expect(normalInputCellCapacity.toString()).toEqual(toShannon('161'))
        expect(normalOutputCellCapacity.toString()).toEqual((normalInputCellCapacity - BigInt(tx.fee ?? 0)).toString())
        expect(acpCellCapacity.toString()).toEqual(toShannon('2400'))
        expect(totalMigratedSUDTCellCount).toEqual(2)
        expect(acpCellSudtAmount).toEqual(BigInt(200))
      })
    })
    describe('with no legacy acp cells', () => {
      beforeEach(async () => {
        const cells = [
          generateCell(toShannon('1000'), OutputStatus.Live, false, null, { lockScript: acpLock }),
          generateCell(toShannon('1000'), OutputStatus.Live, false, null, { lockScript: acpLock }),

          generateCell(toShannon('61'), OutputStatus.Live, false, null, { lockScript: defaultLock }),
          generateCell(toShannon('100'), OutputStatus.Live, false, null, { lockScript: defaultLock }),
          generateCell(toShannon('100'), OutputStatus.Live, false, null, { lockScript: defaultLock }),

          generateCell(
            toShannon('200'),
            OutputStatus.Live,
            false,
            sudtScript,
            { lockScript: acpLock },
            undefined,
            BufferUtils.writeBigUInt128LE(BigInt(100))
          ),
          generateCell(
            toShannon('200'),
            OutputStatus.Live,
            false,
            sudtScript,
            { lockScript: acpLock },
            undefined,
            BufferUtils.writeBigUInt128LE(BigInt(100))
          ),
        ]
        await getConnection().manager.save(cells)
      })
      it('returns null', async () => {
        const tx = await TransactionGenerator.generateMigrateLegacyACPTx(alice.walletId)
        expect(tx).toEqual(null)
      })
    })
    describe('with insufficient normal cells for fees', () => {
      beforeEach(async () => {
        const cells = [
          generateCell(toShannon('1000'), OutputStatus.Live, false, null, { lockScript: legacyACPLock }),
          generateCell(toShannon('61'), OutputStatus.Live, false, null, { lockScript: defaultLock }),
        ]
        await getConnection().manager.save(cells)
      })
      it('throws CapacityNotEnough', async () => {
        let error = null
        try {
          await TransactionGenerator.generateMigrateLegacyACPTx(alice.walletId)
        } catch (err) {
          error = err
        }
        expect(error).not.toEqual(null)
      })
    })
  })

  describe('generateDestoryAssetAccountTx', () => {
    describe('CKB account', () => {
      it('capacity not enough for fee', async () => {
        const input = createInput(alice.lockScript, undefined, '0x' + '0'.repeat(64))
        const asssetAccountInput = input.toModel()
        asssetAccountInput.capacity = toShannon('61')
        await expect(
          TransactionGenerator.generateDestoryAssetAccountTx(
            'walletId',
            [asssetAccountInput],
            bob.publicKeyInBlake160,
            true
          )
        ).rejects.toThrow(new CapacityNotEnough())
      })
      it('account capacity not enough for fee need other address', async () => {
        const input = createInput(alice.lockScript, undefined, '0x' + '0'.repeat(64))
        const asssetAccountInput = input.toModel()
        asssetAccountInput.capacity = toShannon('61')
        const cell: OutputEntity = generateCell(toShannon('62'), OutputStatus.Live, false, null, alice)
        await getConnection().manager.save(cell)
        const res = await TransactionGenerator.generateDestoryAssetAccountTx(
          alice.walletId,
          [asssetAccountInput],
          bob.publicKeyInBlake160,
          true
        )
        const expectCapacity = BigInt(toShannon('123')) - TransactionFee.fee(TransactionSize.tx(res), BigInt(1e4))
        expect(res.inputs).toHaveLength(2)
        expect(res.inputs[1].capacity).toBe(toShannon('62'))
        expect(res.outputs[0].capacity).toBe(expectCapacity.toString())
      })
      it('account capacity enough for fee', async () => {
        const input = createInput(alice.lockScript, undefined, '0x' + '0'.repeat(64))
        const asssetAccountInput = input.toModel()
        asssetAccountInput.capacity = toShannon('62')
        const res = await TransactionGenerator.generateDestoryAssetAccountTx(
          alice.walletId,
          [asssetAccountInput],
          bob.publicKeyInBlake160,
          true
        )
        const expectCapacity = BigInt(toShannon('62')) - TransactionFee.fee(TransactionSize.tx(res), BigInt(1e4))
        expect(res.outputs[0].capacity).toBe(expectCapacity.toString())
      })
    })
    describe('sUDT account', () => {
      it('sUDT amount is not zero throw exception', async () => {
        const typeScript = new Script(
          '0xc5e5dcf215925f7ef4dfaf5f4b4f105bc321c02776d6e7d52a1db3fcd9d011a4',
          '0x2619a9dc0428f87c0921ed22d0f10707c5c4ec9e8185764d8236d7ea996a9b03',
          ScriptHashType.Type
        )
        const input = createInput(alice.lockScript, typeScript, '0x' + '0'.repeat(64))
        const asssetAccountInput = input.toModel()
        asssetAccountInput.capacity = toShannon('142')
        asssetAccountInput.data = BufferUtils.writeBigUInt128LE(BigInt('10'))
        await expect(
          TransactionGenerator.generateDestoryAssetAccountTx(
            alice.walletId,
            [asssetAccountInput],
            bob.publicKeyInBlake160,
            false
          )
        ).rejects.toThrow(new SudtAcpHaveDataError())
      })
      it('destory success', async () => {
        const typeScript = new Script(
          '0xc5e5dcf215925f7ef4dfaf5f4b4f105bc321c02776d6e7d52a1db3fcd9d011a4',
          '0x2619a9dc0428f87c0921ed22d0f10707c5c4ec9e8185764d8236d7ea996a9b03',
          ScriptHashType.Type
        )
        const input = createInput(alice.lockScript, typeScript, '0x' + '0'.repeat(64))
        const asssetAccountInput = input.toModel()
        asssetAccountInput.capacity = toShannon('142')
        const res = await TransactionGenerator.generateDestoryAssetAccountTx(
          alice.walletId,
          [asssetAccountInput],
          bob.publicKeyInBlake160,
          false
        )
        const expectCapacity = BigInt(toShannon('142')) - TransactionFee.fee(TransactionSize.tx(res), BigInt(1e4))
        expect(res.outputs[0].capacity).toBe(expectCapacity.toString())
      })
    })
  })
})
