import HD from '../../src/keys/hd'
import { AddressType } from '../../src/services/addresses'
import { ExtendedPublicKey } from '../../src/keys/key'

describe('HD', () => {
  it('path from index', () => {
    expect(HD.pathFor(AddressType.Receiving, 0)).toEqual(`m/44'/309'/0'/0/0`)
    expect(HD.pathFor(AddressType.Receiving, 1)).toEqual(`m/44'/309'/0'/0/1`)
    expect(HD.pathFor(AddressType.Change, 0)).toEqual(`m/44'/309'/0'/1/0`)
    expect(HD.pathFor(AddressType.Change, 1)).toEqual(`m/44'/309'/0'/1/1`)

    expect(HD.pathForReceiving(0)).toEqual(`m/44'/309'/0'/0/0`)
    expect(HD.pathForReceiving(1)).toEqual(`m/44'/309'/0'/0/1`)
    expect(HD.pathForChange(0)).toEqual(`m/44'/309'/0'/1/0`)
    expect(HD.pathForChange(1)).toEqual(`m/44'/309'/0'/1/1`)
  })

  it('key from extended public key', () => {
    const extendedKey = new ExtendedPublicKey(
      '03e5b310636a0f6e7dcdfffa98f28d7ed70df858bb47acf13db830bfde3510b3f3',
      '37e85a19f54f0a242a35599abac64a71aacc21e3a5860dd024377ffc7e6827d8'
    )
    const receivingAndPath = HD.keyFromExtendedPublicKey(extendedKey, AddressType.Receiving, 0)
    expect(receivingAndPath.publicKey).toEqual('0331b3c0225388c5010e3507beb28ecf409c022ef6f358f02b139cbae082f5a2a3')
    expect(receivingAndPath.path).toEqual(`m/44'/309'/0'/0/0`)

    const changeKeyAndPath = HD.keyFromExtendedPublicKey(extendedKey, AddressType.Change, 1)
    expect(changeKeyAndPath.publicKey).toEqual('0360bf05c11e7b4ac8de58077554e3d777acd64bf4abb9cd947002eb98a4827bba')
    expect(changeKeyAndPath.path).toEqual(`m/44'/309'/0'/1/1`)
  })
})
