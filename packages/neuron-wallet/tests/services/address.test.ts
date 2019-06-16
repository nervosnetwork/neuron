import Addresses from '../../src/services/addresses'
import NodeService from '../../src/services/node'
import { ExtendedKey } from '../../src/keys/key';

const { utils } = NodeService.getInstance().core

describe('Key tests', () => {
  const { AddressPrefix } = utils

  it('Generate testnet address from public key', async () => {
    const publicKey = '0x024a501efd328e062c8675f2365970728c859c592beeefd6be8ead3d901330bc01'
    const address = Addresses.addressFromPublicKey(publicKey)
    expect('ckt1q9gry5zgxmpjnmtrp4kww5r39frh2sm89tdt2l6v234ygf').toBe(address)
  })

  it('Generate mainnet address from public key', async () => {
    const publicKey = '0x024a501efd328e062c8675f2365970728c859c592beeefd6be8ead3d901330bc01'
    const address = Addresses.addressFromPublicKey(publicKey, AddressPrefix.Mainnet)
    expect('ckb1q9gry5zgxmpjnmtrp4kww5r39frh2sm89tdt2l6vqdd7em').toBe(address)
  })

  it('Generate addresses from extended key', async () => {
    const extendedKey = new ExtendedKey(
      undefined, // '4e91f531d3351fd561506538ec0a68ba05d3d3444197e81d615ab76bbd200488'
      '024579b5711c35b33d6234b508822e1c6b67799a7bc4dc39ee3a0bde4e4aae407e',
      '769382d9761bef8ed409ce4f9d5aeae5b5260f6f60e50f791826c27ae7afc495'
    )
    const addresses = Addresses.generateAddresses(extendedKey, 2, 2)
    expect(2).toBe(addresses.receiving.length)
    expect('ckt1q9gry5zgmgxa776jt6k40ysfkhwv8egepeqwzuv6jqjt02').toBe(addresses.receiving[0].address)
    expect("m/44'/309'/0'/0/0").toBe(addresses.receiving[0].path)

    expect(2).toBe(addresses.change.length)
    expect('ckt1q9gry5zgclst8my3sdp75u0htlh56u8md3c4fttkum6mt3').toBe(addresses.change[0].address)
    expect("m/44'/309'/0'/1/0").toBe(addresses.change[0].path)
  })
})
