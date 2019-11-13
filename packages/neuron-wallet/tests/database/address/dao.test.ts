import { AddressVersion } from '../../../src/database/address/entities/address'
import { AddressType } from '../../../src/models/keys/address'
import AddressDao, { Address } from '../../../src/database/address/dao'

describe('Address Dao tests', () => {
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

  it('create', async () => {
    AddressDao.create([address])

    const all = AddressDao.getAll()

    expect(all.length).toEqual(1)
    expect(all[0].address).toEqual(address.address)
  })

  // it('updateTxCount', async () => {
  //   const mockGetCount = jest.fn()
  //   const getCountByAddress = 10
  //   mockGetCount.mockReturnValue(getCountByAddress)
  //   TransactionsService.getCountByAddress = mockGetCount.bind(TransactionsService)

  //   const daos = await AddressDao.create([address])
  //   const dao = daos[0]
  //   expect(dao.txCount).toEqual(0)
  //   await AddressDao.updateTxCount(address.address)
  //   dao.reload()
  //   expect(dao.txCount).toEqual(getCountByAddress)
  // })

  it('nextUnusedAddress', async () => {
    AddressDao.create([address, usedAddress])

    const addr = AddressDao.nextUnusedAddress('1', AddressVersion.Testnet)
    expect(addr!.address).toEqual(address.address)

    const usedAddr = AddressDao.nextUnusedAddress('2', AddressVersion.Testnet)
    expect(usedAddr).toBe(undefined)

    const mainnetAddr = AddressDao.nextUnusedAddress('1', AddressVersion.Mainnet)
    expect(mainnetAddr).toBe(undefined)
  })

  it('nextUnusedChangeAddress', async () => {
    AddressDao.create([address, usedAddress, changeAddress])

    const addr = AddressDao.nextUnusedChangeAddress('1', AddressVersion.Testnet)
    expect(addr!.address).toEqual(changeAddress.address)

    const usedAddr = AddressDao.nextUnusedAddress('2', AddressVersion.Testnet)
    expect(usedAddr).toBe(undefined)

    const mainnetAddr = AddressDao.nextUnusedAddress('1', AddressVersion.Mainnet)
    expect(mainnetAddr).toBe(undefined)
  })

  it('allAddresses', async () => {
    AddressDao.create([address, usedAddress])

    const all = AddressDao.allAddresses(AddressVersion.Testnet)

    const allMainnet = AddressDao.allAddresses(AddressVersion.Mainnet)

    expect(all.length).toEqual(2)
    expect(allMainnet.length).toEqual(0)
  })

  it('allAddressesByWalletId', async () => {
    AddressDao.create([address, usedAddress])

    const all = AddressDao.allAddressesByWalletId('1', AddressVersion.Testnet)
    expect(all.length).toEqual(1)
  })

  it('usedAddressByWalletId', async () => {
    AddressDao.create([address, usedAddress])

    const walletOne = AddressDao.usedAddressesByWalletId('1', AddressVersion.Testnet)
    expect(walletOne.length).toEqual(0)

    const walletTwo = AddressDao.usedAddressesByWalletId('2', AddressVersion.Testnet)
    expect(walletTwo.length).toEqual(1)
  })

  it('findByAddress', async () => {
    AddressDao.create([address, usedAddress])

    const one = AddressDao.findByAddress(address.address, address.walletId)

    expect(one!.address).toEqual(address.address)
  })
})
