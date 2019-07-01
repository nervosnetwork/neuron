import AddressService from '../../src/services/addresses'
import initConnection, { getConnection } from '../../src/database/address/ormconfig'
import AddressEntity, { AddressVersion } from '../../src/database/address/entities/address'
import AddressDao, { Address } from '../../src/database/address/dao'
import { AddressType } from '../../src/models/keys/address'
import { AccountExtendedPublicKey } from '../../src/models/keys/key'

const walletId = '1'
const extendedKey = new AccountExtendedPublicKey(
  '03e5b310636a0f6e7dcdfffa98f28d7ed70df858bb47acf13db830bfde3510b3f3',
  '37e85a19f54f0a242a35599abac64a71aacc21e3a5860dd024377ffc7e6827d8'
)

describe('Key tests', () => {
  it('Generate addresses from extended public key', () => {
    const addresses = AddressService.generateAddresses('1', extendedKey, 0, 0, 2, 2)

    expect(2).toBe(addresses.testnetReceiving.length)
    expect("m/44'/309'/0'/0/0").toBe(addresses.testnetReceiving[0].path)
    expect('ckt1q9gry5zgqt5rp0t0uxv39lahkzcnfjl9x9utn683yv9zxs').toBe(addresses.testnetReceiving[0].address)

    // will include testnet address and mainnet address, [0] and [1] will be same
    expect(2).toBe(addresses.testnetChange.length)
    expect("m/44'/309'/0'/1/1").toBe(addresses.testnetChange[1].path)
    expect('ckt1q9gry5zg7r0qgqc3vnvy8pwr0q8mkgvgywfjazg9xlz2ev').toBe(addresses.testnetChange[1].address)
  })

  it('toAddress', () => {
    const metaInfo = {
      walletId,
      accountExtendedPublicKey: extendedKey,
      addressType: AddressType.Receiving,
      addressIndex: 0,
    }

    // @ts-ignore
    const addrs = AddressService.toAddress(metaInfo)
    expect(addrs.length).toEqual(2)
    expect(addrs[0].version).toEqual(AddressVersion.Testnet)
    expect(addrs[1].version).toEqual(AddressVersion.Mainnet)
    expect(addrs[0].path).toEqual(addrs[1].path)
  })
})

describe('Key tests with db', () => {
  const address: Address = {
    walletId: '1',
    address: 'ckt1q9gry5zgxmpjnmtrp4kww5r39frh2sm89tdt2l6v234ygf',
    path: "m/44'/309'/0'/0/0",
    addressType: AddressType.Receiving,
    addressIndex: 0,
    txCount: 0,
    balance: '0',
    blake160: '0x36c329ed630d6ce750712a477543672adab57f4c',
    version: AddressVersion.Testnet,
  }

  const usedAddress: Address = {
    walletId: '2',
    address: 'ckt1q9gry5zgxmpjnmtrp4kww5r39frh2sm89tdt2l6v234ygf',
    path: "m/44'/309'/0'/0/0",
    addressType: AddressType.Receiving,
    addressIndex: 0,
    txCount: 1,
    balance: '0',
    blake160: '0x36c329ed630d6ce750712a477543672adab57f4c',
    version: AddressVersion.Testnet,
  }

  const changeAddress: Address = {
    walletId: '1',
    address: 'ckt1q9gry5zgugvnmaga0pq3vqtedv6mz7603ukdsk7sk7v7d3',
    path: "m/44'/309'/0'/0/0",
    addressType: AddressType.Change,
    addressIndex: 0,
    txCount: 0,
    balance: '0',
    blake160: '0x36c329ed630d6ce750712a477543672adab57f4c',
    version: AddressVersion.Testnet,
  }

  beforeAll(async () => {
    await initConnection()
  })

  afterAll(async () => {
    await getConnection().close()
  })

  beforeEach(async () => {
    const connection = getConnection()
    await connection.dropDatabase()
    await connection.synchronize()
  })

  const generate = async (id: string = walletId) => {
    await AddressService.generateAndSave(id, extendedKey, 0, 0, 2, 1)
  }

  const checkAndGenerate = async (id: string = walletId) => {
    await AddressService.checkAndGenerateSave(id, extendedKey, 2, 1)
  }

  it('generateAndSave', async () => {
    await generate()

    const all = await getConnection()
      .getRepository(AddressEntity)
      .createQueryBuilder('address')
      .getMany()

    expect(all.length).toEqual((2 + 1) * 2)
  })

  it('checkAndGenerateSave', async () => {
    await generate()

    const all = await getConnection()
      .getRepository(AddressEntity)
      .createQueryBuilder('address')
      .getMany()

    const usedAll = all
      .filter(one => one.addressType === AddressType.Receiving)
      .map(one => {
        const entity = one
        entity.txCount = 1
        return entity
      })
    await getConnection().manager.save(usedAll)

    await checkAndGenerate()

    const final = await getConnection()
      .getRepository(AddressEntity)
      .createQueryBuilder('address')
      .getMany()

    expect(final.length).toEqual((2 + 1) * 2 * 2)
  })

  it('generateAndSave with two wallet', async () => {
    await generate()
    await generate('2')
    const all = await getConnection()
      .getRepository(AddressEntity)
      .createQueryBuilder('address')
      .getMany()

    expect(all.length).toEqual((2 + 1) * 2 * 2)
  })

  it('isAddressUsed', async () => {
    await AddressDao.create([address, usedAddress])
    const used = await AddressService.isAddressUsed(address.address, walletId)
    expect(used).toBe(true)
  })

  it('nextUnusedAddress', async () => {
    await AddressDao.create([address, usedAddress, changeAddress])
    const addr = await AddressService.nextUnusedAddress(walletId)
    const addrDao = await AddressDao.nextUnusedAddress(walletId, AddressVersion.Testnet)
    expect(addr).toEqual(addrDao && addrDao.toInterface())
  })

  it('nextUnusedChangeAddress', async () => {
    await AddressDao.create([address, usedAddress, changeAddress])
    const addr = await AddressService.nextUnusedChangeAddress(walletId)
    const addrDao = await AddressDao.nextUnusedChangeAddress(walletId, AddressVersion.Testnet)
    expect(addr).toEqual(addrDao && addrDao.toInterface())
  })

  it('allAddresses', async () => {
    await generate()
    await generate('2')
    const all = await AddressService.allAddresses()
    expect(all.length).toEqual(6)
  })

  it('allAddressesByWalletId', async () => {
    await generate()
    await generate('2')
    const all = await AddressService.allAddressesByWalletId(walletId)
    expect(all.length).toEqual(3)
  })

  it('usedAddress', async () => {
    await AddressDao.create([address, usedAddress])

    const addr = await AddressService.usedAddresses(walletId)
    expect(addr).toEqual([])
    const addr2 = await AddressService.usedAddresses('2')
    expect(addr2).not.toEqual([])
  })
})
