import Script, { ScriptHashType } from '../../../src/models/chain/script'

describe('Script', () => {
  const codeHash = '0x9bd7e06f3ecf4be0f2fcd2188b23f1b9fcc88e5d4b65a8637b17723bbda3cce8'
  const args = '0x36c329ed630d6ce750712a477543672adab57f4c'
  const hashType = ScriptHashType.Type

  const script = new Script(codeHash, args, hashType)
  const expectedLockHash = '0x1f2615a8dde4e28ca736ff763c2078aff990043f4cbf09eb4b3a58a140a0862d'

  it('new', () => {
    expect(script.codeHash).toEqual(codeHash)
    expect(script.args).toEqual(args)
    expect(script.hashType).toEqual(hashType)
  })

  it("computeHash", () => {
    const hash = script.computeHash()
    expect(hash).toEqual(expectedLockHash)
  })

  it('toSDK', () => {
    const i = script.toSDK()
    expect(i.codeHash).toEqual(script.codeHash)
    expect(i.args).toEqual(script.args)
    expect(i.hashType).toEqual(script.hashType)
  })

  it('fromSDK', () => {
    const s = Script.fromSDK({
      codeHash,
      args,
      hashType
    })
    expect(s.codeHash).toEqual(script.codeHash)
    expect(s.args).toEqual(script.args)
    expect(s.hashType).toEqual(script.hashType)
  })
})
