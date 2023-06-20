import 'dotenv/config'
import Transaction from '../../src/models/chain/transaction'
import CellDep from '../../src/models/chain/cell-dep'
import OutPoint from '../../src/models/chain/out-point'
import Input from '../../src/models/chain/input'
import Script from '../../src/models/chain/script'
import Output from '../../src/models/chain/output'
import { DEPLOY_KEY } from './keys'
import { config } from '@ckb-lumos/lumos'

const fromTxObject = (tx: any) =>
  Transaction.fromObject({
    ...tx,
    cellDeps: tx.cellDeps.map((dep: any) => {
      const outPoint = OutPoint.fromObject(dep.outPoint)
      const { depType } = tx
      return CellDep.fromObject({ outPoint, depType })
    }),
    inputs: tx.inputs.map((input: any) => {
      const previousOutput = OutPoint.fromObject(input.previousOutput)
      const { since } = input
      const lock = Script.fromObject(input.lock)
      return Input.fromObject({ previousOutput, since, lock })
    }),
    outputs: tx.outputs.map((output: any) => {
      const { capacity, type } = output
      const lock = Script.fromObject(output.lock)
      const outPoint = new OutPoint(output.outPoint.txHash, output.outPoint.index)
      return Output.fromObject({
        capacity,
        lock,
        type,
        outPoint,
      })
    }),
  })

/**
 * @description Basic transaction 0
 * from
 *   - ckt1qyqrdsefa43s6m882pcj53m4gdnj4k440axqswmu83
 * to
 *   - ckt1qyqwyxfa75whssgkq9ukkdd30d8c7txct0gqfvmy2v
 *   - ckt1qyqrdsefa43s6m882pcj53m4gdnj4k440axqswmu83
 */
const basicTx0 = {
  version: '0x0',
  cellDeps: [
    {
      outPoint: { txHash: '0x0d9c4af3dd158d6359c9d25d0a600f1dd20b86072b85a095e7bc70c34509b73d', index: '0x0' },
      depType: 'depGroup',
    },
  ],
  headerDeps: [],
  inputs: [
    {
      // address: ckt1qyqrdsefa43s6m882pcj53m4gdnj4k440axqswmu83
      previousOutput: { txHash: '0x1879851943fa686af29bed5c95acd566d0244e7b3ca89cf7c435622a5a5b4cb3', index: '0x0' },
      since: '0x0',
      lock: {
        args: '0x36c329ed630d6ce750712a477543672adab57f4c',
        codeHash: '0x9bd7e06f3ecf4be0f2fcd2188b23f1b9fcc88e5d4b65a8637b17723bbda3cce8',
        hashType: 'type',
      },
    },
  ],
  outputs: [
    {
      // address: ckt1qyqwyxfa75whssgkq9ukkdd30d8c7txct0gqfvmy2v
      capacity: '0x174876e800',
      lock: {
        codeHash: '0x9bd7e06f3ecf4be0f2fcd2188b23f1b9fcc88e5d4b65a8637b17723bbda3cce8',
        args: '0xe2193df51d78411601796b35b17b4f8f2cd85bd0',
        hashType: 'type',
      },
      type: null,
      outPoint: { txHash: '0x230ab250ee0ae681e88e462102e5c01a9994ac82bf0effbfb58d6c11a86579f1', index: '0' },
    },
    {
      // address: ckt1qyqrdsefa43s6m882pcj53m4gdnj4k440axqswmu83
      capacity: '0x12319d9962f4',
      lock: {
        codeHash: '0x9bd7e06f3ecf4be0f2fcd2188b23f1b9fcc88e5d4b65a8637b17723bbda3cce8',
        args: '0x36c329ed630d6ce750712a477543672adab57f4c',
        hashType: 'type',
      },
      type: null,
      outPoint: { txHash: '0x230ab250ee0ae681e88e462102e5c01a9994ac82bf0effbfb58d6c11a86579f1', index: '1' },
    },
  ],
  outputsData: ['0x', '0x'],
  witnesses: [
    '0x55000000100000005500000055000000410000003965f54cc684d35d886358ad57214e5f4a5fd13ecc7aba67950495b9be7740267a1d6bb14f1c215e3bc926f9655648b75e173ce6f5fd1e60218383b45503c30301',
  ],
  hash: '0x230ab250ee0ae681e88e462102e5c01a9994ac82bf0effbfb58d6c11a86579f1',
}

