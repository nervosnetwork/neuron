import Transaction from "../../../src/models/chain/transaction"
import CellDep, { DepType } from "../../../src/models/chain/cell-dep"
import OutPoint from "../../../src/models/chain/out-point"
import Input from "../../../src/models/chain/input"
import Script, { ScriptHashType } from "../../../src/models/chain/script"
import Output from "../../../src/models/chain/output"
import { TransactionPersistor } from "../../../src/services/tx"
import initConnection from "../../../src/database/chain/ormconfig"
import TransactionEntity from "../../../src/database/chain/entities/transaction"
import { getConnection } from "typeorm"

const tx = Transaction .fromObject({
  "version": "0x0",
  "cellDeps": [
    CellDep.fromObject({
      "outPoint": OutPoint.fromObject({
        "txHash": "0x0d9c4af3dd158d6359c9d25d0a600f1dd20b86072b85a095e7bc70c34509b73d",
        "index": "0x0"
      }),
      "depType": "depGroup" as DepType
    })
  ],
  "headerDeps": [],
  "inputs": [
    Input.fromObject({
      "previousOutput": OutPoint.fromObject({
        "txHash": "0x1879851943fa686af29bed5c95acd566d0244e7b3ca89cf7c435622a5a5b4cb3",
        "index": "0x0"
      }),
      "since": "0x0",
      "lock": Script.fromObject({
        "args": "0x36c329ed630d6ce750712a477543672adab57f4c",
        "codeHash": "0x9bd7e06f3ecf4be0f2fcd2188b23f1b9fcc88e5d4b65a8637b17723bbda3cce8",
        "hashType": "type" as ScriptHashType
      })
    })
  ],
  "outputs": [
    Output.fromObject({
      "capacity": "0x174876e800",
      "lock": Script.fromObject({
        "codeHash": "0x9bd7e06f3ecf4be0f2fcd2188b23f1b9fcc88e5d4b65a8637b17723bbda3cce8",
        "args": "0xe2193df51d78411601796b35b17b4f8f2cd85bd0",
        "hashType": "type" as ScriptHashType
      }),
      "type": null,
      outPoint: new OutPoint("0x230ab250ee0ae681e88e462102e5c01a9994ac82bf0effbfb58d6c11a86579f1", '0')
    }),
    Output.fromObject({
      "capacity": "0x12319d9962f4",
      "lock": Script.fromObject({
        "codeHash": "0x9bd7e06f3ecf4be0f2fcd2188b23f1b9fcc88e5d4b65a8637b17723bbda3cce8",
        "args": "0x36c329ed630d6ce750712a477543672adab57f4c",
        "hashType": "type" as ScriptHashType
      }),
      "type": null,
      outPoint: new OutPoint("0x230ab250ee0ae681e88e462102e5c01a9994ac82bf0effbfb58d6c11a86579f1", '1')
    })
  ],
  "outputsData": [
    "0x",
    "0x"
  ],
  "witnesses": [
    "0x55000000100000005500000055000000410000003965f54cc684d35d886358ad57214e5f4a5fd13ecc7aba67950495b9be7740267a1d6bb14f1c215e3bc926f9655648b75e173ce6f5fd1e60218383b45503c30301"
  ],
  "hash": "0x230ab250ee0ae681e88e462102e5c01a9994ac82bf0effbfb58d6c11a86579f1"
})

const tx2 = Transaction .fromObject({
  "version": "0x0",
  "cellDeps": [
    CellDep.fromObject({
      "outPoint": OutPoint.fromObject({
        "txHash": "0x0d9c4af3dd158d6359c9d25d0a600f1dd20b86072b85a095e7bc70c34509b73d",
        "index": "0x0"
      }),
      "depType": "depGroup" as DepType
    })
  ],
  "headerDeps": [],
  "inputs": [
    Input.fromObject({
      "previousOutput": OutPoint.fromObject({
        "txHash": "0x230ab250ee0ae681e88e462102e5c01a9994ac82bf0effbfb58d6c11a86579f1",
        "index": "0x1"
      }),
      "since": "0x0",
      "lock": Script.fromObject({
        "codeHash": "0x9bd7e06f3ecf4be0f2fcd2188b23f1b9fcc88e5d4b65a8637b17723bbda3cce8",
        "args": "0x36c329ed630d6ce750712a477543672adab57f4c",
        "hashType": "type" as ScriptHashType
      })
    })
  ],
  "outputs": [
    Output.fromObject({
      "capacity": "0x174876e800",
      "lock": Script.fromObject({
        "codeHash": "0x9bd7e06f3ecf4be0f2fcd2188b23f1b9fcc88e5d4b65a8637b17723bbda3cce8",
        "args": "0xe2193df51d78411601796b35b17b4f8f2cd80000",
        "hashType": "type" as ScriptHashType
      }),
      "type": null,
      outPoint: new OutPoint("0x230ab250ee0ae681e88e462102e5c01a9994ac82bf0effbfb58d6c11a8657900", '0')
    })
  ],
  "outputsData": [
    "0x",
    "0x"
  ],
  "witnesses": [
  ],
  "hash": "0x230ab250ee0ae681e88e462102e5c01a9994ac82bf0effbfb58d6c11a8657900"
})

describe('TransactionPersistor', () => {
  beforeAll(async done => {
    await initConnection('0x1234')
    done()
  })

  afterAll(async done => {
    await getConnection().close()
    done()
  })

  beforeEach(async done => {
    const connection = getConnection()
    await connection.synchronize(true)
    done()
  })

  describe('saveWithFetch', () => {
    it('multiSignBlake160', async () => {
      const multiSignBlake160 = '0x' + '6'.repeat(40)
      await TransactionPersistor.saveWithFetch(tx)
      await TransactionPersistor.saveWithFetch(tx2)
      const txDup = Transaction.fromObject({ ...tx })
      txDup.outputs[1].setMultiSignBlake160(multiSignBlake160)
      await TransactionPersistor.saveWithFetch(txDup)
      const loadedTx = await getConnection()
        .getRepository(TransactionEntity)
        .createQueryBuilder('tx')
        .leftJoinAndSelect('tx.inputs', 'input')
        .leftJoinAndSelect('tx.outputs', 'output')
        .where(`tx.hash = :txHash`, { txHash: txDup.hash! })
        .getOne()
      expect(loadedTx!.inputs[0].multiSignBlake160).toBe(null)
      expect(loadedTx!.outputs[0].multiSignBlake160).toBe(null)
      expect(loadedTx!.outputs[1].multiSignBlake160).toEqual(multiSignBlake160)
      const loadedTx2 = await getConnection()
        .getRepository(TransactionEntity)
        .createQueryBuilder('tx')
        .leftJoinAndSelect('tx.inputs', 'input')
        .leftJoinAndSelect('tx.outputs', 'output')
        .where(`tx.hash = :txHash`, { txHash: tx2.hash! })
        .getOne()
      expect(loadedTx2!.inputs[0].multiSignBlake160).toEqual(multiSignBlake160)
      expect(loadedTx2!.outputs[0].multiSignBlake160).toBe(null)
    })
  })
})
