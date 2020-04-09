import AssetAccountInfo from "../../src/models/asset-account-info"

describe('AssetAccountInfo', () => {
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
      expect(() => {
        new AssetAccountInfo(genesisBlockHash).getSudtCellDep()
      }).not.toThrowError()
    })

    it('getAnyoneCanPayCellDep', () => {
      expect(() => {
        new AssetAccountInfo(genesisBlockHash).getAnyoneCanPayCellDep()
      }).not.toThrowError()
    })

    it('generateSudtScript', () => {
      expect(() => {
        new AssetAccountInfo(genesisBlockHash).generateSudtScript('0x')
      }).not.toThrowError()
    })

    it('generateAnyoneCanPayScript', () => {
      expect(() => {
        new AssetAccountInfo(genesisBlockHash).generateAnyoneCanPayScript('0x')
      }).not.toThrowError()
    })
  })

  describe('other net', () => {
    const genesisBlockHash = '0x' + '0'.repeat(64)

    it('getSudtCellDep', () => {
      expect(() => {
        new AssetAccountInfo(genesisBlockHash).getSudtCellDep()
      }).toThrowError()
    })

    it('getAnyoneCanPayCellDep', () => {
      expect(() => {
        new AssetAccountInfo(genesisBlockHash).getAnyoneCanPayCellDep()
      }).toThrowError()
    })

    it('generateSudtScript', () => {
      expect(() => {
        new AssetAccountInfo(genesisBlockHash).generateSudtScript('0x')
      }).toThrowError()
    })

    it('generateAnyoneCanPayScript', () => {
      expect(() => {
        new AssetAccountInfo(genesisBlockHash).generateAnyoneCanPayScript('0x')
      }).toThrowError()
    })
  })
})