/**
 * @description Basic transaction 1
 * from
 *   - ckt1qyqrdsefa43s6m882pcj53m4gdnj4k440axqswmu83
 * to
 *   - ckt1qyqwyxfa75whssgkq9ukkdd30d8c7txcqqqqtrnpa5
 */
const basicTx1 = {
  version: '0x0',
  cellDeps: [
    {
      outPoint: {
        txHash: '0x0d9c4af3dd158d6359c9d25d0a600f1dd20b86072b85a095e7bc70c34509b73d',
        index: '0x0',
      },
      depType: 'depGroup',
    },
  ],
  headerDeps: [],
  inputs: [
    {
      // address: ckt1qyqrdsefa43s6m882pcj53m4gdnj4k440axqswmu83
      previousOutput: {
        txHash: '0x230ab250ee0ae681e88e462102e5c01a9994ac82bf0effbfb58d6c11a86579f1',
        index: '0x1',
      },
      since: '0x0',
      lock: {
        codeHash: '0x9bd7e06f3ecf4be0f2fcd2188b23f1b9fcc88e5d4b65a8637b17723bbda3cce8',
        args: '0x36c329ed630d6ce750712a477543672adab57f4c',
        hashType: 'type',
      },
    },
  ],
  outputs: [
    {
      // address: ckt1qyqwyxfa75whssgkq9ukkdd30d8c7txcqqqqtrnpa5
      capacity: '0x174876e800',
      lock: {
        codeHash: '0x9bd7e06f3ecf4be0f2fcd2188b23f1b9fcc88e5d4b65a8637b17723bbda3cce8',
        args: DEPLOY_KEY.blake160,
        hashType: 'type',
      },
      type: null,
      outPoint: { txHash: '0x230ab250ee0ae681e88e462102e5c01a9994ac82bf0effbfb58d6c11a8657900', index: '0' },
    },
  ],
  outputsData: ['0x'],
  witnesses: [],
  hash: '0x230ab250ee0ae681e88e462102e5c01a9994ac82bf0effbfb58d6c11a8657900',
}

/**
 * @description ACP Transaction 0
 * from
 *   - ckt1qyqwyxfa75whssgkq9ukkdd30d8c7txcqqqqtrnpa5
 * to
 *   - ckt1qyq9t2w0l0u7rnylrxmj2uq6a28sstnctcwfu4vnst4n3u0p2luawfsmjrmsz
 */
const ACPTx0 = {
  version: '0x0',
  cellDeps: [],
  inputs: [
    {
      previousOutput: {
        txHash: '0x230ab250ee0ae681e88e462102e5c01a9994ac82bf0effbfb58d6c11a8657900',
        index: '0x1',
      },
      since: '0x0',
      // address: ckt1qyqwyxfa75whssgkq9ukkdd30d8c7txcqqqqtrnpa5
      lock: {
        codeHash: '0x9bd7e06f3ecf4be0f2fcd2188b23f1b9fcc88e5d4b65a8637b17723bbda3cce8',
        args: DEPLOY_KEY.blake160,
        hashType: 'type',
      },
    },
  ],
  outputs: [
    {
      // address: ckt1qyq9t2w0l0u7rnylrxmj2uq6a28sstnctcwfu4vnst4n3u0p2luawfsmjrmsz
      lock: {
        args: '0xe2193df51d78411601796b35b17b4f8f2cd85bd0',
        codeHash: config.predefined.LINA.SCRIPTS.ANYONE_CAN_PAY.CODE_HASH,
        hashType: config.predefined.LINA.SCRIPTS.ANYONE_CAN_PAY.HASH_TYPE,
      },
      type: {
        args: '0xe2193df51d78411601796b35b17b4f8f2cd85bd0',
        codeHash: '0x0000000000000000000000000000000000000000000000000000000000000000',
        hashType: 'data',
      },
      capacity: '0x34e62ce00',
      outPoint: { txHash: '0x230ab250ee0ae681e88e462102e5c01a9994ac82bf0effbfb58d6c11a8657900', index: '0' },
    },
  ],
  outputsData: ['0x00000000000000000000000000000000'],
  headerDeps: [],
  hash: '0x025ef744cbc86e92c5c766233cac9a203a3c470dfa23cd5005c3a086e0b0b3f4',
  witnesses: [],
}

