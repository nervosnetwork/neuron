import { Script } from '../../src/appTypes/types'
import TransactionsService from '../../src/services/transactions'

const contractInfo = {
  outPoint: {
    blockHash: null,
    cell: {
      txHash: '0xbffab7ee0a050e2cb882de066d3dbf3afdd8932d6a26eda44f06e4b23f0f4b5a',
      index: '1',
    },
  },
  codeHash: '0x9e3b3557f11b2b3532ce352bfe8017e9fd11d154c4c7f9b7aaaa1e621b539a08',
}

describe('TransactionsService Test', () => {
  const bob = {
    lockScript: {
      codeHash: '0x9e3b3557f11b2b3532ce352bfe8017e9fd11d154c4c7f9b7aaaa1e621b539a08',
      args: ['0x36c329ed630d6ce750712a477543672adab57f4c'],
    },
    lockHash: '0x3dbdeb3538b7abe1b1f85a86b150805728c29b26faceb5051fb6c7f92c346ed8',
    address: 'ckt1q9gry5zgxmpjnmtrp4kww5r39frh2sm89tdt2l6v234ygf',
    blake160: '0x36c329ed630d6ce750712a477543672adab57f4c',
  }

  it('lockScriptToHash', async () => {
    const lockHash: string = TransactionsService.lockScriptToHash(bob.lockScript)

    expect(lockHash).toEqual(bob.lockHash)
  })

  // FIXME: test failed, should fix addressToLockScript
  it('addressToLockScript', async () => {
    const mockContractInfo = jest.fn()
    mockContractInfo.mockReturnValue(contractInfo)
    TransactionsService.contractInfo = mockContractInfo.bind(TransactionsService)

    const lockScript: Script = await TransactionsService.addressToLockScript(bob.address)

    expect(lockScript).toEqual(bob.lockScript)
  })

  it('addressToLockHash', async () => {
    const mockContractInfo = jest.fn()
    mockContractInfo.mockReturnValue(contractInfo)
    TransactionsService.contractInfo = mockContractInfo.bind(TransactionsService)

    const lockHash: string = await TransactionsService.addressToLockHash(bob.address)

    expect(lockHash).toEqual(bob.lockHash)
  })

  it('lockScriptToAddress', async () => {
    const address: string = TransactionsService.lockScriptToAddress(bob.lockScript)

    expect(address).toEqual(bob.address)
  })

  it('blake160ToAddress', async () => {
    const address: string = TransactionsService.blake160ToAddress(bob.blake160)

    expect(address).toEqual(bob.address)
  })
})
