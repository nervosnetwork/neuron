import { AGGRON4 } from '../../src/utils/systemScripts'
import AssetAccountInfo from '../../src/models/asset-account-info'
import CellDep, { DepType } from '../../src/models/chain/cell-dep'
import OutPoint from '../../src/models/chain/out-point'
import { hd } from '@ckb-lumos/lumos'
import AddressMeta from '../../src/database/address/meta'

const { AddressType } = hd

describe('AssetAccountInfo', () => {
  const { SUDT, ANYONE_CAN_PAY } = AGGRON4.SCRIPTS
  const testnetSudtInfo = {
    cellDep: new CellDep(new OutPoint(SUDT.TX_HASH, SUDT.INDEX), SUDT.DEP_TYPE as DepType),
    codeHash: SUDT.CODE_HASH,
    hashType: SUDT.HASH_TYPE,
  }

  const testnetAnyoneCanPayInfo = {
    cellDep: new CellDep(
      new OutPoint(ANYONE_CAN_PAY.TX_HASH, ANYONE_CAN_PAY.INDEX),
      ANYONE_CAN_PAY.DEP_TYPE as DepType
    ),
    codeHash: ANYONE_CAN_PAY.CODE_HASH,
    hashType: ANYONE_CAN_PAY.HASH_TYPE,
  }

  describe('testnet', () => {
    const genesisBlockHash = '0x63547ecf6fc22d1325980c524b268b4a044d49cda3efbd584c0a8c8b9faaf9e1'

    it('getSudtCellDep', () => {
      expect(new AssetAccountInfo(genesisBlockHash).sudtCellDep).toEqual(testnetSudtInfo.cellDep)
    })

    it('getAnyoneCanPayCellDep', () => {
      expect(new AssetAccountInfo(genesisBlockHash).anyoneCanPayCellDep).toEqual(testnetAnyoneCanPayInfo.cellDep)
    })

    it('generateSudtScript', () => {
      expect(new AssetAccountInfo(genesisBlockHash).generateSudtScript('0x').codeHash).toEqual(testnetSudtInfo.codeHash)
    })

    it('generateAnyoneCanPayScript', () => {
      expect(new AssetAccountInfo(genesisBlockHash).generateAnyoneCanPayScript('0x').codeHash).toEqual(
        testnetAnyoneCanPayInfo.codeHash
      )
    })

    describe('#findSignPathForCheque', () => {
      const assetAccountInfo = new AssetAccountInfo()
      const receiverAddressInfo = AddressMeta.fromObject({
        walletId: '1',
        address: 'ckt!1',
        path: 'p1',
        addressType: AddressType.Change,
        addressIndex: 0,
        blake160: '0xe2193df51d78411601796b35b17b4f8f2cd85bd0',
      })
      const senderAddressInfo = AddressMeta.fromObject({
        walletId: '1',
        address: 'ckt!2',
        path: 'p2',
        addressType: AddressType.Change,
        addressIndex: 1,
        blake160: '0xe2193df51d78411601796b35b17b4f8f2cd85bd1',
      })
      const chequeScript = assetAccountInfo.generateChequeScript(
        receiverAddressInfo.generateDefaultLockScript().computeHash(),
        senderAddressInfo.generateDefaultLockScript().computeHash()
      )
      describe('receiver address is ordered first', () => {
        const addressInfos = [receiverAddressInfo, senderAddressInfo]
        it('found receiver path', async () => {
          const addressInfo = await AssetAccountInfo.findSignPathForCheque(addressInfos, chequeScript.args)
          expect(addressInfo!.blake160).toEqual(receiverAddressInfo.blake160)
        })
      })
      describe('sender address is ordered first and receiver later', () => {
        const addressInfos = [senderAddressInfo, receiverAddressInfo]
        it('found receiver path', async () => {
          const addressInfo = await AssetAccountInfo.findSignPathForCheque(addressInfos, chequeScript.args)
          expect(addressInfo!.blake160).toEqual(receiverAddressInfo.blake160)
        })
      })
      describe('only sender exists in the address info candidates', () => {
        const addressInfos = [senderAddressInfo]
        it('found sender path', async () => {
          const addressInfo = await AssetAccountInfo.findSignPathForCheque(addressInfos, chequeScript.args)
          expect(addressInfo!.blake160).toEqual(senderAddressInfo.blake160)
        })
      })
      describe('neither sender address nor receiver address found', () => {
        const addressInfos: any = []
        it('return null', async () => {
          const addressInfo = await AssetAccountInfo.findSignPathForCheque(addressInfos, chequeScript.args)
          expect(addressInfo).toEqual(null)
        })
      })
    })
  })

  describe('other net', () => {
    const genesisBlockHash = '0x' + '0'.repeat(64)

    it('getSudtCellDep', () => {
      expect(new AssetAccountInfo(genesisBlockHash).sudtCellDep).toEqual(testnetSudtInfo.cellDep)
    })

    it('getAnyoneCanPayCellDep', () => {
      expect(new AssetAccountInfo(genesisBlockHash).anyoneCanPayCellDep).toEqual(testnetAnyoneCanPayInfo.cellDep)
    })

    it('generateSudtScript', () => {
      expect(new AssetAccountInfo(genesisBlockHash).generateSudtScript('0x').codeHash).toEqual(testnetSudtInfo.codeHash)
    })

    it('generateAnyoneCanPayScript', () => {
      expect(new AssetAccountInfo(genesisBlockHash).generateAnyoneCanPayScript('0x').codeHash).toEqual(
        testnetAnyoneCanPayInfo.codeHash
      )
    })
  })
})
