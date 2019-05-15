// import { Script } from '../../src/appTypes/types'
import TransactionsService from '../../src/services/transactions'

// const contractInfo = {
//   outPoint: {
//     txHash: '0xb027f6103472559d62ce829b72d158e15072ed3ba4b3f89d9fd67c8e2c87197',
//     index: 0,
//   },
//   codeHash: '0x55a809b92c5c404989bfe523639a741f4368ecaa3d4c42d1eb8854445b1b798b',
// }

describe('TransactionsService Test', () => {
  const bob = {
    lockScript: {
      codeHash: '0x55a809b92c5c404989bfe523639a741f4368ecaa3d4c42d1eb8854445b1b798b',
      args: ['0x33366333323965643633306436636537353037313261343737353433363732616461623537663463'],
    },
    lockHash: '0x848ffe4178a3057077cb46ffd711dff753923d134c0235032fec0389bbb1eab9',
    address: 'ckt1q9gry5zgxmpjnmtrp4kww5r39frh2sm89tdt2l6v234ygf',
    blake160: '0x36c329ed630d6ce750712a477543672adab57f4c',
  }

  it('lockScriptToHash', async () => {
    const lockHash: string = TransactionsService.lockScriptToHash(bob.lockScript)

    expect(lockHash).toEqual(bob.lockHash)
  })

  // FIXME: test failed, should fix addressToLockScript
  // it('addressToLockScript', async () => {
  //   const mockContractInfo = jest.fn()
  //   mockContractInfo.mockReturnValue(contractInfo)
  //   TransactionsService.contractInfo = mockContractInfo.bind(TransactionsService)

  //   const lockScript: Script = await TransactionsService.addressToLockScript(bob.address)

  //   expect(lockScript).toEqual(bob.lockScript)
  // })

  // it('addressToLockHash', async () => {
  //   const mockContractInfo = jest.fn()
  //   mockContractInfo.mockReturnValue(contractInfo)
  //   TransactionsService.contractInfo = mockContractInfo.bind(TransactionsService)

  //   const lockHash: string = await TransactionsService.addressToLockHash(bob.address)

  //   expect(lockHash).toEqual(bob.lockHash)
  // })

  // TODO: now have some problem, wait
  // it('lockScriptToAddress', async () => {
  //   const address: string = TransactionsService.lockScriptToAddress(bob.lockScript)

  //   expect(address).toEqual(bob.address)
  // })

  it('blake160ToAddress', async () => {
    const address: string = TransactionsService.blake160ToAddress(bob.blake160)

    expect(address).toEqual(bob.address)
  })
})
