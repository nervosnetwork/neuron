import Transaction from '../../../src/models/chain/transaction'
import CellDep, { DepType } from '../../../src/models/chain/cell-dep'
import OutPoint from '../../../src/models/chain/out-point'
import Input from '../../../src/models/chain/input'
import Script, { ScriptHashType } from '../../../src/models/chain/script'
import Output from '../../../src/models/chain/output'
import TransactionSender from '../../../src/services/transaction-sender'
import Keystore from '../../../src/models/keys/keystore'
import WalletService from '../../../src/services/wallets'
import { AddressType } from '../../../src/models/keys/address'

describe('TransactionSender Test', () => {
  describe('sign', () => {
    const walletService = new WalletService()
    let walletID = ''
    beforeEach(() => {
      const wallet1 = {
        name: 'wallet-test1',
        id: '11',
        extendedKey: '',
        keystore: new Keystore(
          {
            cipher: 'wallet1',
            cipherparams: { iv: 'wallet1' },
            ciphertext: 'wallet1',
            kdf: '1',
            kdfparams: {
              dklen: 1,
              n: 1,
              r: 1,
              p: 1,
              salt: '1',
            },
            mac: '1',
          },
          '0'
        ),
      }
      const { id } = walletService.create(wallet1)
      walletID = id
    })

    afterEach(() => {
      walletService.clearAll()
    })

    const transactionSender = new TransactionSender()
    const pathAndPrivateKey = {
      path: '',
      privateKey: '0xe79f3207ea4980b7fed79956d5934249ceac4751a4fae01a0f7c4a96884bc4e3'
    }

    const mockGetPk = jest.fn()
    mockGetPk.mockReturnValue([pathAndPrivateKey])
    transactionSender.getPrivateKeys = mockGetPk.bind(transactionSender)

    const addr = {
      walletId: walletID,
      address: '',
      path: '',
      addressType: AddressType.Receiving,
      addressIndex: 1,
      txCount: 0,
      liveBalance: '0',
      sentBalance: '0',
      pendingBalance: '0',
      balance: '0',
      blake160: "0x36c329ed630d6ce750712a477543672adab57f4c",
      version: 'testnet'
    }

    const mockGAI = jest.fn()
    mockGAI.mockReturnValue([addr])
    transactionSender.getAddressInfos = mockGAI.bind(transactionSender)

    describe('single sign', () => {
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
            "type": null
          }),
          Output.fromObject({
            "capacity": "0x12319d9962f4",
            "lock": Script.fromObject({
              "codeHash": "0x9bd7e06f3ecf4be0f2fcd2188b23f1b9fcc88e5d4b65a8637b17723bbda3cce8",
              "args": "0x36c329ed630d6ce750712a477543672adab57f4c",
              "hashType": "type" as ScriptHashType
            }),
            "type": null
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

      it('success', () => {
        // @ts-ignore: Private method
        const ntx = transactionSender.sign(walletID, tx, '1234')

        expect(ntx.witnesses[0]).toEqual(tx.witnesses[0])
      })
    })

    // describe('multi sign with since', () => {
    //   const tx = Transaction .fromObject({
    //     "version": "0x0",
    //     "cellDeps": [
    //       CellDep.fromObject({
    //         "outPoint": OutPoint.fromObject({
    //           "txHash": "0x0d9c4af3dd158d6359c9d25d0a600f1dd20b86072b85a095e7bc70c34509b73d",
    //           "index": "0x1"
    //         }),
    //         "depType": "depGroup" as DepType
    //       })
    //     ],
    //     "headerDeps": [],
    //     "inputs": [
    //       Input.fromObject({
    //         "previousOutput": OutPoint.fromSDK({
    //           "txHash": "0xf1181e7d0ef95fa2e6c334f6aa647520a898d9f8259a2bb021a622434bc73a63",
    //           "index": "0x0"
    //         }),
    //         "since": "0x2000f00078000002",
    //         "lock": Script.fromObject({
    //           "args": "0x36c329ed630d6ce750712a477543672adab57f4c",
    //           "codeHash": "0x9bd7e06f3ecf4be0f2fcd2188b23f1b9fcc88e5d4b65a8637b17723bbda3cce8",
    //           "hashType": "type" as ScriptHashType
    //         })
    //       })
    //     ],
    //     "outputs": [
    //       Output.fromObject({
    //         "capacity": "0xd18c2e2800",
    //         "lock": Script.fromObject({
    //           "codeHash": "0x9bd7e06f3ecf4be0f2fcd2188b23f1b9fcc88e5d4b65a8637b17723bbda3cce8",
    //           "args": "0x36c329ed630d6ce750712a477543672adab57f4c",
    //           "hashType": "type" as ScriptHashType
    //         }),
    //         "type": null
    //       })
    //     ],
    //     "outputsData": [
    //       "0x"
    //     ],
    //     "witnesses": [
    //       "0x6d000000100000006d0000006d000000590000000000010136c329ed630d6ce750712a477543672adab57f4c1c12c81448189a3455996c31022b8a5407a3d54ff1710eaf4220375f906cb53423040ca9f81e56f41f2df0d6cfd124dbda30b8213a0b15173b745e20449afd5401"
    //     ],
    //     "hash": "0x7e69c5b95b25aa70e6e72f0e29ec7b92d6415f4bdacfb9562f9d40c3fddb8dca"
    //   })

    //   it('success', () => {
    //     // @ts-ignore: Private method
    //     const ntx = transactionSender.sign(walletID, tx, '1234', true)

    //     expect(ntx.witnesses[0]).toEqual(tx.witnesses[0])
    //   })
    // })
  })
})
