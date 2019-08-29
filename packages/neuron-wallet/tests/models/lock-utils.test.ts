import { Script, ScriptHashType } from '../../src/types/cell-types'
import LockUtils from '../../src/models/lock-utils'

const systemScript = {
  outPoint: {
    txHash: '0xc640423e9c8f53855a471c66e3d915fee4f653ac7f7e82033139d25df2ad9aad',
    index: '0',
  },
  codeHash: '0x68d5438ac952d2f584abf879527946a537e82c7f3c1cbf6d8ebf9767437d8e88',
  hashType: ScriptHashType.Type,
}

describe('LockUtils Test', () => {
  const bob = {
    lockScript: {
      codeHash: '0x68d5438ac952d2f584abf879527946a537e82c7f3c1cbf6d8ebf9767437d8e88',
      args: ['0x36c329ed630d6ce750712a477543672adab57f4c'],
      hashType: ScriptHashType.Type,
    },
    lockHash: '0x024b0fd0c4912e98aab6808f6474cacb1969255d526b3cac5d3bdd15962a8818',
    address: 'ckt1qyqrdsefa43s6m882pcj53m4gdnj4k440axqswmu83',
    blake160: '0x36c329ed630d6ce750712a477543672adab57f4c',
  }

  // const alice = {
  //   lockScript: {
  //     codeHash: '0x68d5438ac952d2f584abf879527946a537e82c7f3c1cbf6d8ebf9767437d8e88',
  //     args: ['0xe2193df51d78411601796b35b17b4f8f2cd85bd0'],
  //     hashType: ScriptHashType.Type,
  //   },
  //   lockHash: '0xf7173d209ce5773a6395735288a53b7182da4a8b0aa4718123208acf37a95196',
  //   address: 'ckt1qyqwyxfa75whssgkq9ukkdd30d8c7txct0gqfvmy2v',
  //   blake160: '0xe2193df51d78411601796b35b17b4f8f2cd85bd0',
  // }

  // TODO: it need network and node
  // it('lockScriptToHash', async () => {
  //   const lockHash: string = await LockUtils.lockScriptToHash(bob.lockScript)

  //   expect(lockHash).toEqual(bob.lockHash)
  // })

  // FIXME: test failed, should fix addressToLockScript
  it('addressToLockScript', async () => {
    const mockContractInfo = jest.fn()
    mockContractInfo.mockReturnValue(systemScript)
    LockUtils.systemScript = mockContractInfo.bind(LockUtils)

    const lockScript: Script = await LockUtils.addressToLockScript(bob.address)

    expect(lockScript).toEqual(bob.lockScript)
  })

  // TODO: it need network and node
  // it('addressToLockHash', async () => {
  //   const mockContractInfo = jest.fn()
  //   mockContractInfo.mockReturnValue(systemScript)
  //   LockUtils.systemScript = mockContractInfo.bind(LockUtils)

  //   const lockHash: string = await LockUtils.addressToLockHash(bob.address)

  //   expect(lockHash).toEqual(bob.lockHash)
  // })

  // it('addressToAllLockHashes', async () => {
  //   const mockContractInfo = jest.fn()
  //   mockContractInfo.mockReturnValue(systemScript)
  //   LockUtils.systemScript = mockContractInfo.bind(LockUtils)

  //   const lockHashes: string[] = await LockUtils.addressToAllLockHashes(bob.address)

  //   expect(lockHashes).toEqual([bob.lockHash])
  // })

  // it('addressesToAllLockHashes', async () => {
  //   const mockContractInfo = jest.fn()
  //   mockContractInfo.mockReturnValue(systemScript)
  //   LockUtils.systemScript = mockContractInfo.bind(LockUtils)

  //   const lockHashes: string[] = await LockUtils.addressesToAllLockHashes([bob.address, alice.address])

  //   const expectedResult = [bob.lockHash, alice.lockHash]

  //   expect(lockHashes).toEqual(expectedResult)
  // })

  it('lockScriptToAddress', async () => {
    const address: string = LockUtils.lockScriptToAddress(bob.lockScript)

    expect(address).toEqual(bob.address)
  })

  it('blake160ToAddress', async () => {
    const address: string = LockUtils.blake160ToAddress(bob.blake160)

    expect(address).toEqual(bob.address)
  })

  it('addressToBlake160', () => {
    const blake160 = LockUtils.addressToBlake160(bob.address)

    expect(blake160).toEqual(bob.blake160)
  })
})
