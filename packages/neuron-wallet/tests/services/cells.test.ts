import { getConnection } from 'typeorm'
import { config, helpers } from '@ckb-lumos/lumos'
import { initConnection } from '../../src/database/chain/ormconfig'
import OutputEntity from '../../src/database/chain/entities/output'
import { OutputStatus } from '../../src/models/chain/output'
import CellsService, { CustomizedLock, CustomizedType } from '../../src/services/cells'
import { CapacityNotEnough, CapacityNotEnoughForChange, LiveCapacityNotEnough } from '../../src/exceptions/wallet'
import TransactionEntity from '../../src/database/chain/entities/transaction'
import TransactionSize from '../../src/models/transaction-size'
import TransactionFee from '../../src/models/transaction-fee'
import Script, { ScriptHashType } from '../../src/models/chain/script'
import { TransactionStatus } from '../../src/models/chain/transaction'
import Transaction from '../../src/models/chain/transaction'
import Output from '../../src/models/chain/output'
import Input from '../../src/models/chain/input'
import SystemScriptInfo from '../../src/models/system-script-info'
import TransactionPersistor from '../../src/services/tx/transaction-persistor'
import OutPoint from '../../src/models/chain/out-point'
import HdPublicKeyInfo from '../../src/database/chain/entities/hd-public-key-info'
import Multisig from '../../src/models/multisig'
import AssetAccountInfo from '../../src/models/asset-account-info'
import MultisigOutput from '../../src/database/chain/entities/multisig-output'
import { MultisigConfigNeedError, TransactionInputParamterMiss } from '../../src/exceptions'
import LiveCell from '../../src/models/chain/live-cell'
import BufferUtils from '../../src/utils/buffer'

const randomHex = (length: number = 64): string => {
  const str: string = Array.from({ length })
    .map(() => Math.floor(Math.random() * 16).toString(16))
    .join('')

  return `0x${str}`
}

const getManyByLockScriptsAndTypeScriptMock = jest.fn()
jest.mock('../../src/services/live-cell-service', () => ({
  getInstance() {
    return {
      getManyByLockScriptsAndTypeScript: getManyByLockScriptsAndTypeScriptMock,
    }
  },
}))

function resetMock() {
  getManyByLockScriptsAndTypeScriptMock.mockReset()
}

