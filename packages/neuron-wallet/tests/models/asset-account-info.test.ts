import AssetAccountInfo from "../../src/models/asset-account-info"
import CellDep, { DepType } from "../../src/models/chain/cell-dep"
import OutPoint from "../../src/models/chain/out-point"
import { ScriptHashType } from "../../src/models/chain/script"

describe('AssetAccountInfo', () => {
  const testnetSudtInfo = {
    cellDep: new CellDep(new OutPoint('0xc1b2ae129fad7465aaa9acc9785f842ba3e6e8b8051d899defa89f5508a77958', '0'), DepType.Code),
    codeHash: '0x48dbf59b4c7ee1547238021b4869bceedf4eea6b43772e5d66ef8865b6ae7212',
    hashType: ScriptHashType.Data
  }

  const testnetAnyoneCanPayInfo = {
    cellDep: new CellDep(new OutPoint('0x4f32b3e39bd1b6350d326fdfafdfe05e5221865c3098ae323096f0bfc69e0a8c', '0'), DepType.DepGroup),
    codeHash: '0x86a1c6987a4acbe1a887cca4c9dd2ac9fcb07405bbeda51b861b18bbf7492c4b',
    hashType: ScriptHashType.Type
  }

  // TODO:
  // describe('mainnet', () => {
  //   const genesisBlockHash = '0x92b197aa1fba0f63633922c61c92375c9c074a93e85963554f5499fe1450d0e5'

  //   it('getSudtCellDep', () => {
  //     expect(() => {
  //       new AssetAccountInfo(genesisBlockHash).getSudtCellDep()
  //     }).not.toThrowError()
  //   })

  //   it('getAnyoneCanPayCellDep', () => {
  //     expect(() => {
  //       new AssetAccountInfo(genesisBlockHash).getAnyoneCanPayCellDep()
  //     }).not.toThrowError()
  //   })

  //   it('generateSudtScript', () => {
  //     expect(() => {
  //       new AssetAccountInfo(genesisBlockHash).generateSudtScript('0x')
  //     }).not.toThrowError()
  //   })

  //   it('generateAnyoneCanPayScript', () => {
  //     expect(() => {
  //       new AssetAccountInfo(genesisBlockHash).generateAnyoneCanPayScript('0x')
  //     }).not.toThrowError()
  //   })
  // })

  describe('testnet', () => {
    const genesisBlockHash = '0x63547ecf6fc22d1325980c524b268b4a044d49cda3efbd584c0a8c8b9faaf9e1'

    it('getSudtCellDep', () => {
      expect(
        new AssetAccountInfo(genesisBlockHash).sudtCellDep
      ).toEqual(testnetSudtInfo.cellDep)
    })

    it('getAnyoneCanPayCellDep', () => {
      expect(
        new AssetAccountInfo(genesisBlockHash).anyoneCanPayCellDep
      ).toEqual(testnetAnyoneCanPayInfo.cellDep)
    })

    it('generateSudtScript', () => {
      expect(
        new AssetAccountInfo(genesisBlockHash).generateSudtScript('0x').codeHash
      ).toEqual(testnetSudtInfo.codeHash)
    })

    it('generateAnyoneCanPayScript', () => {
      expect(
        new AssetAccountInfo(genesisBlockHash).generateAnyoneCanPayScript('0x').codeHash
      ).toEqual(testnetAnyoneCanPayInfo.codeHash)
    })
  })

  describe('other net', () => {
    const genesisBlockHash = '0x' + '0'.repeat(64)

    it('getSudtCellDep', () => {
      expect(
        new AssetAccountInfo(genesisBlockHash).sudtCellDep
      ).toEqual(testnetSudtInfo.cellDep)
    })

    it('getAnyoneCanPayCellDep', () => {
      expect(
        new AssetAccountInfo(genesisBlockHash).anyoneCanPayCellDep
      ).toEqual(testnetAnyoneCanPayInfo.cellDep)
    })

    it('generateSudtScript', () => {
      expect(
        new AssetAccountInfo(genesisBlockHash).generateSudtScript('0x').codeHash
      ).toEqual(testnetSudtInfo.codeHash)
    })

    it('generateAnyoneCanPayScript', () => {
      expect(
        new AssetAccountInfo(genesisBlockHash).generateAnyoneCanPayScript('0x').codeHash
      ).toEqual(testnetAnyoneCanPayInfo.codeHash)
    })
  })
})
