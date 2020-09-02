import { getConnection } from 'typeorm'
import { initConnection } from '../../src/database/chain/ormconfig'
import OutputEntity from '../../src/database/chain/entities/output'
import { OutputStatus } from '../../src/models/chain/output'
import CellsService from '../../src/services/cells'
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
import AddressGenerator from '../../src/models/address-generator'
import { AddressPrefix } from '@nervosnetwork/ckb-sdk-utils'
import MultiSign from '../../src/models/multi-sign'


const randomHex = (length: number = 64): string => {
  const str: string = Array.from({ length })
    .map(() => Math.floor(Math.random() * 16).toString(16))
    .join('')

  return `0x${str}`
}

describe('CellsService', () => {
  const walletId1 = 'w1'
  const walletId2 = 'w2'
  const alicePublicKeyHash = '0xe2193df51d78411601796b35b17b4f8f2cd85bd0'
  const aliceLockScript = SystemScriptInfo.generateSecpScript(alicePublicKeyHash)
  const alice = {
    lockScript: aliceLockScript,
    lockHash: aliceLockScript.computeHash(),
    address:  AddressGenerator.generate(aliceLockScript, AddressPrefix.Testnet),
    blake160: alicePublicKeyHash,
    walletId: walletId1
  }

  const bobPublicKeyHash = '0x36c329ed630d6ce750712a477543672adab57f4c'
  const bobLockScript = SystemScriptInfo.generateSecpScript(bobPublicKeyHash)
  const bob = {
    lockScript: bobLockScript,
    lockHash: bobLockScript.computeHash(),
    address: AddressGenerator.generate(bobLockScript, AddressPrefix.Testnet),
    blake160: bobPublicKeyHash,
    walletId: walletId1
  }

  const charliePublicKeyHash = '0xe2193df51d78411601796b35b17b4f8f2cd80000'
  const charlieLockScript = SystemScriptInfo.generateSecpScript(charliePublicKeyHash)
  const charlie = {
    lockScript: charlieLockScript,
    lockHash: charlieLockScript.computeHash(),
    address: AddressGenerator.generate(charlieLockScript, AddressPrefix.Testnet),
    blake160: charliePublicKeyHash,
    walletId: walletId2
  }

  beforeAll(async () => {
    await initConnection('0x1234')
  })

  afterAll(async () => {
    await getConnection().close()
  })

  beforeEach(async () => {
    const connection = getConnection()
    await connection.synchronize(true)

    const keyEntities = [alice, bob, charlie].map(d => (
      HdPublicKeyInfo.fromObject({
        walletId: d.walletId,
        publicKeyInBlake160: d.lockScript.args,
        address: d.address,
        addressType: 0,
        addressIndex: 0,
      })
    ))

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
      balanceInfo.liveBalances.forEach(v => balance += BigInt(v))
      expect(balance.toString()).toEqual('100')
    })

    it('getBalance, Sent, skip', async () => {
      await createCells()

      const balanceInfo = await CellsService.getBalancesByWalletId(walletId1)
      let balance = BigInt(0)
      balanceInfo.sentBalances.forEach(v => balance += BigInt(v))
      expect(balance.toString()).toEqual('200')
    })

    it('getBalance with alice', async () => {
      await createCells()
      await createCell('2222', OutputStatus.Live, false, null, alice)

      const balanceInfo = await CellsService.getBalancesByWalletId(walletId1)
      let balance = BigInt(0)
      balanceInfo.liveBalances.forEach(v => balance += BigInt(v))
      expect(balance.toString()).toEqual((100 + 2222).toString())
    })

    it(`get alice's balance`, async () => {
      await createCell('2222', OutputStatus.Live, false, null, alice)
      await createCell('100', OutputStatus.Live, false, null, charlie)

      const balanceInfo = await CellsService.getBalancesByWalletId(walletId1)
      let balance = BigInt(0)
      balanceInfo.liveBalances.forEach(v => balance += BigInt(v))
      expect(balance.toString()).toEqual('2222')
    })
  })

  describe('#gatherInputs', () => {
    const createCells = async () => {
      const cells: OutputEntity[] = [
        generateCell(toShannon('1000'), OutputStatus.Live, false, null),
        generateCell(toShannon('1'), OutputStatus.Live, false, null, {
          lockScript: new Script(bob.lockScript.codeHash, bob.lockScript.args, ScriptHashType.Data)
        }),
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
        walletId1
      )

      expect(result.capacities).toEqual('100000000000')
    })

    it('1001, LiveCapacityNotEnough', async () => {
      await createCells()

      let error
      try {
        await CellsService.gatherInputs(
          toShannon('1001'),
          walletId1
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
          walletId1
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
          walletId1
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
          walletId1
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
        alice.walletId
      )

      expect(result.capacities).toEqual('600000000000')
    })

    it(`only charlie's cells`, async () => {
      await createCell(toShannon('1000'), OutputStatus.Live, false, null, charlie)
      await createCell(toShannon('1000'), OutputStatus.Sent, false, null, charlie)
      await createCell(toShannon('5000'), OutputStatus.Live, false, null, alice)

      expect(alice.walletId).not.toEqual(charlie.walletId)
      await CellsService.gatherInputs(
        toShannon('1000'),
        charlie.walletId
      )

      let error
      try {
        await CellsService.gatherInputs(
          toShannon('1001'),
          charlie.walletId
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
          walletId1
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
          walletId1,
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
          walletId1,
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
          walletId1,
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
          walletId1,
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
          walletId1,
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
          walletId1,
          '0',
          feeRate
        )
        expect(result.capacities).toEqual(toShannon('3000'))
        const expectedSize = TransactionSize.input() * 2 + TransactionSize.secpLockWitness() + TransactionSize.emptyWitness()
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
            {codeHash: lockCodeHash, hashType: ScriptHashType.Type}
          )
        } catch (e) {
          error = e
        }

        expect(error).toBeInstanceOf(CapacityNotEnough)
      })
    });
  })

  describe('#gatherAllInputs', () => {
    beforeEach(async () => {
      const cells: OutputEntity[] = [
        generateCell(toShannon('1000'), OutputStatus.Live, false, null),
        generateCell(toShannon('1'), OutputStatus.Live, false, null, {
          lockScript: new Script(bob.lockScript.codeHash, bob.lockScript.args, ScriptHashType.Data)
        }),
        generateCell(toShannon('200'), OutputStatus.Sent, false, null),
        generateCell(toShannon('2000'), OutputStatus.Live, true, null),
        generateCell(toShannon('3000'), OutputStatus.Live, false, typeScript),
      ]
      await getConnection().manager.save(cells)
    });
    describe('with the default lock code hash', () => {
      let allInputs: Input[]
      beforeEach(async () => {
        allInputs = await CellsService.gatherAllInputs(
          walletId1,
        )
      });
      it('returns the cells that are live/has no data/has no type script', async () => {
        expect(allInputs.length).toEqual(1)
        expect(allInputs[0].capacity).toEqual(toShannon('1000'))
      })
    });
    describe('with non exist lock code hash', () => {
      let allInputs: Input[]
      beforeEach(async () => {
        allInputs = await CellsService.gatherAllInputs(
          walletId1,
          {codeHash: 'non exist lock code hash', hashType: ScriptHashType.Type}
        )
      });
      it('returns empty array', async () => {
        expect(allInputs.length).toEqual(0)
      })
    });
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
      outputs: [Output.fromObject({
        capacity: '1000',
        daoData: depositData,
        lock: bob.lockScript,
        type: SystemScriptInfo.generateDaoScript()
      })]
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
      inputs: [Input.fromObject({
        previousOutput: new OutPoint(depositTxHash, '0'),
        since: '0'
      })],
      outputs: [Output.fromObject({
        capacity: '1000',
        daoData: withdrawData,
        lock: bob.lockScript,
        type: SystemScriptInfo.generateDaoScript(),
        depositOutPoint: new OutPoint(depositTxHash, '0'),
        depositTimestamp: depositTx.timestamp,
      })],
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
      inputs: [Input.fromObject({
        previousOutput: new OutPoint(withdrawTxHash, '0'),
        since: '0'
      })],
      outputs: [Output.fromObject({
        capacity: '1000',
        lock: bob.lockScript,
      })]
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
      const cells = await CellsService.getDaoCells(
        walletId1,
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
      await createCells()
      const cells = await CellsService.getDaoCells(
        walletId1,
      )
      const firstCell = cells[0]!
      expect(firstCell.timestamp).toBeDefined()
      expect(firstCell.blockNumber).toBeDefined()
      expect(firstCell.blockHash).toBeDefined()
    })
  })

  describe('#usedByAnyoneCanPayBlake160s', () => {
    const fakeArgs1 = '0x1'
    const fakeArgs2 = '0x2'
    const fakeArgs3 = '0x3'
    const codeHash = randomHex()
    const lockScript1 = new Script(codeHash, fakeArgs1, ScriptHashType.Type)
    const lockScript2 = new Script(codeHash, fakeArgs2, ScriptHashType.Type)
    const lockScript3 = new Script(codeHash, fakeArgs3, ScriptHashType.Type)

    const owner1 = {lockScript: lockScript1, lockHash: lockScript1.computeHash()}
    const owner2 = {lockScript: lockScript2, lockHash: lockScript2.computeHash()}
    const owner3 = {lockScript: lockScript3, lockHash: lockScript3.computeHash()}

    beforeEach(async () => {
      await createCell('1000', OutputStatus.Live, false, null, owner1)
      await createCell('1000', OutputStatus.Sent, false, null, owner1)
      await createCell('3000', OutputStatus.Dead, false, null, owner2)
    });

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
  });

  describe('#getSingleMultiSignCells', () => {
    const publicKeyHash = bob.lockScript.args
    const multiSignHash = new MultiSign().hash(publicKeyHash)
    const multiSignLockScript = SystemScriptInfo.generateMultiSignScript(multiSignHash)
    const pageSize = 2

    describe('with indexed multi sign outputs', () => {
      const user = {
        lockScript: multiSignLockScript
      }

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
        ]
        await getConnection().manager.save(cells)
      });
      describe('when there are records with multiSignBlake160 matched', () => {
        describe('one page contains all results', () => {
          let result: any
          beforeEach(async () => {
            result = await CellsService.getSingleMultiSignCells([publicKeyHash], 1, 10)
          })
          it('returns all items', () => {
            expect(result.totalCount).toEqual(3)
            expect(result.items.length).toEqual(3)
            const totalCapacity = result.items.reduce((total: number, cell: any) => total + parseInt(cell.capacity), 0)
            expect(totalCapacity).toEqual(100 * 3)
          })
          it('attaches setCustomizedAssetInfo to cells ', async () => {
            for (const item of result.items) {
              expect(item.customizedAssetInfo).toEqual({"data": "", "lock": "SingleMultiSign", "type": ""})
            }
          });
        });
        describe('within pagination scope', () => {
          it('returns first page result', async () => {
            const page = 1
            const result = await CellsService.getSingleMultiSignCells([publicKeyHash], page, pageSize)
            expect(result.totalCount).toEqual(3)
            expect(result.items.length).toEqual(pageSize)
          });
          it('returns the remaining cells for the last page', async () => {
            const page = 2
            const result = await CellsService.getSingleMultiSignCells([publicKeyHash], page, pageSize)
            expect(result.totalCount).toEqual(3)
            expect(result.items.length).toEqual(1)
          });
        });
        describe('outside pagination scope', () => {
          it('returns empty result', async () => {
            const page = 3
            const result = await CellsService.getSingleMultiSignCells([publicKeyHash], page, pageSize)
            expect(result.totalCount).toEqual(3)
            expect(result.items.length).toEqual(0)
          });
        });
      })
      describe('when there is no record with multiSignBlake160 matched', () => {
        it('returns empty result', async () => {
          const page = 1
          const result = await CellsService.getSingleMultiSignCells(['non exist hash'], page, pageSize)
          expect(result.totalCount).toEqual(0)
          expect(result.items.length).toEqual(0)
        });
      });
    });
    describe('with no indexed multi sign outputs', () => {
      it('returns empty result', async () => {
        const page = 1
        const result = await CellsService.getSingleMultiSignCells([publicKeyHash], page, pageSize)
        expect(result.totalCount).toEqual(0)
        expect(result.items.length).toEqual(0)
      });
    });
  })
})
