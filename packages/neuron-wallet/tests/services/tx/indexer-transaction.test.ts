import TransactionEntity from '../../../src/database/chain/entities/transaction'
import OutputEntity from '../../../src/database/chain/entities/output'
import InputEntity from '../../../src/database/chain/entities/input'
import { getConnection } from 'typeorm'
import initConnection from '../../../src/database/chain/ormconfig'
import IndexerTransaction from '../../../src/services/tx/indexer-transaction'
import { OutputStatus } from '../../../src/models/chain/output'
import { TransactionStatus } from '../../../src/models/chain/transaction'
import Script, { ScriptHashType } from '../../../src/models/chain/script'

describe('IndexerTransaction', () => {
  const tx1: TransactionEntity = new TransactionEntity()
  tx1.hash = '0x' + '0'.repeat(64)
  tx1.version = '0x0'
  tx1.cellDeps = []
  tx1.headerDeps = []
  tx1.witnesses = []
  tx1.timestamp = (+new Date()).toString()
  tx1.blockNumber = '0x1'
  tx1.blockHash = '0x' + '0'.repeat(64)
  tx1.status = TransactionStatus.Success
  tx1.inputs = []
  tx1.outputs = []

  const tx1Input = new InputEntity()
  tx1Input.outPointTxHash = '0x' + '1'.repeat(64)
  tx1Input.outPointIndex = '0'
  tx1Input.since = '0'
  tx1Input.lockHash = '0x' + '2'.repeat(64)
  tx1Input.capacity = '100'
  tx1.inputs.push(tx1Input)

  const tx1Output: OutputEntity = new OutputEntity()
  tx1Output.capacity = '100000000000'
  tx1Output.outPointTxHash = tx1.hash
  tx1Output.outPointIndex = '0'
  tx1Output.lock = Script.fromObject({"args":"0x94c1720fdff98d1c0100cfb0e7ae42e470b53019","codeHash":"0x9bd7e06f3ecf4be0f2fcd2188b23f1b9fcc88e5d4b65a8637b17723bbda3cce8","hashType":"type" as ScriptHashType})
  tx1Output.status = 'live'
  tx1Output.lockHash = '0xb58a6fa6f2c57ed45fbdfc7fcebd5c79575590ecf190b72fa6e6a767d57cb105'
  tx1Output.hasData = false

  tx1.outputs.push(tx1Output)


  const tx2 = new TransactionEntity()
  tx2.hash = '0x' + '2'.repeat(64)
  tx2.version = '0x0'
  tx2.cellDeps = []
  tx2.headerDeps = []
  tx2.witnesses = []
  tx2.timestamp = (+new Date()).toString()
  tx2.blockNumber = '0x2'
  tx2.blockHash = '0x' + '0'.repeat(64)
  tx2.status = TransactionStatus.Success
  tx2.inputs = []
  tx2.outputs = []

  const tx2Input = new InputEntity()
  tx2Input.outPointTxHash = tx1.hash
  tx2Input.outPointIndex = '0'
  tx2Input.since = '0'
  tx2Input.lockHash = null // tx1Output.lockHash
  tx2Input.capacity = null // tx1Output.capacity
  tx2.inputs.push(tx2Input)

  const tx2Output = new OutputEntity()
  tx2Output.capacity = '50000000000'
  tx2Output.outPointTxHash = tx2.hash
  tx2Output.outPointIndex = '0'
  tx2Output.lock = Script.fromObject({"args":"0x94c1720fdff98d1c0100cfb0e7ae42e470b53019","codeHash":"0x9bd7e06f3ecf4be0f2fcd2188b23f1b9fcc88e5d4b65a8637b17723bbda3cce8","hashType":"type" as ScriptHashType})
  tx2Output.status = 'live'
  tx2Output.lockHash = '0xb58a6fa6f2c57ed45fbdfc7fcebd5c79575590ecf190b72fa6e6a767d57cb105'
  tx2Output.hasData = false
  tx2.outputs.push(tx2Output)

  beforeAll(async () => {
    await initConnection('0x1234')
  })

  afterAll(async () => {
    await getConnection().close()
  })

  it('updateInputLockHash', async () => {
    await getConnection().manager.save([tx1, tx1Input, tx1Output, tx2, tx2Input, tx2Output])

    await IndexerTransaction.updateInputLockHash(tx2Input.outPointTxHash!, tx2Input.outPointIndex!)

    await tx1Output.reload()
    expect(tx1Output.status).toEqual(OutputStatus.Dead)
    await tx2Input.reload()
    expect(tx2Input.lockHash).toEqual(tx1Output.lockHash)
    expect(tx2Input.capacity).toEqual(tx1Output.capacity)

    const inputCount: number = await getConnection()
      .getRepository(InputEntity)
      .createQueryBuilder('input')
      .getCount()

    expect(inputCount).toEqual(2)

    const outputCount: number = await getConnection()
      .getRepository(OutputEntity)
      .createQueryBuilder('output')
      .getCount()

    expect(outputCount).toEqual(2)
  })
})
