import Address from '../src/address/index'
import ckbCore from '../src/core'

describe('Key tests', () => {
  const { utils } = ckbCore
  const { AddressPrefix } = utils

  it('Generate testnet address from public key', async () => {
    const publicKey = '0x024a501efd328e062c8675f2365970728c859c592beeefd6be8ead3d901330bc01'
    const address = Address.addressFromPublicKey(publicKey)
    expect('ckt1q9gry5zgxmpjnmtrp4kww5r39frh2sm89tdt2l6v234ygf').toBe(address)
  })

  it('Generate mainnet address from public key', async () => {
    const publicKey = '0x024a501efd328e062c8675f2365970728c859c592beeefd6be8ead3d901330bc01'
    const address = Address.addressFromPublicKey(publicKey, AddressPrefix.Mainnet)
    expect('ckb1q9gry5zgxmpjnmtrp4kww5r39frh2sm89tdt2l6vqdd7em').toBe(address)
  })

  it('Generate addresses from key data', async () => {
    const keysData = {
      privateKey: '4e91f531d3351fd561506538ec0a68ba05d3d3444197e81d615ab76bbd200488',
      chainCode: '769382d9761bef8ed409ce4f9d5aeae5b5260f6f60e50f791826c27ae7afc495',
    }
    const addresses = Address.generateAddresses(keysData, 2, 2)
    expect(2).toBe(addresses.receiving.length)
    expect('ckt1q9gry5zgy4tp7rnhacvl49rqgcufpn6hsacc2edvdzg26n').toBe(addresses.receiving[0].address)
    expect("m/44'/360'/0'/0/0").toBe(addresses.receiving[0].path)

    expect(2).toBe(addresses.change.length)
    expect('ckt1q9gry5zgl0arwx02534dv6k6mfarffgulzqmxwvgpfvk23').toBe(addresses.change[0].address)
    expect("m/44'/360'/0'/1/0").toBe(addresses.change[0].path)
  })
})
