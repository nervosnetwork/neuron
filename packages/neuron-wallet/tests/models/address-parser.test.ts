import AddressParser from "../../src/models/address-parser"
import { ScriptHashType } from "../../src/models/chain/script"

describe('AddressParser', () => {
  const fullAddressInfo = {
    address: 'ckb1qjda0cr08m85hc8jlnfp3zer7xulejywt49kt2rr0vthywaa50xw3vumhs9nvu786dj9p0q5elx66t24n3kxgj53qks',
    codeHash: '0x9bd7e06f3ecf4be0f2fcd2188b23f1b9fcc88e5d4b65a8637b17723bbda3cce8',
    args: '0xb39bbc0b3673c7d36450bc14cfcdad2d559c6c64',
    hashType: ScriptHashType.Type
  }

  const shortAddressInfo = {
    codeHash: '0x9bd7e06f3ecf4be0f2fcd2188b23f1b9fcc88e5d4b65a8637b17723bbda3cce8',
    args: '0x36c329ed630d6ce750712a477543672adab57f4c',
    hashType: ScriptHashType.Type,
    address: 'ckt1qyqrdsefa43s6m882pcj53m4gdnj4k440axqswmu83',
  }

  const multiSignAddressInfo = {
    address: 'ckb1qyq5lv479ewscx3ms620sv34pgeuz6zagaaqklhtgg',
    hashType: ScriptHashType.Type,
    args: '0x4fb2be2e5d0c1a3b8694f832350a33c1685d477a',
    codeHash: '0x5c5069eb0857efc65e1bca0c07df34c31663b3622fd3876c876320fc9634e2a8'
  }

  const shortACPAddressInfo = {
    codeHash: '0x0000000000000000000000000000000000000000000000000000000000000000',
    args: '0x4fb2be2e5d0c1a3b8694f832350a33c1685d477a',
    hashType: ScriptHashType.Type,
    address: 'ckb1qypylv479ewscx3ms620sv34pgeuz6zagaaqvrugu7',
  }

  describe('parse', () => {
    it('full address', () => {
      const script = AddressParser.parse(fullAddressInfo.address)
      expect(script.codeHash).toEqual(fullAddressInfo.codeHash)
      expect(script.args).toEqual(fullAddressInfo.args)
      expect(script.hashType).toEqual(fullAddressInfo.hashType)
    })

    it('default lock short address', () => {
      const script = AddressParser.parse(shortAddressInfo.address)
      expect(script.codeHash).toEqual(shortAddressInfo.codeHash)
      expect(script.args).toEqual(shortAddressInfo.args)
      expect(script.hashType).toEqual(shortAddressInfo.hashType)
    })

    it ('multi sign short address', () => {
      const script = AddressParser.parse(multiSignAddressInfo.address)
      expect(script.codeHash).toEqual(multiSignAddressInfo.codeHash)
      expect(script.args).toEqual(multiSignAddressInfo.args)
      expect(script.hashType).toEqual(multiSignAddressInfo.hashType)
    })

    it ('acp short address', () => {
      const script = AddressParser.parse(shortACPAddressInfo.address)
      expect(script.codeHash).toEqual(shortACPAddressInfo.codeHash)
      expect(script.args).toEqual(shortACPAddressInfo.args)
      expect(script.hashType).toEqual(shortACPAddressInfo.hashType)
    })
  })

  it('batchParse', () => {
    const result = AddressParser.batchParse([
      shortAddressInfo.address,
      fullAddressInfo.address,
      shortACPAddressInfo.address
    ])
    expect(result.length).toEqual(3)
    expect(result[0].codeHash).toEqual(shortAddressInfo.codeHash)
    expect(result[0].args).toEqual(shortAddressInfo.args)
    expect(result[0].hashType).toEqual(shortAddressInfo.hashType)
    expect(result[1].codeHash).toEqual(fullAddressInfo.codeHash)
    expect(result[1].args).toEqual(fullAddressInfo.args)
    expect(result[1].hashType).toEqual(fullAddressInfo.hashType)
    expect(result[2].codeHash).toEqual(shortACPAddressInfo.codeHash)
    expect(result[2].args).toEqual(shortACPAddressInfo.args)
    expect(result[2].hashType).toEqual(shortACPAddressInfo.hashType)
  })

})
