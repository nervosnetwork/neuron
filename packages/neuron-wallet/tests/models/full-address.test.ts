import FullAddress from "../../src/models/full-address"
import { ScriptHashType } from "../../src/models/chain/script"

describe('FullAddress', () => {
  const address = 'ckb1qjda0cr08m85hc8jlnfp3zer7xulejywt49kt2rr0vthywaa50xw3vumhs9nvu786dj9p0q5elx66t24n3kxgj53qks'
  const hashType = ScriptHashType.Type
  const codeHash = '0x9bd7e06f3ecf4be0f2fcd2188b23f1b9fcc88e5d4b65a8637b17723bbda3cce8'
  const args = '0xb39bbc0b3673c7d36450bc14cfcdad2d559c6c64'

  it('parse', () => {
    const script = FullAddress.parse(address)
    expect(script.codeHash).toEqual(codeHash)
    expect(script.args).toEqual(args)
    expect(script.hashType).toEqual(hashType)
  })

  describe("isFullFormat", () => {
    it("full format", () => {
      expect(FullAddress.isFullFormat(address)).toBeTruthy()
    })

    it('short format', () => {
      expect(FullAddress.isFullFormat('ckt1qyqrdsefa43s6m882pcj53m4gdnj4k440axqswmu83')).toBeFalsy()
    })
  })
})
