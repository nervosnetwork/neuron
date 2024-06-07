import Multisig from '../../src/models/multisig'

describe('MultiSign Test', () => {
  const minutes = 360
  const headerEpoch = '0x7080018000001'
  const expectedSince = '0x0200007b00f00020'

  const bob = {
    privateKey: '0xe79f3207ea4980b7fed79956d5934249ceac4751a4fae01a0f7c4a96884bc4e3',
    publicKey: '0x024a501efd328e062c8675f2365970728c859c592beeefd6be8ead3d901330bc01',
    blake160: '0x36c329ed630d6ce750712a477543672adab57f4c',
    hash: '0x56f281b3d4bb5fc73c751714af0bf78eb8aba0d8',
  }
  const expectedArgs = '0x56f281b3d4bb5fc73c751714af0bf78eb8aba0d80200007b00f00020'
  const serialized = '0x0000010136c329ed630d6ce750712a477543672adab57f4c'

  it('since', () => {
    const since = Multisig.since(minutes, headerEpoch)
    expect(since).toEqual(expectedSince)
  })

  it('since, minutes < 0', () => {
    expect(() => {
      Multisig.since(-1, headerEpoch)
    }).toThrowError()
  })

  it('serialize', () => {
    const s = Multisig.serialize([bob.blake160])
    expect(s).toEqual(serialized)
  })

  it('serialize with r/m/n', () => {
    const s = Multisig.serialize([bob.blake160], 1, 2, 3)
    expect(s).toEqual('0x0001020336c329ed630d6ce750712a477543672adab57f4c')
  })

  it('serialize with r/m/n exception', () => {
    expect(() => {
      Multisig.serialize([bob.blake160], 1, 2, 300)
    }).toThrow()
  })

  it('hash', () => {
    const hash = Multisig.hash([bob.blake160])
    expect(hash).toEqual(bob.hash)
  })

  it('args', () => {
    const args = Multisig.args(bob.blake160, minutes, headerEpoch)
    expect(args).toEqual(expectedArgs)
  })
})
