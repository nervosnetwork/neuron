import AddressService from '../../src/services/addresses'
import { AccountExtendedPublicKey } from '../../src/keys/key'

describe('Key tests', () => {
  it('Generate addresses from extended public key', () => {
    const extendedKey = new AccountExtendedPublicKey(
      '03e5b310636a0f6e7dcdfffa98f28d7ed70df858bb47acf13db830bfde3510b3f3',
      '37e85a19f54f0a242a35599abac64a71aacc21e3a5860dd024377ffc7e6827d8'
    )
    const addresses = AddressService.generateAddresses('1', extendedKey, 2, 2)

    expect(2).toBe(addresses.testnetReceiving.length)
    expect("m/44'/309'/0'/0/0").toBe(addresses.testnetReceiving[0].path)
    expect('ckt1q9gry5zgqt5rp0t0uxv39lahkzcnfjl9x9utn683yv9zxs').toBe(addresses.testnetReceiving[0].address)

    // will include testnet address and mainnet address, [0] and [1] will be same
    expect(2).toBe(addresses.testnetChange.length)
    expect("m/44'/309'/0'/1/1").toBe(addresses.testnetChange[1].path)
    expect('ckt1q9gry5zg7r0qgqc3vnvy8pwr0q8mkgvgywfjazg9xlz2ev').toBe(addresses.testnetChange[1].address)
  })
})