describe('CellsService', () => {
  const walletId1 = 'w1'
  const walletId2 = 'w2'
  const alicePublicKeyHash = '0xe2193df51d78411601796b35b17b4f8f2cd85bd0'
  const aliceLockScript = SystemScriptInfo.generateSecpScript(alicePublicKeyHash)
  const alice = {
    lockScript: aliceLockScript,
    lockHash: aliceLockScript.computeHash(),
    address: helpers.encodeToAddress(aliceLockScript, { config: config.predefined.AGGRON4 }),
    blake160: alicePublicKeyHash,
    walletId: walletId1,
  }

  const bobPublicKeyHash = '0x36c329ed630d6ce750712a477543672adab57f4c'
  const bobLockScript = SystemScriptInfo.generateSecpScript(bobPublicKeyHash)
  const bob = {
    lockScript: bobLockScript,
    lockHash: bobLockScript.computeHash(),
    address: helpers.encodeToAddress(bobLockScript, { config: config.predefined.AGGRON4 }),
    blake160: bobPublicKeyHash,
    walletId: walletId1,
  }

  const multisigPublicKeyHash = '0x447ff8941a6f0162d2194e9b592bb2534a3e6b74'
  const multisigLockScript = SystemScriptInfo.generateMultiSignScript(multisigPublicKeyHash)
  const multisigInfo = {
    lockScript: multisigLockScript,
    lockHash: multisigLockScript.computeHash(),
    address: helpers.encodeToAddress(multisigLockScript, { config: config.predefined.AGGRON4 }),
    blake160: multisigPublicKeyHash,
    walletId: walletId1,
  }

  const charliePublicKeyHash = '0xe2193df51d78411601796b35b17b4f8f2cd80000'
  const charlieLockScript = SystemScriptInfo.generateSecpScript(charliePublicKeyHash)
  const charlie = {
    lockScript: charlieLockScript,
    lockHash: charlieLockScript.computeHash(),
    address: helpers.encodeToAddress(charlieLockScript, { config: config.predefined.AGGRON4 }),
    blake160: charliePublicKeyHash,
    walletId: walletId2,
  }

  beforeAll(async () => {
    await initConnection('0x1234')
  })

  afterAll(async () => {
    await getConnection().close()
  })

  beforeEach(async () => {
    resetMock()
    const connection = getConnection()
    await connection.synchronize(true)

    const keyEntities = [alice, bob, charlie].map(d =>
      HdPublicKeyInfo.fromObject({
        walletId: d.walletId,
        publicKeyInBlake160: d.lockScript.args,
        addressType: 0,
        addressIndex: 0,
      })
    )

    await getConnection().manager.save(keyEntities)
  })

  const toShannon = (ckb: string) => `${ckb}00000000`
  const generateCell = (
    capacity: string,
    status: OutputStatus,
    hasData: boolean,
    typeScript: Script | null,
    who: any = bob,
    daoData: string | null = null,
    transaction: TransactionEntity | null = null
  ) => {
    const output = new OutputEntity()
    output.outPointTxHash = randomHex()
    output.outPointIndex = '0'
    output.capacity = capacity
    output.lockCodeHash = who.lockScript.codeHash
    output.lockArgs = who.lockScript.args
    output.lockHashType = who.lockScript.hashType
    if (who.lockScript.codeHash === SystemScriptInfo.MULTI_SIGN_CODE_HASH) {
      output.multiSignBlake160 = who.lockScript.args
    }
    output.lockHash = who.lockScript.computeHash()
    output.status = status
    output.hasData = hasData
    if (typeScript) {
      output.typeCodeHash = typeScript.codeHash
      output.typeArgs = typeScript.args
      output.typeHashType = typeScript.hashType
      output.typeHash = typeScript.computeHash()
    }
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
    typeScript: Script | null,
    who: any = bob
  ) => {
    const cell = generateCell(capacity, status, hasData, typeScript, who)
    await getConnection().manager.save(cell)
    return cell
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
    multisigCell.lockHash = who.lockHash
    await getConnection().manager.save(multisigCell)
    return multisigCell
  }

  const typeScript = new Script(randomHex(), '0x', ScriptHashType.Data)

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

  describe('#getBalanceByWalletId', () => {
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

      const balanceInfo = await CellsService.getBalancesByWalletId(walletId1)
      let balance = BigInt(0)
      balanceInfo.liveBalances.forEach(v => (balance += BigInt(v)))
      expect(balance.toString()).toEqual('100')
    })

    it('getBalance, Sent, skip', async () => {
      await createCells()

      const balanceInfo = await CellsService.getBalancesByWalletId(walletId1)
      let balance = BigInt(0)
      balanceInfo.sentBalances.forEach(v => (balance += BigInt(v)))
      expect(balance.toString()).toEqual('200')
    })

    it('getBalance with alice', async () => {
      await createCells()
      await createCell('2222', OutputStatus.Live, false, null, alice)

      const balanceInfo = await CellsService.getBalancesByWalletId(walletId1)
      let balance = BigInt(0)
      balanceInfo.liveBalances.forEach(v => (balance += BigInt(v)))
      expect(balance.toString()).toEqual((100 + 2222).toString())
    })

    it(`get alice's balance`, async () => {
      await createCell('2222', OutputStatus.Live, false, null, alice)
      await createCell('100', OutputStatus.Live, false, null, charlie)

      const balanceInfo = await CellsService.getBalancesByWalletId(walletId1)
      let balance = BigInt(0)
      balanceInfo.liveBalances.forEach(v => (balance += BigInt(v)))
      expect(balance.toString()).toEqual('2222')
    })
  })

  describe('#gatherInputs', () => {
    const createCells = async () => {
      const cells: OutputEntity[] = [
        generateCell(toShannon('1000'), OutputStatus.Live, false, null),
        generateCell(toShannon('1'), OutputStatus.Live, false, null, {
          lockScript: new Script(bob.lockScript.codeHash, bob.lockScript.args, ScriptHashType.Data),
        }),
        generateCell(toShannon('200'), OutputStatus.Sent, false, null),
        generateCell(toShannon('2000'), OutputStatus.Live, true, null),
        generateCell(toShannon('3000'), OutputStatus.Live, false, typeScript),
      ]
      await getConnection().manager.save(cells)
    }

    it('1000, skip', async () => {
      await createCells()

      const result = await CellsService.gatherInputs(toShannon('1000'), walletId1)

      expect(result.capacities).toEqual('100000000000')
    })

    it('1001, LiveCapacityNotEnough', async () => {
      await createCells()

      let error
      try {
        await CellsService.gatherInputs(toShannon('1001'), walletId1)
      } catch (e) {
        error = e
      }
      expect(error).toBeInstanceOf(LiveCapacityNotEnough)
    })

    it('1140, LiveCapacityNotEnough', async () => {
      await createCells()

      let error
      try {
        await CellsService.gatherInputs(toShannon('1140'), walletId1)
      } catch (e) {
        error = e
      }
      expect(error).toBeInstanceOf(LiveCapacityNotEnough)
    })

    it('1200, LiveCapacityNotEnough', async () => {
      await createCells()

      let error
      try {
        await CellsService.gatherInputs(toShannon('1200'), walletId1)
      } catch (e) {
        error = e
      }
      expect(error).toBeInstanceOf(LiveCapacityNotEnough)
    })

    it('1201, skip', async () => {
      await createCells()

      let error
      try {
        await CellsService.gatherInputs(toShannon('1201'), walletId1)
      } catch (e) {
        error = e
      }
      expect(error).toBeInstanceOf(CapacityNotEnough)
    })

    it(`bob's and alice's cells`, async () => {
      await createCells()
      await createCell(toShannon('5000'), OutputStatus.Live, false, null, alice)

      const result = await CellsService.gatherInputs(toShannon('6000'), alice.walletId)

      expect(result.capacities).toEqual('600000000000')
    })

    it(`only charlie's cells`, async () => {
      await createCell(toShannon('1000'), OutputStatus.Live, false, null, charlie)
      await createCell(toShannon('1000'), OutputStatus.Sent, false, null, charlie)
      await createCell(toShannon('5000'), OutputStatus.Live, false, null, alice)

      expect(alice.walletId).not.toEqual(charlie.walletId)
      await CellsService.gatherInputs(toShannon('1000'), charlie.walletId)

      let error
      try {
        await CellsService.gatherInputs(toShannon('1001'), charlie.walletId)
      } catch (e) {
        error = e
      }

      expect(error).toBeInstanceOf(LiveCapacityNotEnough)
    })

    it('capacity not enough for change', async () => {
      await createCell(toShannon('100'), OutputStatus.Live, false, null)
      let error
      try {
        await CellsService.gatherInputs(toShannon('77'), walletId1)
      } catch (e) {
        error = e
      }

      expect(error).toBeInstanceOf(CapacityNotEnoughForChange)
    })

    it('capacity 0, feeRate 1000, no cells', async () => {
      let error
      try {
        await CellsService.gatherInputs('0', walletId1, '0', '1000')
      } catch (e) {
        error = e
      }

      expect(error).toBeInstanceOf(CapacityNotEnough)
    })

    it('capacity 0, fee 1000, no cells', async () => {
      let error
      try {
        await CellsService.gatherInputs('0', walletId1, '1000')
      } catch (e) {
        error = e
      }

      expect(error).toBeInstanceOf(CapacityNotEnough)
    })

    describe('skip, by feeRate 1000', () => {
      beforeEach(async () => {
        const cells: OutputEntity[] = [
          generateCell(toShannon('1000'), OutputStatus.Live, false, null),
          generateCell(toShannon('2000'), OutputStatus.Live, false, null),
        ]
        await getConnection().manager.save(cells)
      })

      it('capacity 500', async () => {
        const feeRate = '1000'
        const result = await CellsService.gatherInputs(toShannon('500'), walletId1, '0', feeRate)
        expect(result.capacities).toEqual(toShannon('1000'))
        const expectedSize = TransactionSize.input() + TransactionSize.secpLockWitness()
        expect(BigInt(result.finalFee)).toEqual(TransactionFee.fee(expectedSize, BigInt(feeRate)))
      })

      it('capacity 1000', async () => {
        const feeRate = '1000'
        const result = await CellsService.gatherInputs(toShannon('1000'), walletId1, '0', feeRate)
        const expectedSize =
          2 * TransactionSize.input() + TransactionSize.secpLockWitness() + TransactionSize.emptyWitness()
        expect(result.capacities).toEqual(toShannon('3000'))
        expect(BigInt(result.finalFee)).toEqual(TransactionFee.fee(expectedSize, BigInt(feeRate)))
      })

      it('capacity 1000 - inputFee', async () => {
        const feeRate = '1000'
        const inputSize = TransactionSize.input() + TransactionSize.secpLockWitness()
        const expectedFee = TransactionFee.fee(inputSize, BigInt(feeRate))

        const capacity = BigInt(1000 * 10 ** 8) - expectedFee
        const result = await CellsService.gatherInputs(capacity.toString(), walletId1, '0', feeRate)
        expect(result.capacities).toEqual(toShannon('1000'))
        expect(BigInt(result.finalFee)).toEqual(expectedFee)
      })

      it('capacity 1000 - inputFee + 1 shannon', async () => {
        const feeRate = '1000'
        const inputSize = TransactionSize.input() + TransactionSize.secpLockWitness()
        const inputFee = TransactionFee.fee(inputSize, BigInt(feeRate))

        const capacity = BigInt(1000 * 10 ** 8) - inputFee + BigInt(1)
        const result = await CellsService.gatherInputs(capacity.toString(), walletId1, '0', feeRate)
        expect(result.capacities).toEqual(toShannon('3000'))
        const expectedSize =
          TransactionSize.input() * 2 + TransactionSize.secpLockWitness() + TransactionSize.emptyWitness()
        const expectedFee = TransactionFee.fee(expectedSize, BigInt(feeRate))
        expect(BigInt(result.finalFee)).toEqual(expectedFee)
      })
    })

    describe('when gather inputs with non exist lock code hash', () => {
      const lockCodeHash = 'non exist lock code hash'
      beforeEach(async () => {
        await createCells()
      })
      it('throws CapacityNotEnough', async () => {
        let error
        try {
          await CellsService.gatherInputs(
            toShannon('1000'),
            walletId1,
            undefined,
            undefined,
            undefined,
            undefined,
            undefined,
            undefined,
            { codeHash: lockCodeHash, hashType: ScriptHashType.Type }
          )
        } catch (e) {
          error = e
        }

        expect(error).toBeInstanceOf(CapacityNotEnough)
      })
    })

    describe('gather in multisig output', () => {
      beforeEach(async () => {
        await createMultisigCell(toShannon('1000'), OutputStatus.Live, multisigInfo)
      })

      it('no walletId and no lockargs', async () => {
        await expect(CellsService.gatherInputs('', '')).rejects.toThrow(new TransactionInputParamterMiss())
      })

      it('no live cell throw CapacityNotEnough', async () => {
        await expect(
          CellsService.gatherInputs(toShannon('1001'), '', '0', '1000', 0, 0, 0, undefined, {
            lockArgs: ['bob.blake160'],
            hashType: SystemScriptInfo.MULTI_SIGN_HASH_TYPE,
            codeHash: SystemScriptInfo.MULTI_SIGN_CODE_HASH,
          })
        ).rejects.toThrow(new CapacityNotEnough())
      })

      it('MultisigConfigNeedError', async () => {
        await expect(
          CellsService.gatherInputs(toShannon('1001'), '', '0', '1000', 0, 0, 0, undefined, {
            lockArgs: [multisigInfo.lockScript.args],
            hashType: SystemScriptInfo.MULTI_SIGN_HASH_TYPE,
            codeHash: SystemScriptInfo.MULTI_SIGN_CODE_HASH,
          })
        ).rejects.toThrow(new MultisigConfigNeedError())
      })

      it('live cell not enough throw CapacityNotEnough', async () => {
        await expect(
          CellsService.gatherInputs(
            toShannon('1001'),
            '',
            '0',
            '1000',
            0,
            0,
            0,
            undefined,
            {
              lockArgs: [multisigInfo.lockScript.args],
              hashType: SystemScriptInfo.MULTI_SIGN_HASH_TYPE,
              codeHash: SystemScriptInfo.MULTI_SIGN_CODE_HASH,
            },
            [
              {
                r: 1,
                m: 1,
                n: 1,
                getLockHash() {
                  return multisigInfo.lockHash
                },
              } as any,
            ]
          )
        ).rejects.toThrow(new CapacityNotEnough())
      })
      it('some live cell status is sent throw CapacityNotEnough', async () => {
        await createMultisigCell(toShannon('1000'), OutputStatus.Sent, multisigInfo)
        await expect(
          CellsService.gatherInputs(
            toShannon('1001'),
            '',
            '0',
            '1000',
            0,
            0,
            0,
            undefined,
            {
              lockArgs: [multisigInfo.lockScript.args],
              hashType: SystemScriptInfo.MULTI_SIGN_HASH_TYPE,
              codeHash: SystemScriptInfo.MULTI_SIGN_CODE_HASH,
            },
            [
              {
                r: 1,
                m: 1,
                n: 1,
                getLockHash() {
                  return multisigInfo.lockHash
                },
              } as any,
            ]
          )
        ).rejects.toThrow(new LiveCapacityNotEnough())
      })
      it('left capcity not enough for a cell throw CapacityNotEnoughForChange', async () => {
        await createMultisigCell(toShannon('1000'), OutputStatus.Sent, multisigInfo)
        await expect(
          CellsService.gatherInputs(
            toShannon('990'),
            '',
            '0',
            '1000',
            0,
            0,
            0,
            undefined,
            {
              lockArgs: [multisigInfo.lockScript.args],
              hashType: SystemScriptInfo.MULTI_SIGN_HASH_TYPE,
              codeHash: SystemScriptInfo.MULTI_SIGN_CODE_HASH,
            },
            [
              {
                r: 1,
                m: 1,
                n: 1,
                getLockHash() {
                  return multisigInfo.lockHash
                },
              } as any,
            ]
          )
        ).rejects.toThrow(new LiveCapacityNotEnough())
      })
      it('left capcity not enough for a cell throw CapacityNotEnoughForChange', async () => {
        await expect(
          CellsService.gatherInputs(
            toShannon('990'),
            '',
            '0',
            '1000',
            0,
            0,
            0,
            undefined,
            {
              lockArgs: [multisigInfo.lockScript.args],
              hashType: SystemScriptInfo.MULTI_SIGN_HASH_TYPE,
              codeHash: SystemScriptInfo.MULTI_SIGN_CODE_HASH,
            },
            [
              {
                r: 1,
                m: 1,
                n: 1,
                getLockHash() {
                  return multisigInfo.lockHash
                },
              } as any,
            ]
          )
        ).rejects.toThrow(new CapacityNotEnoughForChange())
      })
      it('success gather input', async () => {
        const feeRate = '1000'
        const multisigConfig = { r: 1, m: 1, n: 1 }
        const res = await CellsService.gatherInputs(
          toShannon('900'),
          '',
          '0',
          feeRate,
          0,
          0,
          0,
          undefined,
          {
            lockArgs: [multisigInfo.lockScript.args],
            hashType: SystemScriptInfo.MULTI_SIGN_HASH_TYPE,
            codeHash: SystemScriptInfo.MULTI_SIGN_CODE_HASH,
          },
          [
            {
              ...multisigConfig,
              getLockHash() {
                return multisigInfo.lockHash
              },
            } as any,
          ]
        )
        const input = await getConnection().getRepository(MultisigOutput).createQueryBuilder('multisig_output').getOne()
        expect(res).toEqual({
          inputs: [new Input(input!.outPoint(), '0', input!.capacity, input!.lockScript(), input!.lockHash)],
          capacities: toShannon('1000'),
          finalFee: TransactionFee.fee(
            TransactionSize.input() +
              TransactionSize.multiSignWitness(multisigConfig.r, multisigConfig.m, multisigConfig.n),
            BigInt('1000')
          ).toString(),
          hasChangeOutput: true,
        })
      })
    })
  })

  describe('#gatherAllInputs', () => {
    beforeEach(async () => {
      const cells: OutputEntity[] = [
        generateCell(toShannon('1000'), OutputStatus.Live, false, null),
        generateCell(toShannon('1'), OutputStatus.Live, false, null, {
          lockScript: new Script(bob.lockScript.codeHash, bob.lockScript.args, ScriptHashType.Data),
        }),
        generateCell(toShannon('200'), OutputStatus.Sent, false, null),
        generateCell(toShannon('2000'), OutputStatus.Live, true, null),
        generateCell(toShannon('3000'), OutputStatus.Live, false, typeScript),
      ]
      await getConnection().manager.save(cells)
    })
    describe('with the default lock code hash', () => {
      let allInputs: Input[]
      beforeEach(async () => {
        allInputs = await CellsService.gatherAllInputs(walletId1)
      })
      it('returns the cells that are live/has no data/has no type script', async () => {
        expect(allInputs.length).toEqual(1)
        expect(allInputs[0].capacity).toEqual(toShannon('1000'))
      })
    })
    describe('with non exist lock code hash', () => {
      let allInputs: Input[]
      beforeEach(async () => {
        allInputs = await CellsService.gatherAllInputs(walletId1, {
          codeHash: 'non exist lock code hash',
          hashType: ScriptHashType.Type,
        })
      })
      it('returns empty array', async () => {
        expect(allInputs.length).toEqual(0)
      })
    })
    describe('gather with lock args', () => {
      beforeEach(async () => {
        await createMultisigCell(toShannon('1000'), OutputStatus.Live, multisigInfo)
      })
      it('gather with exist args', async () => {
        const inputs = await CellsService.gatherAllInputs(walletId1, {
          codeHash: SystemScriptInfo.MULTI_SIGN_CODE_HASH,
          hashType: SystemScriptInfo.MULTI_SIGN_HASH_TYPE,
          args: multisigInfo.lockScript.args,
        })
        expect(inputs).toHaveLength(1)
        expect(inputs[0].capacity).toEqual(toShannon('1000'))
      })
      it('gather with non-exist args', async () => {
        const inputs = await CellsService.gatherAllInputs(walletId1, {
          codeHash: SystemScriptInfo.MULTI_SIGN_CODE_HASH,
          hashType: SystemScriptInfo.MULTI_SIGN_HASH_TYPE,
          args: 'non-exist-args',
        })
        expect(inputs).toHaveLength(0)
      })
    })
  })

  describe('#getDaoCells', () => {
    const depositData = '0x0000000000000000'
    const withdrawData = '0x000000000000000a'
    const generateTx = (hash: string, timestamp: string) => {
      const tx = new TransactionEntity()
      tx.hash = hash
      tx.version = '0x0'
      tx.timestamp = timestamp
      tx.status = TransactionStatus.Success
      tx.witnesses = []
      tx.blockNumber = '1'
      tx.blockHash = '0x' + '10'.repeat(32)
      return tx
    }

    const createCells = async () => {
      const tx1 = generateTx('0x1234', '1572862777481')
      const tx2 = generateTx('0x5678', '1572862829087')
      const cells: OutputEntity[] = [
        generateCell(toShannon('1000'), OutputStatus.Live, false, null, bob, depositData, tx1),
        generateCell(toShannon('2000'), OutputStatus.Live, false, null, bob, withdrawData, tx1),
        generateCell(toShannon('3000'), OutputStatus.Live, false, null, bob, depositData, tx2),
        generateCell(toShannon('4000'), OutputStatus.Live, false, null, bob, withdrawData, tx2),
      ]
      await getConnection().manager.save([tx1, tx2, ...cells])
    }

    const depositTxHash = '0x' + '0'.repeat(64)
    const depositTx = Transaction.fromObject({
      hash: depositTxHash,
      version: '0x0',
      timestamp: '1572862777481',
      status: TransactionStatus.Success,
      witnesses: [],
      blockNumber: '1',
      blockHash: '0x' + '1'.repeat(64),
      inputs: [],
      outputs: [
        Output.fromObject({
          capacity: '1000',
          daoData: depositData,
          lock: bob.lockScript,
          type: SystemScriptInfo.generateDaoScript(),
        }),
      ],
    })

    const withdrawTxHash = '0x' + '2'.repeat(64)
    const withdrawTx = Transaction.fromObject({
      hash: withdrawTxHash,
      version: '0x0',
      timestamp: '1572862777482',
      status: TransactionStatus.Success,
      witnesses: [],
      blockNumber: '2',
      blockHash: '0x' + '3'.repeat(64),
      inputs: [
        Input.fromObject({
          previousOutput: new OutPoint(depositTxHash, '0'),
          since: '0',
        }),
      ],
      outputs: [
        Output.fromObject({
          capacity: '1000',
          daoData: withdrawData,
          lock: bob.lockScript,
          type: SystemScriptInfo.generateDaoScript(),
          depositOutPoint: new OutPoint(depositTxHash, '0'),
          depositTimestamp: depositTx.timestamp,
        }),
      ],
    })

    const unlockTxHash = '0x' + '4'.repeat(64)
    const unlockTx = Transaction.fromObject({
      hash: unlockTxHash,
      version: '0x0',
      timestamp: '1572862777483',
      status: TransactionStatus.Success,
      witnesses: [],
      blockNumber: '3',
      blockHash: '0x' + '5'.repeat(64),
      inputs: [
        Input.fromObject({
          previousOutput: new OutPoint(withdrawTxHash, '0'),
          since: '0',
        }),
      ],
      outputs: [
        Output.fromObject({
          capacity: '1000',
          lock: bob.lockScript,
        }),
      ],
    })

    it('deposit', async () => {
      await TransactionPersistor.saveFetchTx(depositTx)

      const daoCells = await CellsService.getDaoCells(walletId1)

      expect(daoCells.length).toEqual(1)
      const daoCell = daoCells[0]!
      expect(daoCell.status).toEqual(OutputStatus.Live)
      expect(daoCell.outPoint!.txHash).toEqual(depositTx.hash)
      expect(daoCell.depositTimestamp).toBeFalsy()
      expect(daoCell.depositOutPoint).toBeFalsy()
      expect(daoCell.depositInfo!.txHash).toEqual(depositTx.hash)
      expect(daoCell.depositInfo!.timestamp).toEqual(depositTx.timestamp)
      expect(daoCell.withdrawInfo).toBeFalsy()
      expect(daoCell.unlockInfo).toBeFalsy()
    })

    it('deposit pending', async () => {
      await TransactionPersistor.saveSentTx(depositTx, depositTxHash)

      const daoCells = await CellsService.getDaoCells(walletId1)

      expect(daoCells.length).toEqual(1)
      const daoCell = daoCells[0]!
      expect(daoCell.status).toEqual(OutputStatus.Sent)
      expect(daoCell.outPoint!.txHash).toEqual(depositTx.hash)
      expect(daoCell.depositTimestamp).toBeFalsy()
      expect(daoCell.depositOutPoint).toBeFalsy()
      expect(daoCell.depositInfo!.txHash).toEqual(depositTx.hash)
      expect(daoCell.depositInfo!.timestamp).toEqual(depositTx.timestamp)
      expect(daoCell.withdrawInfo).toBeFalsy()
      expect(daoCell.unlockInfo).toBeFalsy()
    })

    it('withdraw', async () => {
      await TransactionPersistor.saveFetchTx(depositTx)
      await TransactionPersistor.saveFetchTx(withdrawTx)

      const daoCells = await CellsService.getDaoCells(walletId1)

      expect(daoCells.length).toEqual(1)
      const daoCell = daoCells[0]!
      expect(daoCell.status).toEqual(OutputStatus.Live)
      expect(daoCell.outPoint!.txHash).toEqual(withdrawTx.hash)
      expect(daoCell.depositTimestamp).toEqual(depositTx.timestamp)
      expect(daoCell.depositOutPoint!.txHash).toEqual(depositTx.hash)
      expect(daoCell.depositOutPoint!.index).toEqual('0')
      expect(daoCell.depositInfo!.txHash).toEqual(depositTx.hash)
      expect(daoCell.depositInfo!.timestamp).toEqual(depositTx.timestamp)
      expect(daoCell.withdrawInfo!.txHash).toEqual(withdrawTx.hash)
      expect(daoCell.withdrawInfo!.timestamp).toEqual(withdrawTx.timestamp)
      expect(daoCell.unlockInfo).toBeFalsy()
    })

    it('withdraw pending', async () => {
      await TransactionPersistor.saveFetchTx(depositTx)
      await TransactionPersistor.saveSentTx(withdrawTx, withdrawTxHash)

      const daoCells = await CellsService.getDaoCells(walletId1)

      expect(daoCells.length).toEqual(1)
      const daoCell = daoCells[0]!
      expect(daoCell.status).toEqual(OutputStatus.Sent)
      expect(daoCell.outPoint!.txHash).toEqual(withdrawTx.hash)
      expect(daoCell.depositTimestamp).toEqual(depositTx.timestamp)
      expect(daoCell.depositOutPoint!.txHash).toEqual(depositTx.hash)
      expect(daoCell.depositOutPoint!.index).toEqual('0')
      expect(daoCell.depositInfo!.txHash).toEqual(depositTx.hash)
      expect(daoCell.depositInfo!.timestamp).toEqual(depositTx.timestamp)
      expect(daoCell.withdrawInfo!.txHash).toEqual(withdrawTx.hash)
      expect(daoCell.withdrawInfo!.timestamp).toEqual(withdrawTx.timestamp)
      expect(daoCell.unlockInfo).toBeFalsy()
    })

    it('unlock', async () => {
      await TransactionPersistor.saveFetchTx(depositTx)
      await TransactionPersistor.saveFetchTx(withdrawTx)
      await TransactionPersistor.saveFetchTx(unlockTx)

      const daoCells = await CellsService.getDaoCells(walletId1)

      expect(daoCells.length).toEqual(1)
      const daoCell = daoCells[0]!
      expect(daoCell.status).toEqual(OutputStatus.Dead)
      expect(daoCell.outPoint!.txHash).toEqual(withdrawTx.hash)
      expect(daoCell.depositTimestamp).toEqual(depositTx.timestamp)
      expect(daoCell.depositOutPoint!.txHash).toEqual(depositTx.hash)
      expect(daoCell.depositOutPoint!.index).toEqual('0')
      expect(daoCell.depositInfo!.txHash).toEqual(depositTx.hash)
      expect(daoCell.depositInfo!.timestamp).toEqual(depositTx.timestamp)
      expect(daoCell.withdrawInfo!.txHash).toEqual(withdrawTx.hash)
      expect(daoCell.withdrawInfo!.timestamp).toEqual(withdrawTx.timestamp)
      expect(daoCell.unlockInfo!.txHash).toEqual(unlockTx.hash)
      expect(daoCell.unlockInfo!.timestamp).toEqual(unlockTx.timestamp)
    })

    it('unlock pending', async () => {
      await TransactionPersistor.saveFetchTx(depositTx)
      await TransactionPersistor.saveFetchTx(withdrawTx)
      await TransactionPersistor.saveSentTx(unlockTx, unlockTxHash)

      const daoCells = await CellsService.getDaoCells(walletId1)

      expect(daoCells.length).toEqual(1)
      const daoCell = daoCells[0]!
      expect(daoCell.status).toEqual(OutputStatus.Pending)
      expect(daoCell.outPoint!.txHash).toEqual(withdrawTx.hash)
      expect(daoCell.depositTimestamp).toEqual(depositTx.timestamp)
      expect(daoCell.depositOutPoint!.txHash).toEqual(depositTx.hash)
      expect(daoCell.depositOutPoint!.index).toEqual('0')
      expect(daoCell.depositInfo!.txHash).toEqual(depositTx.hash)
      expect(daoCell.depositInfo!.timestamp).toEqual(depositTx.timestamp)
      expect(daoCell.withdrawInfo!.txHash).toEqual(withdrawTx.hash)
      expect(daoCell.withdrawInfo!.timestamp).toEqual(withdrawTx.timestamp)
      expect(daoCell.unlockInfo!.txHash).toEqual(unlockTx.hash)
      expect(daoCell.unlockInfo!.timestamp).toEqual(unlockTx.timestamp)
    })

    it('get all in correct order', async () => {
      await createCells()
      const cells = await CellsService.getDaoCells(walletId1)
      const expectedCapacitySort = ['2000', '4000', '1000', '3000'].map(capacity => toShannon(capacity))
      expect(cells.map(c => c.capacity)).toEqual(expectedCapacitySort)
    })

    it('make sure timestamp/blockNumber/blockHash', async () => {
      await createCells()
      const cells = await CellsService.getDaoCells(walletId1)
      const firstCell = cells[0]!
      expect(firstCell.timestamp).toBeDefined()
      expect(firstCell.blockNumber).toBeDefined()
      expect(firstCell.blockHash).toBeDefined()
    })
  })

  describe('#addUnlockInfo', () => {
    const depositData = '0x0000000000000000'
    const withdrawData = '0x000000000000000a'
    const generateTx = (hash: string, timestamp: string) => {
      const tx = new TransactionEntity()
      tx.hash = hash
      tx.version = '0x0'
      tx.timestamp = timestamp
      tx.status = TransactionStatus.Success
      tx.witnesses = []
      tx.blockNumber = '1'
      tx.blockHash = '0x' + '10'.repeat(32)
      return tx
    }

    const withdrawTxHash = '0x' + '2'.repeat(64)

    const unlockTxHash = '0x' + '4'.repeat(64)
    const unlockTx = Transaction.fromObject({
      hash: unlockTxHash,
      version: '0x0',
      timestamp: '1572862777483',
      status: TransactionStatus.Success,
      witnesses: [],
      blockNumber: '3',
      blockHash: '0x' + '5'.repeat(64),
      inputs: [
        Input.fromObject({
          previousOutput: new OutPoint(withdrawTxHash, '0'),
          since: '0',
        }),
      ],
      outputs: [
        Output.fromObject({
          capacity: '1000',
          lock: bob.lockScript,
        }),
      ],
    })

    const tx1 = generateTx('0x1234', '1572862777481')

    it('output cells is not cost', async () => {
      const cells = [generateCell(toShannon('1000'), OutputStatus.Live, false, null, bob, depositData, tx1).toModel()]
      //@ts-ignore private property
      await CellsService.addUnlockInfo(cells)
      expect(cells[0].unlockInfo).toBeUndefined()
    })

    it('output cells no transaction', async () => {
      const cells = [generateCell(toShannon('1000'), OutputStatus.Dead, false, null, bob, depositData, tx1).toModel()]
      //@ts-ignore private property
      await CellsService.addUnlockInfo(cells)
      expect(cells[0].unlockInfo).toBeUndefined()
    })

    it('output cells has cost', async () => {
      await TransactionPersistor.saveFetchTx(unlockTx)
      const outputs = Output.fromObject({
        capacity: '1000',
        daoData: withdrawData,
        lock: bob.lockScript,
        type: SystemScriptInfo.generateDaoScript(),
        outPoint: new OutPoint(withdrawTxHash, '0'),
        status: OutputStatus.Dead,
      })
      //@ts-ignore private property
      await CellsService.addUnlockInfo([outputs])
      expect(outputs.unlockInfo?.txHash).toEqual(unlockTxHash)
    })
  })

  describe('#addDepositInfo', () => {
    const depositData = '0x0000000000000000'
    const withdrawData = '0x000000000000000a'
    const generateTx = (hash: string, timestamp: string) => {
      const tx = new TransactionEntity()
      tx.hash = hash
      tx.version = '0x0'
      tx.timestamp = timestamp
      tx.status = TransactionStatus.Success
      tx.witnesses = []
      tx.blockNumber = '1'
      tx.blockHash = '0x' + '10'.repeat(32)
      return tx
    }

    const depositTxHash = '0x' + '0'.repeat(64)
    const depositTx = Transaction.fromObject({
      hash: depositTxHash,
      version: '0x0',
      timestamp: '1572862777481',
      status: TransactionStatus.Success,
      witnesses: [],
      blockNumber: '1',
      blockHash: '0x' + '1'.repeat(64),
      inputs: [],
      outputs: [
        Output.fromObject({
          capacity: '1000',
          daoData: depositData,
          lock: bob.lockScript,
          type: SystemScriptInfo.generateDaoScript(),
        }),
      ],
    })

    const tx1 = generateTx('0x1234', '1572862777481')

    it('output cells is not deposit', async () => {
      const cells = [generateCell(toShannon('1000'), OutputStatus.Live, false, null, bob, depositData, tx1).toModel()]
      //@ts-ignore private property
      await CellsService.addDepositInfo(cells)
      expect(cells[0].depositInfo).toBeUndefined()
    })

    it('output cells no transaction', async () => {
      const cells = [generateCell(toShannon('1000'), OutputStatus.Dead, false, null, bob, depositData, tx1).toModel()]
      cells[0].depositOutPoint = new OutPoint('0x' + '0'.repeat(64), '0x0')
      //@ts-ignore private property
      await CellsService.addDepositInfo(cells)
      expect(cells[0].depositInfo).toBeUndefined()
    })

    it('output cells has cost', async () => {
      await TransactionPersistor.saveFetchTx(depositTx)
      const outputs = Output.fromObject({
        capacity: '1000',
        daoData: withdrawData,
        lock: bob.lockScript,
        type: SystemScriptInfo.generateDaoScript(),
        depositOutPoint: new OutPoint(depositTx.hash!, '0'),
        status: OutputStatus.Dead,
      })
      //@ts-ignore
      await CellsService.addDepositInfo([outputs])
      expect(outputs.depositInfo?.txHash).toEqual(depositTxHash)
    })
  })

  describe('#usedByAnyoneCanPayBlake160s', () => {
    const fakeArgs1 = '0x01'
    const fakeArgs2 = '0x02'
    const fakeArgs3 = '0x03'
    const codeHash = randomHex()
    const lockScript1 = new Script(codeHash, fakeArgs1, ScriptHashType.Type)
    const lockScript2 = new Script(codeHash, fakeArgs2, ScriptHashType.Type)
    const lockScript3 = new Script(codeHash, fakeArgs3, ScriptHashType.Type)

    const owner1 = { lockScript: lockScript1, lockHash: lockScript1.computeHash() }
    const owner2 = { lockScript: lockScript2, lockHash: lockScript2.computeHash() }
    const owner3 = { lockScript: lockScript3, lockHash: lockScript3.computeHash() }

    beforeEach(async () => {
      await createCell('1000', OutputStatus.Live, false, null, owner1)
      await createCell('1000', OutputStatus.Sent, false, null, owner1)
      await createCell('3000', OutputStatus.Dead, false, null, owner2)
    })

    it('returns unique lock args', async () => {
      const lockHashes = [owner1.lockHash, owner2.lockHash]
      const blake160s = [owner1.lockScript.args, owner3.lockScript.args]

      const lockArgs = await CellsService.usedByAnyoneCanPayBlake160s(lockHashes, blake160s)
      expect(lockArgs).toEqual([owner1.lockScript.args])
    })
    it('matches different lock args for different combinations of lock hashes and blake160s', async () => {
      const lockHashes = [owner1.lockHash, owner2.lockHash]
      const blake160s = [owner1.lockScript.args, owner2.lockScript.args]

      const lockArgs = await CellsService.usedByAnyoneCanPayBlake160s(lockHashes, blake160s)
      expect(lockArgs).toEqual(blake160s)
    })
    it('returns empty array when no matches', async () => {
      const lockHashes = [owner3.lockHash]
      const blake160s = [owner3.lockScript.args]

      const lockArgs = await CellsService.usedByAnyoneCanPayBlake160s(lockHashes, blake160s)
      expect(lockArgs).toEqual([])
    })
  })

  describe('#getCustomizedAssetCells', () => {
    const assetAccountInfo = new AssetAccountInfo()
    const publicKeyHash = bob.lockScript.args
    const bobDefaultLock = SystemScriptInfo.generateSecpScript(publicKeyHash)
    const multiSignHash = Multisig.hash([publicKeyHash])
    const multiSignLockScript = SystemScriptInfo.generateMultiSignScript(multiSignHash)
    const pageSize = 2

    describe('with indexed customized asset outputs', () => {
      const user = {
        lockScript: multiSignLockScript,
      }

      const receiverChequeLock = assetAccountInfo.generateChequeScript(bobDefaultLock.computeHash(), '0'.repeat(40))
      const senderChequeLock = assetAccountInfo.generateChequeScript('0'.repeat(40), bobDefaultLock.computeHash())

      const acpLock = assetAccountInfo.generateAnyoneCanPayScript('0x')
      const sudtType = new Script(assetAccountInfo.getSudtCodeHash(), '0x', ScriptHashType.Type)

      beforeEach(async () => {
        const cells: OutputEntity[] = [
          generateCell('100', OutputStatus.Live, false, null, user),
          generateCell('100', OutputStatus.Live, false, null, user),
          generateCell('100', OutputStatus.Live, false, null, user),
          //should ignore these cells
          generateCell('200', OutputStatus.Sent, false, null, user),
          generateCell('300', OutputStatus.Pending, false, null, user),
          generateCell('400', OutputStatus.Dead, false, null, user),
          generateCell('1000', OutputStatus.Live, true, null, user),
          generateCell('10000', OutputStatus.Live, false, typeScript, user),
          generateCell('54321', OutputStatus.Live, true, sudtType, { lockScript: acpLock }),
          // cheque cell
          generateCell('10000', OutputStatus.Live, true, typeScript, { lockScript: receiverChequeLock }),
          generateCell('10000', OutputStatus.Live, true, typeScript, { lockScript: senderChequeLock }),
          // unknown asset
          generateCell('666', OutputStatus.Live, true, typeScript, { lockScript: bobDefaultLock }),
          // sudt asset
          generateCell('777', OutputStatus.Live, true, sudtType, { lockScript: bobDefaultLock }),
        ]
        await getConnection().manager.save(cells)
      })
      describe('when there are records matched', () => {
        describe('one page contains all results', () => {
          let result: any
          beforeEach(async () => {
            result = await CellsService.getCustomizedAssetCells([publicKeyHash], 1, 10)
          })
          it('returns all items', () => {
            expect(result.totalCount).toEqual(7)
            expect(result.items.length).toEqual(7)
            const totalCapacity = result.items.reduce((total: number, cell: any) => total + parseInt(cell.capacity), 0)
            expect(totalCapacity).toEqual(100 * 3 + 10000 * 2 + 666 + 777)
          })
          it('attaches setCustomizedAssetInfo to single multisign cells', async () => {
            const singleMultiSignCells = result.items.filter(
              (item: any) => item.customizedAssetInfo.lock === CustomizedLock.SingleMultiSign
            )
            expect(singleMultiSignCells.length).toBe(3)
            for (const item of singleMultiSignCells) {
              expect(item.customizedAssetInfo).toEqual({ data: '', lock: 'SingleMultiSign', type: '' })
            }
          })
          it('attaches setCustomizedAssetInfo to cheque cells', () => {
            const chequeCells = result.items.filter(
              (item: any) => item.customizedAssetInfo.lock === CustomizedLock.Cheque
            )
            expect(chequeCells.length).toEqual(2)
            expect(chequeCells[0].customizedAssetInfo.data).toBe('claimable')
            expect(chequeCells[1].customizedAssetInfo.data).toBe('withdraw-able')
          })

          it('attaches setCustomizedAssetInfo to unknown cells', () => {
            const cells = result.items.filter((item: any) => item.capacity === '666')
            expect(cells.length).toEqual(1)
            expect(cells[0].customizedAssetInfo.type).toBe('Unknown')
          })
          it('attaches setCustomizedAssetInfo to sudt cells', () => {
            const cells = result.items.filter((item: any) => item.capacity === '777')
            expect(cells.length).toEqual(1)
            expect(cells[0].customizedAssetInfo).toEqual({
              lock: CustomizedLock.SUDT,
              type: CustomizedType.SUDT,
              data: '',
            })
          })
        })
        describe('within pagination scope', () => {
          it('returns first page result', async () => {
            const page = 1
            const result = await CellsService.getCustomizedAssetCells([publicKeyHash], page, pageSize)
            expect(result.totalCount).toEqual(7)
            expect(result.items.length).toEqual(pageSize)
          })
          it('returns the remaining cells for the last page', async () => {
            const page = 2
            const result = await CellsService.getCustomizedAssetCells([publicKeyHash], page, pageSize)
            expect(result.totalCount).toEqual(7)
            expect(result.items.length).toEqual(2)
          })
        })
        describe('outside pagination scope', () => {
          it('returns empty result', async () => {
            const page = 8
            const result = await CellsService.getCustomizedAssetCells([publicKeyHash], page, pageSize)
            expect(result.totalCount).toEqual(7)
            expect(result.items.length).toEqual(0)
          })
        })
      })
      describe('when there is no record with customized assets matched', () => {
        it('returns empty result', async () => {
          const page = 1
          const result = await CellsService.getCustomizedAssetCells(['0x' + '0'.repeat(40)], page, pageSize)
          expect(result.totalCount).toEqual(0)
          expect(result.items.length).toEqual(0)
        })
      })
    })
    describe('with no indexed multi sign outputs', () => {
      it('returns empty result', async () => {
        const page = 1
        const result = await CellsService.getCustomizedAssetCells([publicKeyHash], page, pageSize)
        expect(result.totalCount).toEqual(0)
        expect(result.items.length).toEqual(0)
      })
    })
  })

  describe('getMultisigBalance', () => {
    beforeEach(async () => {
      await createMultisigCell(toShannon('1000'), OutputStatus.Live, multisigInfo)
    })
    it('multiaddress not empty', async () => {
      const multisigBalances = await CellsService.getMultisigBalances(false, [multisigInfo.address])
      expect(multisigBalances[multisigInfo.address]).toBe(toShannon('1000'))
    })
    it('multiaddress is empty', async () => {
      const multisigBalances = await CellsService.getMultisigBalances(false, [])
      expect(multisigBalances).toMatchObject({})
    })
  })

  describe('gatherSudtInputs', () => {
    const generateSUDTLiveCell = (
      capacity: string,
      lock: {
        codeHash: string
        args: string
        hashType: ScriptHashType
      },
      type: {
        codeHash: string
        args: string
        hashType: ScriptHashType
      },
      outPoint: {
        txHash: string
        index: string
      } = {
        txHash: '0x364ded6d4f2206041d0a635d63d3cfadc5b38b3a17e0cabc0d272d142d3542b8',
        index: '0x0',
      },
      data?: number
    ) => {
      return new LiveCell(
        outPoint.txHash,
        outPoint.index,
        `0x${BigInt(toShannon(capacity)).toString(16)}`,
        Script.fromObject(lock),
        Script.fromObject(type),
        data ? BufferUtils.writeBigUInt128LE(BigInt(data)) : '0x00'
      )
    }
    const gliaTypeScript = Script.fromObject({
      codeHash: '0xc5e5dcf215925f7ef4dfaf5f4b4f105bc321c02776d6e7d52a1db3fcd9d011a4',
      hashType: ScriptHashType.Type,
      args: '0x6fe3733cd9df22d05b8a70f7b505d0fb67fb58fb88693217135ff5079713e902',
    })
    it('exception no live cell CapacityNotEnough', async () => {
      getManyByLockScriptsAndTypeScriptMock.mockResolvedValue([])
      await expect(CellsService.gatherSudtInputs('0', walletId1, [], gliaTypeScript, '')).rejects.toThrow(
        new CapacityNotEnough()
      )
    })
    it('exception amount oveflow CapacityNotEnough', async () => {
      getManyByLockScriptsAndTypeScriptMock.mockResolvedValue([
        generateSUDTLiveCell('142', bobLockScript, gliaTypeScript, undefined, 1000),
      ])
      await expect(CellsService.gatherSudtInputs('2000', walletId1, [], gliaTypeScript, '')).rejects.toThrow(
        new CapacityNotEnough()
      )
    })
    it('no fee success with exist cell', async () => {
      const liveCell = generateSUDTLiveCell('142', bobLockScript, gliaTypeScript, undefined, 3000)
      getManyByLockScriptsAndTypeScriptMock.mockResolvedValue([liveCell])
      const res = await CellsService.gatherSudtInputs('2000', walletId1, [], gliaTypeScript, '')
      expect(res).toEqual({
        anyoneCanPayInputs: [
          Input.fromObject({
            previousOutput: liveCell.outPoint(),
            since: '0',
            capacity: liveCell.capacity,
            lock: liveCell.lock(),
            lockHash: liveCell.lockHash,
            type: liveCell.type(),
            typeHash: liveCell.typeHash,
            data: liveCell.data,
          }),
        ],
        changeInputs: [],
        anyoneCanPayOutputs: [
          Output.fromObject({
            capacity: liveCell.capacity,
            lock: liveCell.lock(),
            type: liveCell.type(),
            data: BufferUtils.writeBigUInt128LE(BigInt(1000)),
          }),
        ],
        changeOutput: undefined,
        finalFee: '0',
        amount: '2000',
      })
    }),
      it('fee not enough', async () => {
        const liveCell = generateSUDTLiveCell('142', bobLockScript, gliaTypeScript, undefined, 3000)
        getManyByLockScriptsAndTypeScriptMock.mockResolvedValue([liveCell])
        await expect(
          CellsService.gatherSudtInputs('2000', 'w3', [], gliaTypeScript, alice.blake160, '1000')
        ).rejects.toThrow(new CapacityNotEnough())
      })
    it('fee enough', async () => {
      const liveCell = generateSUDTLiveCell('142', bobLockScript, gliaTypeScript, undefined, 3000)
      const output = await createCell(toShannon('62'), OutputStatus.Live, false, null, { lockScript: bobLockScript })
      getManyByLockScriptsAndTypeScriptMock.mockResolvedValue([liveCell])
      const res = await CellsService.gatherSudtInputs('2000', walletId1, [], gliaTypeScript, alice.blake160, '1000')
      expect(res).toEqual({
        anyoneCanPayInputs: [
          Input.fromObject({
            previousOutput: liveCell.outPoint(),
            since: '0',
            capacity: liveCell.capacity,
            lock: liveCell.lock(),
            lockHash: liveCell.lockHash,
            type: liveCell.type(),
            typeHash: liveCell.typeHash,
            data: liveCell.data,
          }),
        ],
        changeInputs: [new Input(output.outPoint(), '0', output.capacity, output.lockScript(), output.lockHash)],
        anyoneCanPayOutputs: [
          Output.fromObject({
            capacity: liveCell.capacity,
            lock: liveCell.lock(),
            type: liveCell.type(),
            data: BufferUtils.writeBigUInt128LE(BigInt(1000)),
          }),
        ],
        changeOutput: Output.fromObject({
          capacity: (BigInt(toShannon('62')) - BigInt('1000')).toString(),
          lock: SystemScriptInfo.generateSecpScript(alice.blake160),
        }),
        finalFee: '1000',
        amount: '2000',
      })
    })
    it('add capacity and capacity not enough', async () => {
      const liveCell = generateSUDTLiveCell('142', bobLockScript, gliaTypeScript, undefined, 3000)
      await createCell(toShannon('61'), OutputStatus.Live, false, null, { lockScript: bobLockScript })
      getManyByLockScriptsAndTypeScriptMock.mockResolvedValue([liveCell])
      await expect(
        CellsService.gatherSudtInputs(
          '2000',
          walletId1,
          [],
          gliaTypeScript,
          alice.blake160,
          '1000',
          '0',
          0,
          0,
          0,
          toShannon('61')
        )
      ).rejects.toThrow(new CapacityNotEnough())
    })
    it('add capacity,no fee capacity enough', async () => {
      const liveCell = generateSUDTLiveCell('142', bobLockScript, gliaTypeScript, undefined, 3000)
      const output = await createCell(toShannon('61'), OutputStatus.Live, false, null, { lockScript: bobLockScript })
      getManyByLockScriptsAndTypeScriptMock.mockResolvedValue([liveCell])
      const res = await CellsService.gatherSudtInputs(
        '2000',
        walletId1,
        [],
        gliaTypeScript,
        alice.blake160,
        '0',
        '0',
        0,
        0,
        0,
        toShannon('61')
      )
      expect(res).toEqual({
        anyoneCanPayInputs: [
          Input.fromObject({
            previousOutput: liveCell.outPoint(),
            since: '0',
            capacity: liveCell.capacity,
            lock: liveCell.lock(),
            lockHash: liveCell.lockHash,
            type: liveCell.type(),
            typeHash: liveCell.typeHash,
            data: liveCell.data,
          }),
        ],
        changeInputs: [new Input(output.outPoint(), '0', output.capacity, output.lockScript(), output.lockHash)],
        anyoneCanPayOutputs: [
          Output.fromObject({
            capacity: liveCell.capacity,
            lock: liveCell.lock(),
            type: liveCell.type(),
            data: BufferUtils.writeBigUInt128LE(BigInt(1000)),
          }),
        ],
        changeOutput: undefined,
        finalFee: '0',
        amount: '2000',
      })
    })
    it('add capacity,with fee capacity not enough', async () => {
      const liveCell = generateSUDTLiveCell('142', bobLockScript, gliaTypeScript, undefined, 3000)
      await createCell(toShannon('61'), OutputStatus.Live, false, null, { lockScript: bobLockScript })
      getManyByLockScriptsAndTypeScriptMock.mockResolvedValue([liveCell])
      await expect(
        CellsService.gatherSudtInputs(
          '2000',
          walletId1,
          [],
          gliaTypeScript,
          alice.blake160,
          '1000',
          '0',
          0,
          0,
          0,
          toShannon('61')
        )
      ).rejects.toThrow(new CapacityNotEnough())
    })
    it('add capacity,with fee capacity enough', async () => {
      const liveCell = generateSUDTLiveCell('142', bobLockScript, gliaTypeScript, undefined, 3000)
      const output = await createCell(toShannon('123'), OutputStatus.Live, false, null, { lockScript: bobLockScript })
      getManyByLockScriptsAndTypeScriptMock.mockResolvedValue([liveCell])
      const res = await CellsService.gatherSudtInputs(
        '2000',
        walletId1,
        [],
        gliaTypeScript,
        alice.blake160,
        '1000',
        '0',
        0,
        0,
        0,
        toShannon('61')
      )
      expect(res).toEqual({
        anyoneCanPayInputs: [
          Input.fromObject({
            previousOutput: liveCell.outPoint(),
            since: '0',
            capacity: liveCell.capacity,
            lock: liveCell.lock(),
            lockHash: liveCell.lockHash,
            type: liveCell.type(),
            typeHash: liveCell.typeHash,
            data: liveCell.data,
          }),
        ],
        changeInputs: [new Input(output.outPoint(), '0', output.capacity, output.lockScript(), output.lockHash)],
        anyoneCanPayOutputs: [
          Output.fromObject({
            capacity: liveCell.capacity,
            lock: liveCell.lock(),
            type: liveCell.type(),
            data: BufferUtils.writeBigUInt128LE(BigInt(1000)),
          }),
        ],
        changeOutput: Output.fromObject({
          capacity: (BigInt(toShannon('123')) - BigInt(toShannon('61')) - BigInt('1000')).toString(),
          lock: SystemScriptInfo.generateSecpScript(alice.blake160),
        }),
        finalFee: '1000',
        amount: '2000',
      })
    })
  })
})