/**
 * @description ACP Transaction 1, CKB Asset Account Destroy
 * from
 *   - ckt1qyqwyxfa75whssgkq9ukkdd30d8c7txcqqqqtrnpa5
 * to
 *   - ckt1qyq9t2w0l0u7rnylrxmj2uq6a28sstnctcwfu4vnst4n3u0p2luawfsmjrmsz
 */
const ACPTx1 = {
  version: '0x0',
  cellDeps: [],
  inputs: [
    {
      previousOutput: {
        txHash: '0x025ef744cbc86e92c5c766233cac9a203a3c470dfa23cd5005c3a086e0b0b3f4',
        index: '0x1',
      },
      since: '0x0',
      lock: {
        codeHash: '0x9bd7e06f3ecf4be0f2fcd2188b23f1b9fcc88e5d4b65a8637b17723bbda3cce8',
        args: DEPLOY_KEY.blake160,
        hashType: 'type',
      },
    },
  ],
  outputs: [
    {
      // address: ckt1qyq9t2w0l0u7rnylrxmj2uq6a28sstnctcwfu4vnst4n3u0p2luawfsmjrmsz
      lock: {
        args: '0xe2193df51d78411601796b35b17b4f8f2cd85bd0',
        codeHash: config.predefined.LINA.SCRIPTS.ANYONE_CAN_PAY.CODE_HASH,
        hashType: config.predefined.LINA.SCRIPTS.ANYONE_CAN_PAY.HASH_TYPE,
      },
      capacity: '0x34e62ce00',
      outPoint: { txHash: '0x230ab250ee0ae681e88e462102e5c01a9994ac82bf0effbfb58d6c11a8657900', index: '0' },
    },
  ],
  outputsData: ['0x00000000000000000000000000000000'],
  headerDeps: [],
  hash: '0x025ef744cbc86e92c5c766233cac9a203a3c470dfa23cd5005c3a086e0b0b3f3',
  witnesses: [],
}

const basicTx2 = {
  version: '0x0',
  cellDeps: [
    {
      outPoint: {
        txHash: '0x0d9c4af3dd158d6359c9d25d0a600f1dd20b86072b85a095e7bc70c34509b73d',
        index: '0x0',
      },
      depType: 'depGroup',
    },
  ],
  headerDeps: [],
  inputs: [
    {
      // address: ckb1qyqt8xaupvm8837nv3gtc9x0ekkj64vud3jqfwyw5v
      previousOutput: {
        txHash: '0x230ab250ee0ae681e88e462102e5c01a9994ac82bf0effbfb58d6c11a86579f1',
        index: '0x1',
      },
      since: '0x0',
      lock: {
        codeHash: '0x9bd7e06f3ecf4be0f2fcd2188b23f1b9fcc88e5d4b65a8637b17723bbda3cce8',
        hashType: 'type',
        args: '0xb39bbc0b3673c7d36450bc14cfcdad2d559c6c64',
      },
    },
  ],
  outputs: [
    {
      // address: ckb1qyqt8xaupvm8837nv3gtc9x0ekkj64vud3jqfwyw5v
      capacity: '0x174876e800',
      lock: {
        codeHash: '0x9bd7e06f3ecf4be0f2fcd2188b23f1b9fcc88e5d4b65a8637b17723bbda3cce8',
        hashType: 'type',
        args: '0xb39bbc0b3673c7d36450bc14cfcdad2d559c6c64',
      },
      type: null,
      outPoint: { txHash: '0x230ab250ee0ae681e88e462102e5c01a9994ac82bf0effbfb58d6c11a8657900', index: '0' },
    },
  ],
  outputsData: ['0x'],
  witnesses: [],
  hash: '0x230ab250ee0ae681e88e462102e5c01a9994ac82bf0effbfb58d6c11a8657901',
}

// TODO: complex sUDT transaction
// TODO: dao transaction

export default [basicTx0, basicTx1, ACPTx0, ACPTx1, basicTx2].map(tx => fromTxObject(tx))
