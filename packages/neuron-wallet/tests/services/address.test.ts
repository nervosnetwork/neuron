import AddressService from '../../src/services/addresses'
import { ExtendedPublicKey } from '../../src/keys/key'

describe('Key tests', () => {
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
