import { AddressType } from '../../../src/models/keys/address'
import AddressDao, { Address, AddressVersion } from '../../../src/database/address/address-dao'

describe('balance', () => {
  beforeEach(async () => {
    AddressDao.deleteAll()
  })

  const generateAddress = (
    liveBalance: string | bigint,
    sentBalance: string | bigint,
    pendingBalance: string | bigint
  ) => {
    const addr = Math.round(Math.random() * 100000000).toString()
    const address: Address = {
      walletId: '1',
      address: addr,
      path: "m/44'/309'/0'/0/0",
      addressType: AddressType.Receiving,
      addressIndex: 0,
      txCount: 0,
      liveBalance: liveBalance.toString(),
      sentBalance: sentBalance.toString(),
      pendingBalance: pendingBalance.toString(),
      balance: '0',
      blake160: '0x36c329ed630d6ce750712a477543672adab57f4c',
      version: AddressVersion.Testnet,
    }
    return address
  }

  it('balance = live + sent - pending', async () => {
    const address = generateAddress('1000', '100', '300')
    const addrs: Address[] = await AddressDao.create([address])
    const addr = addrs[0]
    expect(addr.balance).toEqual((1000 + 100).toString())
  })

  it('the balance returned by the toInterface() is correct', async () => {
    const address = generateAddress('1000', '100', '300')
    const addrs: Address[] = AddressDao.create([address])
    const addr = addrs[0]
    expect(addr.balance).toEqual((1000 + 100).toString())
  })

  it('sent to others', async () => {
    // have 1000, sent to others 200, and refund 800
    const addresses = [generateAddress('0', '0', '1000'), generateAddress('0', '800', '0')]

    const addrs: Address[] = await AddressDao.create(addresses)
    const balance: bigint = addrs.map(addr => BigInt(addr.balance)).reduce((result, c) => result + c, BigInt(0))

    expect(balance).toEqual(BigInt(800))
  })

  it('send to self', async () => {
    // have 1000, sent to self 200, refund 800
    const addresses = [
      generateAddress('0', '0', '1000'),
      generateAddress('0', '200', '0'),
      generateAddress('0', '800', '0'),
    ]
    const addrs: Address[] = await AddressDao.create(addresses)
    const balance: bigint = addrs.map(addr => BigInt(addr.balance)).reduce((result, c) => result + c, BigInt(0))

    expect(balance).toEqual(BigInt(1000))
  })

  it('sent to others with 10 shannon fee', async () => {
    // have 1000, sent to others 200, and refund 790, with 10 shannon fee
    const addresses = [generateAddress('0', '0', '1000'), generateAddress('0', '790', '0')]

    const addrs: Address[] = await AddressDao.create(addresses)
    const balance: bigint = addrs.map(addr => BigInt(addr.balance)).reduce((result, c) => result + c, BigInt(0))

    expect(balance).toEqual(BigInt(790))
  })

  it('sent to self with 10 shannon fee', async () => {
    // have 1000, sent to self 200, and refund 790, with 10 shannon fee
    const addresses = [
      generateAddress('0', '0', '1000'),
      generateAddress('0', '200', '0'),
      generateAddress('0', '790', '0'),
    ]

    const addrs: Address[] = await AddressDao.create(addresses)
    const balance: bigint = addrs.map(addr => BigInt(addr.balance)).reduce((result, c) => result + c, BigInt(0))

    expect(balance).toEqual(BigInt(990))
  })
})
