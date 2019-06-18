import AddressService from '../../src/services/addresses'
import NodeService from '../../src/services/node'
import { ExtendedPublicKey } from '../../src/keys/key'

const { utils } = NodeService.getInstance().core

describe('Key tests', () => {
  const { AddressPrefix } = utils

  it('Generate testnet address from public key', () => {
    const publicKey = '0x024a501efd328e062c8675f2365970728c859c592beeefd6be8ead3d901330bc01'
    const address = AddressService.addressFromPublicKey(publicKey)
    expect('ckt1q9gry5zgxmpjnmtrp4kww5r39frh2sm89tdt2l6v234ygf').toBe(address)
  })

  it('Generate mainnet address from public key', () => {
    const publicKey = '0x024a501efd328e062c8675f2365970728c859c592beeefd6be8ead3d901330bc01'
    const address = AddressService.addressFromPublicKey(publicKey, AddressPrefix.Mainnet)
    expect('ckb1q9gry5zgxmpjnmtrp4kww5r39frh2sm89tdt2l6vqdd7em').toBe(address)
  })

  it('Generate addresses from extended public key', () => {
    const extendedKey = new ExtendedPublicKey(
      '03e5b310636a0f6e7dcdfffa98f28d7ed70df858bb47acf13db830bfde3510b3f3',
      '37e85a19f54f0a242a35599abac64a71aacc21e3a5860dd024377ffc7e6827d8'
    )
    const addresses = AddressService.generateAddresses(extendedKey, 2, 2)
    expect(2).toBe(addresses.receiving.length)
    expect("m/44'/309'/0'/0/0").toBe(addresses.receiving[0].path)
    expect('ckt1q9gry5zgqt5rp0t0uxv39lahkzcnfjl9x9utn683yv9zxs').toBe(addresses.receiving[0].address)

    expect(2).toBe(addresses.change.length)
    expect("m/44'/309'/0'/1/1").toBe(addresses.change[1].path)
    expect('ckt1q9gry5zg7r0qgqc3vnvy8pwr0q8mkgvgywfjazg9xlz2ev').toBe(addresses.change[1].address)
  })
})
