import AddressService from '../../src/services/addresses'
import AddressDao, { Address, AddressVersion } from '../../src/database/address/address-dao'
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
    expect('ckt1qyqq96psh4h7rxgjl7mmpvf5e0jnz79earcsyrlxrx').toBe(addresses.testnetReceiving[0].address)

    // will include testnet address and mainnet address, [0] and [1] will be same
    expect(2).toBe(addresses.testnetChange.length)
    expect("m/44'/309'/0'/1/1").toBe(addresses.testnetChange[1].path)
    expect('ckt1qyq0phsyqvgkfkzrshphsramyxyz8yew3yzsl76naf').toBe(addresses.testnetChange[1].address)
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
    address: 'ckt1qyqrdsefa43s6m882pcj53m4gdnj4k440axqswmu83',
    path: "m/44'/309'/0'/0/0",
    addressType: AddressType.Receiving,
    addressIndex: 0,
    txCount: 0,
    liveBalance: '0',
    sentBalance: '0',
    pendingBalance: '0',
    balance: '0',
    blake160: '0x36c329ed630d6ce750712a477543672adab57f4c',
    version: AddressVersion.Testnet,
  }

  const usedAddress: Address = {
    walletId: '2',
    address: 'ckt1qyqrdsefa43s6m882pcj53m4gdnj4k440axqswmu83',
    path: "m/44'/309'/0'/0/0",
    addressType: AddressType.Receiving,
    addressIndex: 0,
    txCount: 1,
    liveBalance: '0',
    sentBalance: '0',
    pendingBalance: '0',
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
    liveBalance: '0',
    sentBalance: '0',
    pendingBalance: '0',
    balance: '0',
    blake160: '0x36c329ed630d6ce750712a477543672adab57f4c',
    version: AddressVersion.Testnet,
  }

  beforeEach(async () => {
    AddressDao.deleteAll()
  })

  const generate = (id: string = walletId) => {
    AddressService.generateAndSave(id, extendedKey, undefined, 0, 0, 2, 1)
  }

  const checkAndGenerate = (id: string = walletId) => {
    AddressService.checkAndGenerateSave(id, extendedKey, undefined, 2, 1)
  }

  it('generateAndSave', async () => {
    generate()

    const all = AddressDao.getAll()

    expect(all.length).toEqual((2 + 1) * 2)
  })

  it('checkAndGenerateSave', async () => {
    await generate()

    const all = AddressDao.getAll()

    const usedAll = all
      .map(one => {
        if (one.addressType === AddressType.Receiving) {
          const entity = one
          entity.txCount = 1
          return entity
        } else {
          return one
        }
      })
    AddressDao.updateAll(usedAll)

    await checkAndGenerate()

    const final = AddressDao.getAll()

    expect(final.length).toEqual((2 + 1) * 2 * 2)
  })

  it('generateAndSave with two wallet', () => {
    generate()
    generate('2')
    const all = AddressDao.getAll()

    expect(all.length).toEqual((2 + 1) * 2 * 2)
  })

  it('isAddressUsed', () => {
    AddressDao.create([address, usedAddress])
    const used = AddressService.isAddressUsed(address.address, walletId)
    expect(used).toBe(true)
  })

  it('nextUnusedAddress', () => {
    AddressDao.create([address, usedAddress, changeAddress])
    const addr = AddressService.nextUnusedAddress(walletId)
    const addrDao = AddressDao.nextUnusedAddress(walletId, AddressVersion.Testnet)
    expect(addr).toEqual(addrDao)
  })

  it('nextUnusedChangeAddress', () => {
    AddressDao.create([address, usedAddress, changeAddress])
    const addr = AddressService.nextUnusedChangeAddress(walletId)
    const addrDao = AddressDao.nextUnusedChangeAddress(walletId, AddressVersion.Testnet)
    expect(addr).toEqual(addrDao)
  })

  it('allAddresses', () => {
    generate()
    generate('2')
    const all = AddressService.allAddresses()
    expect(all.length).toEqual(6)
  })

  it('allAddressesByWalletId', () => {
    generate()
    generate('2')
    const all = AddressService.allAddressesByWalletId(walletId)
    expect(all.length).toEqual(3)
  })

  it('usedAddress', () => {
    AddressDao.create([address, usedAddress])

    const addr = AddressService.usedAddresses(walletId)
    expect(addr).toEqual([])
    const addr2 = AddressService.usedAddresses('2')
    expect(addr2).not.toEqual([])
  })
})
